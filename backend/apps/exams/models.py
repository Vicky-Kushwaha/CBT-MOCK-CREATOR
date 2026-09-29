from decimal import Decimal

from django.db import models
from django.utils.text import slugify


class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Topic(models.Model):
    subject = models.ForeignKey(Subject, related_name="topics", on_delete=models.CASCADE)
    name = models.CharField(max_length=150)

    class Meta:
        unique_together = ("subject", "name")
        ordering = ["name"]

    def __str__(self):
        return f"{self.subject.name} / {self.name}"


class Exam(models.Model):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=160, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


def default_difficulty():
    return {"easy": 30, "medium": 50, "hard": 20}


def default_question_types():
    return ["mcq_single"]


class ExamPattern(models.Model):
    """Configurable pattern. Claude receives this through MCP; nothing is hardcoded in prompts."""

    exam = models.OneToOneField(Exam, related_name="pattern", on_delete=models.CASCADE)
    duration_minutes = models.PositiveIntegerField(default=60)
    instructions = models.TextField(blank=True)
    difficulty_distribution = models.JSONField(default=default_difficulty)
    question_types = models.JSONField(default=default_question_types)

    @property
    def total_questions(self) -> int:
        return sum(s.question_count for s in self.sections.all())

    @property
    def total_marks(self) -> Decimal:
        return sum((s.question_count * s.marks_per_question for s in self.sections.all()), Decimal("0"))

    def as_dict(self) -> dict:
        return {
            "exam": self.exam.name,
            "slug": self.exam.slug,
            "duration_minutes": self.duration_minutes,
            "total_questions": self.total_questions,
            "total_marks": float(self.total_marks),
            "difficulty_distribution": self.difficulty_distribution,
            "question_types": self.question_types,
            "instructions": self.instructions,
            "sections": [
                {
                    "name": s.name,
                    "subjects": [sub.name for sub in s.subjects.all()],
                    "question_count": s.question_count,
                    "marks_per_question": float(s.marks_per_question),
                    "negative_marks": float(s.negative_marks),
                }
                for s in self.sections.prefetch_related("subjects")
            ],
        }

    def __str__(self):
        return f"Pattern: {self.exam.name}"


class PatternSection(models.Model):
    pattern = models.ForeignKey(ExamPattern, related_name="sections", on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    subjects = models.ManyToManyField(Subject, related_name="pattern_sections")
    order = models.PositiveIntegerField(default=0)
    question_count = models.PositiveIntegerField()
    marks_per_question = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("1"))
    negative_marks = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.pattern.exam.name} - {self.name}"
