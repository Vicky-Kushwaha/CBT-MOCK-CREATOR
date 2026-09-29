from django.utils import timezone

from . import scoring


def _mock_info(mock):
    return {
        "id": mock.id, "title": mock.title, "exam_name": mock.exam.name,
        "duration_minutes": mock.duration_minutes, "total_marks": float(mock.total_marks),
    }


def session_payload(session) -> dict:
    """Exam state for the CBT UI. Never includes correct answers."""
    mock = session.mock
    mqs = mock.questions.select_related("question").prefetch_related("question__options").order_by("order")
    answers = {a.mock_question_id: a for a in session.answers.all()}
    now = timezone.now()
    return {
        "id": session.id, "status": session.status, "mock": _mock_info(mock),
        "started_at": session.started_at, "expires_at": session.expires_at, "server_time": now,
        "remaining_seconds": max(0, int((session.expires_at - now).total_seconds())),
        "current_index": session.current_index,
        "questions": [
            {
                "id": mq.id, "order": mq.order, "section": mq.section_name, "text": mq.question.text,
                "marks": float(mq.marks), "negative_marks": float(mq.negative_marks),
                "options": [{"id": o.id, "text": o.text} for o in mq.question.options.all()],
            }
            for mq in mqs
        ],
        "answers": {
            str(mq_id): {
                "selected_option": a.selected_option_id, "marked": a.marked, "visited": a.visited,
                "time_spent_seconds": a.time_spent_seconds,
            }
            for mq_id, a in answers.items()
        },
    }


def result_payload(session) -> dict:
    r = session.result
    ev = scoring.evaluate(session)
    return {
        "session_id": session.id, "status": session.status, "mock": _mock_info(session.mock),
        "submitted_at": session.submitted_at,
        "result": {
            "score": float(r.score), "total_marks": float(r.total_marks), "attempted": r.attempted,
            "correct": r.correct, "incorrect": r.incorrect, "unattempted": r.unattempted,
            "accuracy": float(r.accuracy), "time_used_seconds": r.time_used_seconds,
            "duration_seconds": session.mock.duration_minutes * 60, "analysis": r.analysis,
        },
        "questions": [
            {**row, "marks_awarded": float(row["marks_awarded"]), "marks": float(row["marks"])} for row in ev["rows"]
        ],
    }


def history_row(session) -> dict:
    r = getattr(session, "result", None)
    return {
        "id": session.id, "mock_title": session.mock.title, "exam_name": session.mock.exam.name,
        "status": session.status, "started_at": session.started_at, "submitted_at": session.submitted_at,
        "score": float(r.score) if r else None, "total_marks": float(session.mock.total_marks),
        "accuracy": float(r.accuracy) if r else None,
    }
