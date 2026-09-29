from django.db.models import Avg, Max
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.attempts.models import TestResult

from .models import Performance

MIN_ATTEMPTS = 3


def _acc(p):
    return round(p.correct * 100 / p.attempted, 1) if p.attempted else 0.0


class SummaryView(APIView):
    def get(self, request):
        results = TestResult.objects.filter(session__user=request.user).select_related("session__mock__exam")
        agg = results.aggregate(avg=Avg("accuracy"), best=Max("score"))
        history = [
            {
                "session_id": r.session_id, "title": r.session.mock.title, "exam": r.session.mock.exam.name,
                "score": float(r.score), "total_marks": float(r.total_marks), "accuracy": float(r.accuracy),
                "date": r.created_at,
            }
            for r in results.order_by("created_at")[:50]
        ]
        perf = Performance.objects.filter(user=request.user, attempted__gt=0).select_related("subject", "topic")
        subjects = [
            {"subject": p.subject.name, "attempted": p.attempted, "correct": p.correct, "accuracy": _acc(p)}
            for p in perf if p.topic_id is None
        ]
        topics = [
            {"subject": p.subject.name, "topic": p.topic.name, "attempted": p.attempted, "accuracy": _acc(p)}
            for p in perf if p.topic_id and p.attempted >= MIN_ATTEMPTS
        ]
        return Response({
            "tests_taken": results.count(),
            "average_accuracy": round(float(agg["avg"] or 0), 1),
            "best_score": float(agg["best"] or 0),
            "history": history,
            "subjects": sorted(subjects, key=lambda s: s["accuracy"]),
            "weak_topics": sorted([t for t in topics if t["accuracy"] < 60], key=lambda t: t["accuracy"])[:8],
            "strong_topics": sorted([t for t in topics if t["accuracy"] >= 80], key=lambda t: -t["accuracy"])[:8],
        })
