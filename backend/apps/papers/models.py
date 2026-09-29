from django.conf import settings
from django.db import models


class QuestionPaper(models.Model):
    class Status(models.TextChoices):
        UPLOADED = "uploaded"
        PROCESSING = "processing"
        EXTRACTED = "extracted"
        FAILED = "failed"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="papers")
    exam = models.ForeignKey("exams.Exam", on_delete=models.CASCADE, related_name="papers")
    file = models.FileField(upload_to="papers/%Y/%m/")
    original_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10)  # pdf | image
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.UPLOADED)
    extracted_count = models.PositiveIntegerField(default=0)
    duplicate_count = models.PositiveIntegerField(default=0)
    invalid_count = models.PositiveIntegerField(default=0)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.original_name
