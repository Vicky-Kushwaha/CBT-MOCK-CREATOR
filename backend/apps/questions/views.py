from django.db.models import ProtectedError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import ai, services
from .models import Question
from .serializers import QuestionCreateSerializer, QuestionSerializer, QuestionUpdateSerializer


class QuestionViewSet(viewsets.GenericViewSet):
    serializer_class = QuestionSerializer

    def get_queryset(self):
        return (
            Question.objects.filter(owner=self.request.user)
            .select_related("subject", "topic", "explanation")
            .prefetch_related("options")
        )

    def list(self, request):
        qs, p = self.get_queryset(), request.query_params
        if p.get("paper"):
            qs = qs.filter(paper_id=p["paper"])
        if p.get("exam"):
            qs = qs.filter(exam__slug=p["exam"])
        if p.get("subject") == "none":
            qs = qs.filter(subject__isnull=True)
        elif p.get("subject"):
            qs = qs.filter(subject_id=p["subject"])
        if p.get("valid") in ("0", "1"):
            qs = qs.filter(is_valid=p["valid"] == "1")
        return Response(QuestionSerializer(qs[:500], many=True).data)

    def retrieve(self, request, pk=None):
        return Response(QuestionSerializer(self.get_object()).data)

    def create(self, request):
        s = QuestionCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        try:
            q = services.create_question(
                owner=request.user, exam=d["exam"], subject=d["subject"], topic=d["topic"], text=d["text"],
                options=d["options"], correct_index=d["correct_index"], difficulty=d["difficulty"],
                origin=Question.Origin.MANUAL, source="manual entry", explanation=d["explanation"],
                answer_source=Question.AnswerSource.MANUAL,
            )
        except services.DuplicateQuestion:
            return Response({"detail": "You already have this question."}, status=status.HTTP_409_CONFLICT)
        return Response(QuestionSerializer(q).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        q = self.get_object()
        s = QuestionUpdateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        q = services.update_question(
            q, subject=d.get("subject"), topic_name=d.get("topic"),
            difficulty=d.get("difficulty"), correct_index=d.get("correct_index"),
        )
        return Response(QuestionSerializer(q).data)

    def destroy(self, request, pk=None):
        try:
            self.get_object().delete()
        except ProtectedError:
            return Response({"detail": "This question is used by a mock test."}, status=status.HTTP_409_CONFLICT)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def explain(self, request, pk=None):
        """On-demand AI explanation (cached). Available for questions the user has attempted."""
        q = self.get_object()
        try:
            return Response({"explanation": services.get_or_create_explanation(q)})
        except ai.AIUnavailable:
            return Response({"detail": "Claude is not configured (set ANTHROPIC_API_KEY)."}, status=503)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
