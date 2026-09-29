from rest_framework import serializers

from apps.exams.models import Exam

from .models import GenerationJob, MockTest


class SelectionSerializer(serializers.Serializer):
    exam = serializers.SlugRelatedField(slug_field="slug", queryset=Exam.objects.filter(is_active=True))
    paper_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    title = serializers.CharField(required=False, allow_blank=True, default="")


class MockTestSerializer(serializers.ModelSerializer):
    exam_name = serializers.CharField(source="exam.name", read_only=True)
    total_questions = serializers.SerializerMethodField()
    sections = serializers.SerializerMethodField()

    class Meta:
        model = MockTest
        fields = (
            "id", "title", "exam", "exam_name", "duration_minutes", "total_marks", "instructions",
            "status", "total_questions", "sections", "created_at",
        )

    def get_total_questions(self, obj):
        return len(obj.questions.all())

    def get_sections(self, obj):
        out: dict[str, dict] = {}
        for mq in obj.questions.all():
            s = out.setdefault(mq.section_name, {
                "name": mq.section_name, "count": 0,
                "marks_per_question": float(mq.marks), "negative_marks": float(mq.negative_marks),
            })
            s["count"] += 1
        return list(out.values())


class GenerationJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenerationJob
        fields = ("id", "status", "created_count", "error")

from apps.questions.models import QuestionOption
from apps.mocks.models import MockQuestion

class MockQuestionKeyOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ("id", "text", "is_correct")

class MockQuestionKeySerializer(serializers.ModelSerializer):
    text = serializers.CharField(source="question.text")
    subject = serializers.CharField(source="question.subject.name", allow_null=True, read_only=True)
    topic = serializers.CharField(source="question.topic.name", allow_null=True, read_only=True)
    explanation = serializers.CharField(source="question.explanation.text", allow_null=True, read_only=True)
    options = serializers.SerializerMethodField()
    
    class Meta:
        model = MockQuestion
        fields = ("id", "order", "section_name", "marks", "negative_marks", 
                  "text", "subject", "topic", "explanation", "options")

    def get_options(self, obj):
        return MockQuestionKeyOptionSerializer(obj.question.options.all(), many=True).data

class MockTestAnswerKeySerializer(serializers.ModelSerializer):
    questions = MockQuestionKeySerializer(many=True, read_only=True)
    class Meta:
        model = MockTest
        fields = ("id", "title", "questions")
