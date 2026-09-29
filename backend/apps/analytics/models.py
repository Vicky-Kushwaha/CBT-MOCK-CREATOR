from django.conf import settings
from django.db import models


class Performance(models.Model):
    """Lifetime per-subject/topic aggregate for a user. Updated deterministically on every submit."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="performance")
    subject = models.ForeignKey("exams.Subject", on_delete=models.CASCADE)
    topic = models.ForeignKey("exams.Topic", null=True, blank=True, on_delete=models.CASCADE)
    attempted = models.PositiveIntegerField(default=0)
    correct = models.PositiveIntegerField(default=0)
    time_seconds = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "subject", "topic")
