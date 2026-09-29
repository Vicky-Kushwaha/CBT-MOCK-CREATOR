from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.analytics.services import record_performance
from apps.questions.models import QuestionOption

from . import scoring
from .models import TestAnswer, TestResult, TestSession

SAVE_GRACE_SECONDS = 5


class SessionClosed(Exception):
    pass


def start_session(user, mock) -> TestSession:
    existing = TestSession.objects.filter(user=user, mock=mock, status=TestSession.Status.IN_PROGRESS).first()
    if existing:
        enforce_expiry(existing)
        if existing.status == TestSession.Status.IN_PROGRESS:
            return existing
    session = TestSession.objects.create(
        user=user, mock=mock, expires_at=timezone.now() + timedelta(minutes=mock.duration_minutes)
    )
    if not settings.CELERY_TASK_ALWAYS_EAGER:
        from .tasks import auto_submit_session

        auto_submit_session.apply_async(args=[session.id], eta=session.expires_at + timedelta(seconds=SAVE_GRACE_SECONDS))
    return session


def enforce_expiry(session: TestSession) -> None:
    """Lazy check used everywhere; the Celery ETA task is only a backstop for abandoned sessions."""
    if session.status == TestSession.Status.IN_PROGRESS and timezone.now() >= session.expires_at:
        submit_session(session, expired=True)


def save_answers(session: TestSession, items: list[dict], current_index: int | None = None) -> None:
    if session.status != TestSession.Status.IN_PROGRESS:
        raise SessionClosed()
    if timezone.now() > session.expires_at + timedelta(seconds=SAVE_GRACE_SECONDS):
        enforce_expiry(session)
        raise SessionClosed()

    mqs = {mq.id: mq for mq in session.mock.questions.all()}
    cap = session.mock.duration_minutes * 60
    with transaction.atomic():
        for item in items:
            mq = mqs.get(item.get("mock_question"))
            if not mq:
                continue
            option_id = item.get("selected_option")
            if option_id is not None and not QuestionOption.objects.filter(pk=option_id, question_id=mq.question_id).exists():
                continue
            ans, _ = TestAnswer.objects.get_or_create(session=session, mock_question=mq)
            ans.selected_option_id = option_id
            ans.marked = bool(item.get("marked"))
            ans.visited = bool(item.get("visited")) or option_id is not None or ans.marked
            ans.time_spent_seconds = min(cap, max(ans.time_spent_seconds, int(item.get("time_spent_seconds") or 0)))
            ans.save()
        if current_index is not None:
            session.current_index = max(0, min(current_index, len(mqs) - 1))
            session.save(update_fields=["current_index"])


@transaction.atomic
def submit_session(session: TestSession, expired: bool = False) -> TestResult:
    """Idempotent: submitting twice returns the same stored result."""
    session = TestSession.objects.select_for_update().get(pk=session.pk)
    if hasattr(session, "result"):
        return session.result
    ev = scoring.evaluate(session)
    result = TestResult.objects.create(
        session=session, score=ev["score"], total_marks=ev["total_marks"], attempted=ev["attempted"],
        correct=ev["correct"], incorrect=ev["incorrect"], unattempted=ev["unattempted"], accuracy=ev["accuracy"],
        time_used_seconds=ev["time_used_seconds"], analysis=scoring.build_analysis(ev["rows"]),
    )
    session.status = TestSession.Status.EXPIRED if expired else TestSession.Status.SUBMITTED
    session.submitted_at = timezone.now()
    session.save(update_fields=["status", "submitted_at"])
    record_performance(session.user, ev["rows"])
    return result
