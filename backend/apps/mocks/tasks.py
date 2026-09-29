import logging

from celery import shared_task

from apps.exams.models import Exam

from . import generation
from .models import GenerationJob

log = logging.getLogger(__name__)


@shared_task
def run_generation_job(job_id: int) -> None:
    job = GenerationJob.objects.select_related("owner", "exam").get(pk=job_id)
    job.status = GenerationJob.Status.RUNNING
    job.save(update_fields=["status"])
    try:
        exam = Exam.objects.select_related("pattern").get(pk=job.exam_id)
        job.created_count = generation.generate_missing(job.owner, exam, job.paper_ids)
        job.status = GenerationJob.Status.DONE
    except Exception as exc:
        log.exception("Generation job %s failed", job_id)
        job.status, job.error = GenerationJob.Status.FAILED, str(exc)[:500]
    job.save()
