from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.mocks.models import MockTest

from . import services
from .models import TestSession
from .payloads import history_row, result_payload, session_payload


class SessionViewSet(viewsets.GenericViewSet):
    def get_queryset(self):
        return TestSession.objects.filter(user=self.request.user).select_related("mock__exam")

    def list(self, request):
        qs = self.get_queryset().select_related("result")[:50]
        return Response([history_row(s) for s in qs])

    def create(self, request):
        mock = MockTest.objects.filter(owner=request.user, pk=request.data.get("mock")).first()
        if not mock:
            return Response({"detail": "Mock test not found."}, status=404)
        session = services.start_session(request.user, mock)
        return Response(session_payload(session), status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        session = self.get_object()
        services.enforce_expiry(session)
        session.refresh_from_db()
        return Response(session_payload(session))

    @action(detail=True, methods=["put"], url_path="answers")
    def answers(self, request, pk=None):
        session = self.get_object()
        try:
            services.save_answers(session, request.data.get("answers", []), request.data.get("current_index"))
        except services.SessionClosed:
            return Response({"detail": "This test is already submitted.", "status": "closed"}, status=409)
        return Response({"saved": True})

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        session = self.get_object()
        services.enforce_expiry(session)
        session.refresh_from_db()
        services.submit_session(session)
        return Response({"session_id": session.id, "submitted": True})

    @action(detail=True, methods=["get"])
    def result(self, request, pk=None):
        session = self.get_object()
        services.enforce_expiry(session)
        session.refresh_from_db()
        if not hasattr(session, "result"):
            return Response({"detail": "Test is still in progress."}, status=409)
        return Response(result_payload(session))
