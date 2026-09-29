"""Deterministic scoring. Claude/AI never touches marks, negative marking or results."""
from collections import defaultdict
from decimal import Decimal

Q2 = Decimal("0.01")


def evaluate(session) -> dict:
    """Evaluate a session from stored answers. Pure function of DB state -> same result every time."""
    mqs = (
        session.mock.questions.select_related("question__subject", "question__topic", "question__explanation")
        .prefetch_related("question__options")
        .order_by("order")
    )
    answers = {a.mock_question_id: a for a in session.answers.all()}
    rows = []
    for mq in mqs:
        options = list(mq.question.options.all())
        correct = next((o for o in options if o.is_correct), None)
        ans = answers.get(mq.id)
        selected = ans.selected_option_id if ans else None
        if selected is None:
            outcome, awarded = "unattempted", Decimal("0")
        elif correct and selected == correct.id:
            outcome, awarded = "correct", mq.marks
        else:
            outcome, awarded = "incorrect", -mq.negative_marks
        explanation = getattr(mq.question, "explanation", None)
        rows.append({
            "mock_question": mq.id, "question_id": mq.question_id, "order": mq.order, "section": mq.section_name,
            "text": mq.question.text,
            "options": [{"id": o.id, "text": o.text, "is_correct": o.is_correct} for o in options],
            "selected_option": selected, "correct_option": correct.id if correct else None,
            "outcome": outcome, "marks_awarded": awarded, "marks": mq.marks,
            "time_spent": ans.time_spent_seconds if ans else 0,
            "subject_id": mq.question.subject_id,
            "subject": mq.question.subject.name if mq.question.subject else "Unclassified",
            "topic_id": mq.question.topic_id,
            "topic": mq.question.topic.name if mq.question.topic else None,
            "explanation": explanation.text if explanation else None,
        })

    correct_n = sum(r["outcome"] == "correct" for r in rows)
    incorrect_n = sum(r["outcome"] == "incorrect" for r in rows)
    attempted = correct_n + incorrect_n
    score = sum((r["marks_awarded"] for r in rows), Decimal("0"))
    accuracy = (Decimal(correct_n) * 100 / attempted) if attempted else Decimal("0")
    used = sum(r["time_spent"] for r in rows)
    return {
        "rows": rows,
        "score": score.quantize(Q2),
        "total_marks": session.mock.total_marks,
        "attempted": attempted, "correct": correct_n, "incorrect": incorrect_n,
        "unattempted": len(rows) - attempted,
        "accuracy": accuracy.quantize(Q2),
        "time_used_seconds": used,
    }


def build_analysis(rows: list[dict]) -> dict:
    def bucket():
        return {"attempted": 0, "correct": 0, "incorrect": 0, "score": 0.0, "time": 0, "total": 0}

    subjects, topics, sections = defaultdict(bucket), defaultdict(bucket), defaultdict(bucket)

    def add(b, r):
        b["total"] += 1
        b["time"] += r["time_spent"]
        b["score"] += float(r["marks_awarded"])
        if r["outcome"] != "unattempted":
            b["attempted"] += 1
            b[r["outcome"]] += 1

    for r in rows:
        add(subjects[r["subject"]], r)
        add(sections[r["section"]], r)
        if r["topic"]:
            add(topics[(r["subject"], r["topic"])], r)

    def finish(name, b, **extra):
        acc = round(b["correct"] * 100 / b["attempted"], 1) if b["attempted"] else 0.0
        return {**extra, "name": name, **b, "score": round(b["score"], 2), "accuracy": acc}

    topic_rows = [finish(t, b, subject=s) for (s, t), b in topics.items() if b["attempted"] >= 2]
    slowest = sorted(rows, key=lambda r: r["time_spent"], reverse=True)[:5]
    return {
        "subjects": [finish(n, b) for n, b in subjects.items()],
        "sections": [finish(n, b) for n, b in sections.items()],
        "weak_topics": sorted([t for t in topic_rows if t["accuracy"] < 60], key=lambda t: t["accuracy"])[:5],
        "strong_topics": sorted([t for t in topic_rows if t["accuracy"] >= 80], key=lambda t: -t["accuracy"])[:5],
        "slowest_questions": [
            {"order": r["order"], "section": r["section"], "time_spent": r["time_spent"], "outcome": r["outcome"]}
            for r in slowest if r["time_spent"] > 0
        ],
    }
