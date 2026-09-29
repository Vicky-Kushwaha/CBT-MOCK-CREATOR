from rest_framework import serializers

from apps.exams.models import Exam, Subject

from .models import Question, QuestionOption


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ("id", "text", "order", "is_correct")


class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True, default=None)
    topic_name = serializers.CharField(source="topic.name", read_only=True, default=None)
    explanation = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = (
            "id", "text", "subject", "subject_name", "topic", "topic_name", "difficulty", "origin",
            "answer_source", "source", "paper", "is_valid", "validation_notes", "options", "explanation",
        )

    def get_explanation(self, obj):
        e = getattr(obj, "explanation", None)
        return e.text if e else None


class QuestionCreateSerializer(serializers.Serializer):
    exam = serializers.SlugRelatedField(slug_field="slug", queryset=Exam.objects.all())
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    topic = serializers.CharField(required=False, allow_blank=True, default="")
    text = serializers.CharField(min_length=10)
    options = serializers.ListField(child=serializers.CharField(allow_blank=False), min_length=2, max_length=6)
    correct_index = serializers.IntegerField(min_value=0)
    difficulty = serializers.ChoiceField(choices=["easy", "medium", "hard"], default="medium")
    explanation = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, data):
        if data["correct_index"] >= len(data["options"]):
            raise serializers.ValidationError({"correct_index": "Must point to one of the options."})
        return data


class QuestionUpdateSerializer(serializers.Serializer):
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), required=False)
    topic = serializers.CharField(required=False, allow_blank=True)
    difficulty = serializers.ChoiceField(choices=["easy", "medium", "hard"], required=False)
    correct_index = serializers.IntegerField(min_value=0, required=False)
