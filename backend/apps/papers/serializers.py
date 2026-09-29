from django.conf import settings
from rest_framework import serializers

from apps.exams.models import Exam

from .models import QuestionPaper

ALLOWED = {".pdf": "pdf", ".png": "image", ".jpg": "image", ".jpeg": "image", ".webp": "image"}


class PaperSerializer(serializers.ModelSerializer):
    unclassified_count = serializers.SerializerMethodField()

    class Meta:
        model = QuestionPaper
        fields = (
            "id", "exam", "original_name", "file_type", "status", "extracted_count",
            "duplicate_count", "invalid_count", "unclassified_count", "error", "created_at",
        )

    def get_unclassified_count(self, obj):
        return obj.questions.filter(subject__isnull=True).count()


class PaperUploadSerializer(serializers.Serializer):
    exam = serializers.SlugRelatedField(slug_field="slug", queryset=Exam.objects.filter(is_active=True))
    file = serializers.FileField()

    def validate_file(self, f):
        ext = "." + f.name.rsplit(".", 1)[-1].lower() if "." in f.name else ""
        if ext not in ALLOWED:
            raise serializers.ValidationError("Upload a PDF, PNG, JPG or WEBP file.")
        if f.size > settings.MAX_UPLOAD_MB * 1024 * 1024:
            raise serializers.ValidationError(f"File is larger than {settings.MAX_UPLOAD_MB} MB.")
        return f

    def file_type(self):
        name = self.validated_data["file"].name.lower()
        return ALLOWED["." + name.rsplit(".", 1)[-1]]
