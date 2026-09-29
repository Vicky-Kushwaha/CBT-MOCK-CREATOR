from celery import shared_task

from .models import TestSession
from .services import enforce_expiry


@shared_task
def auto_submit_session(session_id: int) -> None:
    """Backstop: submit sessions whose timer ran out even if the browser was closed."""
    session = TestSession.objects.filter(pk=session_id).first()
    if session:
        enforce_expiry(session)
