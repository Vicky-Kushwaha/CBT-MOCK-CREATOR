"""Deterministic mock building. No AI decisions here - only counting, selection and snapshotting."""
import random
from collections import Counter, defaultdict

from django.db import transaction
from django.db.models import Q

from apps.papers.models import QuestionPaper
from apps.questions.models import Question

from .models import MockQuestion, MockTest


class InsufficientQuestions(Exception):
    def __init__(self, availability: dict):
        self.availability = availability
        super().__init__("Not enough valid questions for this exam pattern")


def candidate_pool(owner, exam, paper_ids):
    """Valid, classified questions from the selected papers plus the user's manual/AI-generated ones for this exam."""
    return Question.objects.filter(is_valid=True, subject__isnull=False).filter(
        Q(paper_id__in=paper_ids, paper__owner=owner)
        | Q(owner=owner, exam=exam, origin__in=[Question.Origin.MANUAL, Question.Origin.AI_GENERATED])
    )


def availability(owner, exam, paper_ids) -> dict:
    pattern = exam.pattern
    sections = list(pattern.sections.prefetch_related("subjects"))
    remaining = Counter(candidate_pool(owner, exam, paper_ids).values_list("subject_id", flat=True))
    rows, required, available = [], 0, 0
    for s in sections:
        s_subject_ids = [sub.id for sub in s.subjects.all()]
        pool = sum(remaining[sub_id] for sub_id in s_subject_ids)
        take = min(pool, s.question_count)
        
        to_take = take
        for sub_id in s_subject_ids:
            if to_take == 0: break
            taken_from_sub = min(remaining[sub_id], to_take)
            remaining[sub_id] -= taken_from_sub
            to_take -= taken_from_sub

        rows.append({
            "name": s.name, "subject_ids": s_subject_ids, "subject": ", ".join(sub.name for sub in s.subjects.all()),
            "required": s.question_count, "available": take, "shortfall": s.question_count - take,
        })
        required += s.question_count
        available += take
    papers = QuestionPaper.objects.filter(owner=owner, id__in=paper_ids)
    paper_qs = Question.objects.filter(paper__in=papers)
    return {
        "required_questions": required,
        "available_questions": available,
        "shortfall": required - available,
        "status": "ok" if available == required and required > 0 else "insufficient",
        "sections": rows,
        "unclassified_questions": paper_qs.filter(subject__isnull=True).count(),
        "invalid_questions": paper_qs.filter(is_valid=False).count(),
    }


def _pick(pool: list, n: int, distribution: dict) -> list:
    buckets = defaultdict(list)
    for q in pool:
        buckets[q.difficulty].append(q)
    for b in buckets.values():
        random.shuffle(b)
    picked = []
    for level in ("easy", "medium", "hard"):
        target = round(n * distribution.get(level, 0) / 100)
        picked.extend(buckets[level][:target])
    picked = picked[:n]
    chosen = {q.id for q in picked}
    leftovers = [q for q in pool if q.id not in chosen]
    random.shuffle(leftovers)
    picked.extend(leftovers[: n - len(picked)])
    random.shuffle(picked)
    return picked


@transaction.atomic
def create_mock(owner, exam, paper_ids, title: str | None = None) -> MockTest:
    a = availability(owner, exam, paper_ids)
    if a["status"] != "ok":
        raise InsufficientQuestions(a)
    pattern = exam.pattern
    by_subject = defaultdict(list)
    for q in candidate_pool(owner, exam, paper_ids):
        by_subject[q.subject_id].append(q)

    mock = MockTest.objects.create(
        owner=owner, exam=exam, title=title or f"{exam.name} Mock", duration_minutes=pattern.duration_minutes,
        total_marks=pattern.total_marks, instructions=pattern.instructions,
    )
    used, order, rows = set(), 1, []
    for section in pattern.sections.prefetch_related("subjects"):
        s_subject_ids = [sub.id for sub in section.subjects.all()]
        pool = []
        for sub_id in s_subject_ids:
            pool.extend([q for q in by_subject[sub_id] if q.id not in used])
            
        for q in _pick(pool, section.question_count, pattern.difficulty_distribution):
            used.add(q.id)
            rows.append(MockQuestion(
                mock=mock, question=q, section_name=section.name, order=order,
                marks=section.marks_per_question, negative_marks=section.negative_marks,
            ))
            order += 1
    MockQuestion.objects.bulk_create(rows)
    return mock
