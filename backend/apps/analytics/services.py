from collections import defaultdict

from django.db.models import F

from .models import Performance


def record_performance(user, rows: list[dict]) -> None:
    agg = defaultdict(lambda: [0, 0, 0])  # attempted, correct, time
    for r in rows:
        if not r["subject_id"]:
            continue
        for key in ((r["subject_id"], None), (r["subject_id"], r["topic_id"])) if r["topic_id"] else ((r["subject_id"], None),):
            a = agg[key]
            a[0] += r["outcome"] != "unattempted"
            a[1] += r["outcome"] == "correct"
            a[2] += r["time_spent"]
    for (subject_id, topic_id), (attempted, correct, time) in agg.items():
        perf, _ = Performance.objects.get_or_create(user=user, subject_id=subject_id, topic_id=topic_id)
        Performance.objects.filter(pk=perf.pk).update(
            attempted=F("attempted") + attempted, correct=F("correct") + correct, time_seconds=F("time_seconds") + time
        )
