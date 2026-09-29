from rest_framework import viewsets

from .models import Exam, Subject
from .serializers import ExamSerializer, SubjectSerializer


class ExamViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSerializer
    lookup_field = "slug"
    queryset = (
        Exam.objects.filter(is_active=True)
        .select_related("pattern")
        .prefetch_related("pattern__sections__subjects")
    )


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SubjectSerializer
    queryset = Subject.objects.prefetch_related("topics")
