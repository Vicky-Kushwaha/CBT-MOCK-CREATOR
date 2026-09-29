from rest_framework import serializers

from .models import Exam, ExamPattern, PatternSection, Subject, Topic


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ("id", "name")


class SubjectSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)

    class Meta:
        model = Subject
        fields = ("id", "name", "slug", "topics")


class PatternSectionSerializer(serializers.ModelSerializer):
    subject_names = serializers.SerializerMethodField(read_only=True)
    subject_ids = serializers.PrimaryKeyRelatedField(
        source="subjects",
        queryset=Subject.objects.all(),
        many=True
    )

    class Meta:
        model = PatternSection
        fields = (
            "id", "name", "subject_ids", "subject_names", "order",
            "question_count", "marks_per_question", "negative_marks",
        )
        
    def get_subject_names(self, obj):
        return ", ".join(s.name for s in obj.subjects.all())


class ExamPatternSerializer(serializers.ModelSerializer):
    sections = PatternSectionSerializer(many=True)
    total_questions = serializers.IntegerField(read_only=True)
    total_marks = serializers.FloatField(read_only=True)

    class Meta:
        model = ExamPattern
        fields = (
            "duration_minutes", "instructions", "difficulty_distribution",
            "question_types", "total_questions", "total_marks", "sections",
        )


class ExamSerializer(serializers.ModelSerializer):
    pattern = ExamPatternSerializer()

    class Meta:
        model = Exam
        fields = ("id", "name", "slug", "description", "is_default", "pattern")
        
    def create(self, validated_data):
        from django.utils.text import slugify
        pattern_data = validated_data.pop("pattern", {})
        sections_data = pattern_data.pop("sections", [])
        
        if not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data['name'])
            
        exam = Exam.objects.create(**validated_data)
        
        pattern = ExamPattern.objects.create(exam=exam, **pattern_data)
        for idx, section_data in enumerate(sections_data):
            if 'order' not in section_data:
                section_data['order'] = idx
            subjects_data = section_data.pop('subjects', [])
            section = PatternSection.objects.create(pattern=pattern, **section_data)
            section.subjects.set(subjects_data)
            
        return exam

    def update(self, instance, validated_data):
        from django.utils.text import slugify
        pattern_data = validated_data.pop("pattern", {})
        sections_data = pattern_data.pop("sections", [])
        
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        if 'name' in validated_data:
            instance.slug = slugify(instance.name)
        instance.save()
        
        if pattern_data:
            if hasattr(instance, 'pattern'):
                instance.pattern.delete()
            pattern = ExamPattern.objects.create(exam=instance, **pattern_data)
            for idx, section_data in enumerate(sections_data):
                if 'order' not in section_data:
                    section_data['order'] = idx
                subjects_data = section_data.pop('subjects', [])
                section = PatternSection.objects.create(pattern=pattern, **section_data)
                section.subjects.set(subjects_data)
                
        return instance
