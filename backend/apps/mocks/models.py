from django.conf import settings
from django.db import models


class MockTest(models.Model):
    class Status(models.TextChoices):
        READY = "ready"
        ARCHIVED = "archived"

    class Language(models.TextChoices):
        ENGLISH = "english", "English"
        HINDI = "hindi", "Hindi"
        BOTH = "both", "Both"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mocks")
    exam = models.ForeignKey("exams.Exam", on_delete=models.PROTECT)
    title = models.CharField(max_length=200)
    language = models.CharField(max_length=10, choices=Language.choices, default=Language.ENGLISH)
    # Snapshot of the pattern at creation time, so later pattern edits never change old mocks.
    duration_minutes = models.PositiveIntegerField()
    total_marks = models.DecimalField(max_digits=8, decimal_places=2)
    instructions = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.READY)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class MockQuestion(models.Model):
    mock = models.ForeignKey(MockTest, related_name="questions", on_delete=models.CASCADE)
    question = models.ForeignKey("questions.Question", on_delete=models.PROTECT, related_name="mock_uses")
    section_name = models.CharField(max_length=150)
    order = models.PositiveIntegerField()
    marks = models.DecimalField(max_digits=5, decimal_places=2)
    negative_marks = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        ordering = ["order"]
        unique_together = ("mock", "order")


class GenerationJob(models.Model):
    """Tracks 'Generate additional questions' runs (Celery)."""

    class Status(models.TextChoices):
        PENDING = "pending"
        RUNNING = "running"
        DONE = "done"
        FAILED = "failed"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    exam = models.ForeignKey("exams.Exam", on_delete=models.CASCADE)
    paper_ids = models.JSONField(default=list)
    language = models.CharField(max_length=10, choices=MockTest.Language.choices, default=MockTest.Language.ENGLISH)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_count = models.PositiveIntegerField(default=0)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
