from django.conf import settings
from django.db import models


class Question(models.Model):
    class Origin(models.TextChoices):
        EXTRACTED = "extracted"
        MANUAL = "manual"
        AI_GENERATED = "ai_generated"

    class Difficulty(models.TextChoices):
        EASY = "easy"
        MEDIUM = "medium"
        HARD = "hard"

    class AnswerSource(models.TextChoices):
        KEY = "key", "From answer key"
        AI = "ai", "Inferred by AI"
        MANUAL = "manual", "Entered manually"
        MISSING = "missing", "Missing"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.CASCADE, related_name="questions")
    exam = models.ForeignKey("exams.Exam", null=True, blank=True, on_delete=models.SET_NULL)
    subject = models.ForeignKey("exams.Subject", null=True, blank=True, on_delete=models.SET_NULL)
    topic = models.ForeignKey("exams.Topic", null=True, blank=True, on_delete=models.SET_NULL)
    paper = models.ForeignKey("papers.QuestionPaper", null=True, blank=True, on_delete=models.SET_NULL, related_name="questions")
    text = models.TextField()
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    origin = models.CharField(max_length=20, choices=Origin.choices, default=Origin.EXTRACTED)
    answer_source = models.CharField(max_length=10, choices=AnswerSource.choices, default=AnswerSource.MISSING)
    source = models.CharField(max_length=255, blank=True)
    is_valid = models.BooleanField(default=False)
    validation_notes = models.TextField(blank=True)
    content_hash = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.text[:60]


class QuestionOption(models.Model):
    question = models.ForeignKey(Question, related_name="options", on_delete=models.CASCADE)
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ["order", "id"]


class QuestionExplanation(models.Model):
    question = models.OneToOneField(Question, related_name="explanation", on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
