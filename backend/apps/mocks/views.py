from rest_framework import mixins, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from . import builder
from .models import GenerationJob, MockTest
from .serializers import GenerationJobSerializer, MockTestSerializer, SelectionSerializer
from .tasks import run_generation_job


class AvailabilityView(APIView):
    """Deterministic 'not enough questions' check."""

    def post(self, request):
        s = SelectionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        return Response(builder.availability(request.user, s.validated_data["exam"], s.validated_data["paper_ids"]))


class GenerateMissingView(APIView):
    def post(self, request):
        s = SelectionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        from apps.questions import ai

        if not ai.is_enabled():
            return Response({"detail": "Claude is not configured. Set ANTHROPIC_API_KEY in .env."}, status=503)
        job = GenerationJob.objects.create(
            owner=request.user, exam=s.validated_data["exam"], paper_ids=s.validated_data["paper_ids"]
        )
        run_generation_job.delay(job.id)
        return Response(GenerationJobSerializer(job).data, status=status.HTTP_202_ACCEPTED)


class GenerationJobView(APIView):
    def get(self, request, pk):
        job = GenerationJob.objects.filter(owner=request.user, pk=pk).first()
        if not job:
            return Response(status=404)
        return Response(GenerationJobSerializer(job).data)


class MockTestViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin,
                      viewsets.GenericViewSet):
    serializer_class = MockTestSerializer

    def get_queryset(self):
        return MockTest.objects.filter(owner=self.request.user).select_related("exam").prefetch_related("questions")

    def create(self, request):
        s = SelectionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        try:
            mock = builder.create_mock(request.user, d["exam"], d["paper_ids"], d["title"] or None)
        except builder.InsufficientQuestions as e:
            return Response({"detail": str(e), "availability": e.availability}, status=status.HTTP_409_CONFLICT)
        return Response(MockTestSerializer(mock).data, status=status.HTTP_201_CREATED)
