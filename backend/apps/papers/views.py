from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.exams.models import Subject
from apps.questions import ai
from apps.questions.serializers import QuestionSerializer

from .models import QuestionPaper
from .serializers import PaperSerializer, PaperUploadSerializer
from .tasks import classify_paper, process_paper


class PaperViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin,
                   viewsets.GenericViewSet):
    serializer_class = PaperSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = QuestionPaper.objects.filter(owner=self.request.user)
        if self.request.query_params.get("exam"):
            qs = qs.filter(exam__slug=self.request.query_params["exam"])
        return qs

    def create(self, request):
        s = PaperUploadSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        f = s.validated_data["file"]
        paper = QuestionPaper.objects.create(
            owner=request.user, exam=s.validated_data["exam"], file=f,
            original_name=f.name[:255], file_type=s.file_type(),
        )
        process_paper.delay(paper.id)
        return Response(PaperSerializer(paper).data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        instance.file.delete(save=False)
        instance.delete()

    @action(detail=True, methods=["get"])
    def questions(self, request, pk=None):
        paper = self.get_object()
        qs = paper.questions.select_related("subject", "topic").prefetch_related("options")
        return Response(QuestionSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"], url_path="assign-subject")
    def assign_subject(self, request, pk=None):
        """Manual fallback: put every unclassified question of this paper into one subject."""
        paper = self.get_object()
        subject = Subject.objects.filter(pk=request.data.get("subject")).first()
        if not subject:
            return Response({"detail": "Choose a subject."}, status=status.HTTP_400_BAD_REQUEST)
        updated = paper.questions.filter(subject__isnull=True).update(subject=subject)
        return Response({"updated": updated})

    @action(detail=True, methods=["post"])
    def classify(self, request, pk=None):
        """Ask Claude to classify this paper's unclassified questions and infer missing answers."""
        paper = self.get_object()
        if not ai.is_enabled():
            return Response({"detail": "Claude is not configured. Set ANTHROPIC_API_KEY in .env."}, status=503)
        classify_paper.delay(paper.id)
        return Response({"queued": True}, status=status.HTTP_202_ACCEPTED)
