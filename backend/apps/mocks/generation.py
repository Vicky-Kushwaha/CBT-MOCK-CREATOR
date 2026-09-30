import logging

from apps.questions import ai, services
from apps.questions.models import Question

from .builder import availability

log = logging.getLogger(__name__)


def shortfall_brief(owner, exam, paper_ids) -> list[dict]:
    """What is missing, per section. Used by the UI job and by Claude through MCP."""
    a = availability(owner, exam, paper_ids)
    pattern = exam.pattern
    sections = {s.name: s for s in pattern.sections.prefetch_related("subjects__topics")}
    brief = []
    for row in a["sections"]:
        if row["shortfall"] > 0:
            s = sections[row["name"]]
            subjects = list(s.subjects.all())
            if not subjects: continue
            
            shortfall = row["shortfall"]
            per_sub = shortfall // len(subjects)
            remainder = shortfall % len(subjects)
            
            for i, sub in enumerate(subjects):
                sub_needed = per_sub + (1 if i < remainder else 0)
                if sub_needed > 0:
                    brief.append({
                        "section": row["name"], "subject": sub.name, "count_needed": sub_needed,
                        "topics": [t.name for t in sub.topics.all()],
                        "difficulty_distribution": pattern.difficulty_distribution,
                    })
    return brief


def generate_missing(owner, exam, paper_ids, language="english") -> int:
    if not ai.is_enabled():
        raise ai.AIUnavailable("ANTHROPIC_API_KEY is not configured")
    total = 0
    for item in shortfall_brief(owner, exam, paper_ids):
        subject = services.resolve_subject(item["subject"])
        avoid = [q.text[:120] for q in Question.objects.filter(owner=owner, subject=subject).order_by("-id")[:30]]
        remaining = item["count_needed"]
        for _ in range(4):  # a few passes in case some generated questions are invalid/duplicates
            if remaining <= 0:
                break
            batch = ai.generate_questions(exam.name, item["subject"], item["topics"], min(remaining, 20),
                                          item["difficulty_distribution"], avoid, language=language)
            for g in batch:
                try:
                    services.create_question(
                        owner=owner, exam=exam, subject=subject, topic=g.get("topic"), text=g.get("question", ""), text_hi=g.get("question_hi", ""),
                        options=g.get("options", []), options_hi=g.get("options_hi", []), correct_index=g.get("correct_index"),
                        difficulty=g.get("difficulty", "medium"), origin=Question.Origin.AI_GENERATED,
                        source="AI generated", explanation=g.get("explanation", ""), explanation_hi=g.get("explanation_hi", ""),
                        answer_source=Question.AnswerSource.AI,
                    )
                except (services.DuplicateQuestion, TypeError):
                    continue
                avoid.append(g.get("question", "")[:120])
                remaining -= 1
                total += 1
                if remaining <= 0:
                    break
    return total
