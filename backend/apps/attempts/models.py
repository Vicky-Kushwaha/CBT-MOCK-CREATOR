from django.conf import settings
from django.db import models


class TestSession(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress"
        SUBMITTED = "submitted"
        EXPIRED = "expired"  # auto-submitted when the timer ran out

    __test__ = False  # not a test class for test runners

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="test_sessions")
    mock = models.ForeignKey("mocks.MockTest", on_delete=models.CASCADE, related_name="sessions")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.IN_PROGRESS)
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # server-side source of truth for the timer
    submitted_at = models.DateTimeField(null=True, blank=True)
    current_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-started_at"]


class TestAnswer(models.Model):
    __test__ = False

    session = models.ForeignKey(TestSession, related_name="answers", on_delete=models.CASCADE)
    mock_question = models.ForeignKey("mocks.MockQuestion", on_delete=models.CASCADE)
    selected_option = models.ForeignKey("questions.QuestionOption", null=True, blank=True, on_delete=models.SET_NULL)
    marked = models.BooleanField(default=False)
    visited = models.BooleanField(default=False)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("session", "mock_question")


class TestResult(models.Model):
    __test__ = False

    session = models.OneToOneField(TestSession, related_name="result", on_delete=models.CASCADE)
    score = models.DecimalField(max_digits=8, decimal_places=2)
    total_marks = models.DecimalField(max_digits=8, decimal_places=2)
    attempted = models.PositiveIntegerField()
    correct = models.PositiveIntegerField()
    incorrect = models.PositiveIntegerField()
    unattempted = models.PositiveIntegerField()
    accuracy = models.DecimalField(max_digits=5, decimal_places=2)
    time_used_seconds = models.PositiveIntegerField()
    analysis = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
