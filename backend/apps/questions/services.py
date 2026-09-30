import hashlib
import logging
import re

from django.db import transaction

from apps.exams.models import Subject, Topic

from . import ai
from .models import Question, QuestionExplanation, QuestionOption

log = logging.getLogger(__name__)
DIFFICULTIES = {"easy", "medium", "hard"}


class DuplicateQuestion(Exception):
    def __init__(self, question):
        self.question = question


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def content_hash(text: str, options: list[str]) -> str:
    base = "|".join([clean(text).lower(), *sorted(clean(o).lower() for o in options)])
    return hashlib.sha256(base.encode()).hexdigest()


def resolve_subject(name: str | None, create: bool = False) -> Subject | None:
    name = clean(name or "")
    if not name:
        return None
    subject = Subject.objects.filter(name__iexact=name).first()
    if subject or not create:
        return subject
    return Subject.objects.create(name=name)


def resolve_topic(subject: Subject | None, name: str | None) -> Topic | None:
    name = clean(name or "")[:150]
    if not (subject and name):
        return None
    return Topic.objects.filter(subject=subject, name__iexact=name).first() or Topic.objects.create(subject=subject, name=name)


def validate_question(q: Question) -> tuple[bool, list[str]]:
    """Deterministic validation. A question is usable in a mock only if it passes."""
    notes = []
    if len(clean(q.text)) < 10:
        notes.append("Question text is too short")
    options = list(q.options.all())
    if len(options) < 2:
        notes.append("Fewer than two options")
    texts = [clean(o.text).lower() for o in options]
    if any(not t for t in texts):
        notes.append("Empty option")
    if len(set(texts)) != len(texts):
        notes.append("Duplicate options")
    correct = [o for o in options if o.is_correct]
    if not correct:
        notes.append("No correct answer set")
    elif len(correct) > 1:
        notes.append("More than one correct option")
    return not notes, notes


def revalidate(q: Question) -> Question:
    ok, notes = validate_question(q)
    q.is_valid, q.validation_notes = ok, "; ".join(notes)
    q.save(update_fields=["is_valid", "validation_notes"])
    return q


def set_correct_option(q: Question, index: int, source: str) -> None:
    options = list(q.options.all())
    if not 0 <= index < len(options):
        return
    for i, o in enumerate(options):
        o.is_correct = i == index
        o.save(update_fields=["is_correct"])
    q.answer_source = source
    q.save(update_fields=["answer_source"])


@transaction.atomic
def create_question(*, owner, exam=None, subject=None, topic=None, text, text_hi="", options, options_hi=None, correct_index=None,
                    difficulty="medium", origin=Question.Origin.MANUAL, source="", paper=None,
                    explanation="", explanation_hi="", answer_source=None, allow_duplicates=False) -> Question:
    text = clean(text)
    options = [clean(o) for o in options]
    digest = content_hash(text, options)
    if not allow_duplicates:
        dup = Question.objects.filter(owner=owner, content_hash=digest).first()
        if dup:
            raise DuplicateQuestion(dup)
    if isinstance(subject, str):
        subject = resolve_subject(subject)
    if isinstance(topic, str):
        topic = resolve_topic(subject, topic)
    has_answer = correct_index is not None and 0 <= correct_index < len(options)
    q = Question.objects.create(
        owner=owner, exam=exam, subject=subject, topic=topic, paper=paper, text=text, text_hi=clean(text_hi),
        difficulty=difficulty if difficulty in DIFFICULTIES else "medium", origin=origin, source=source[:255],
        answer_source=answer_source or (Question.AnswerSource.KEY if has_answer else Question.AnswerSource.MISSING),
        content_hash=digest,
    )
    options_hi_list = options_hi or []
    QuestionOption.objects.bulk_create(
        QuestionOption(question=q, text=o, text_hi=clean(options_hi_list[i]) if i < len(options_hi_list) else "", order=i, is_correct=has_answer and i == correct_index)
        for i, o in enumerate(options)
    )
    if explanation or explanation_hi:
        QuestionExplanation.objects.create(question=q, text=explanation, text_hi=clean(explanation_hi))
    return revalidate(q)


def update_question(q: Question, *, subject=None, topic_name=None, difficulty=None, correct_index=None) -> Question:
    if subject is not None:
        q.subject = subject
        q.topic = resolve_topic(subject, topic_name) if topic_name else None
    elif topic_name and q.subject:
        q.topic = resolve_topic(q.subject, topic_name)
    if difficulty in DIFFICULTIES:
        q.difficulty = difficulty
    q.save()
    if correct_index is not None:
        set_correct_option(q, correct_index, Question.AnswerSource.MANUAL)
    return revalidate(q)


def allowed_subjects_for_exam(exam) -> dict[str, list[str]]:
    subjects = Subject.objects.filter(patternsection__pattern__exam=exam).distinct().prefetch_related("topics")
    return {s.name: [t.name for t in s.topics.all()] for s in subjects}


def classify_with_ai(questions: list[Question], exam) -> int:
    """Classify subject/topic/difficulty and infer missing answers. Returns number of questions updated."""
    if not (ai.is_enabled() and questions and exam):
        return 0
    allowed = allowed_subjects_for_exam(exam)
    updated = 0
    for i in range(0, len(questions), 15):
        batch = questions[i : i + 15]
        by_id = {q.id: q for q in batch}
        items = [
            {"id": q.id, "text": q.text, "options": [o.text for o in q.options.all()],
             "has_answer": q.options.filter(is_correct=True).exists()}
            for q in batch
        ]
        try:
            results = ai.classify_questions(items, allowed)
        except Exception:
            log.exception("AI classification failed for batch starting at %s", i)
            continue
        for r in results:
            q = by_id.get(r.get("id"))
            if not q:
                continue
            subject = resolve_subject(r.get("subject"))
            if subject and subject.name in allowed:
                q.subject = subject
                q.topic = resolve_topic(subject, r.get("topic"))
            if r.get("difficulty") in DIFFICULTIES:
                q.difficulty = r["difficulty"]
            q.save()
            idx = r.get("answer_index")
            if isinstance(idx, int) and not q.options.filter(is_correct=True).exists():
                set_correct_option(q, idx, Question.AnswerSource.AI)
            revalidate(q)
            updated += 1
    return updated


def get_or_create_explanation(q: Question) -> str:
    existing = getattr(q, "explanation", None)
    if existing:
        return existing.text
    options = list(q.options.all())
    correct = next((i for i, o in enumerate(options) if o.is_correct), None)
    if correct is None:
        raise ValueError("Question has no correct option")
    text = ai.explain_question(q.text, [o.text for o in options], correct)
    QuestionExplanation.objects.update_or_create(question=q, defaults={"text": text})
    return text
