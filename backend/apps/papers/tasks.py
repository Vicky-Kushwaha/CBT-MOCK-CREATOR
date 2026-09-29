import logging

from celery import shared_task

from apps.questions import ai, services
from apps.questions.models import Question

from . import extraction
from .models import QuestionPaper

log = logging.getLogger(__name__)


@shared_task
def process_paper(paper_id: int) -> None:
    """Upload -> text/OCR -> segmentation -> normalise -> dedupe -> classify -> question bank."""
    paper = QuestionPaper.objects.select_related("exam", "owner").get(pk=paper_id)
    paper.status, paper.error = QuestionPaper.Status.PROCESSING, ""
    paper.save(update_fields=["status", "error"])
    try:
        text = extraction.extract_text(paper.file.path, paper.file_type)
        parsed = extraction.segment_questions(text)
        weak = len(parsed) < 5 or sum(1 for p in parsed if len(p["options"]) < 2) > len(parsed) * 0.3
        if weak and ai.is_enabled():
            log.info("Regex extraction weak for paper %s; using Claude extraction", paper_id)
            parsed = ai.extract_questions_from_text(text) or parsed

        created, duplicates = [], 0
        for p in parsed:
            try:
                created.append(services.create_question(
                    owner=paper.owner, exam=paper.exam, text=p.get("text", ""), options=p.get("options", []),
                    correct_index=p.get("answer_index"), origin=Question.Origin.EXTRACTED,
                    source=paper.original_name, paper=paper,
                ))
            except services.DuplicateQuestion:
                duplicates += 1

        services.classify_with_ai(created, paper.exam)

        paper.extracted_count = len(created)
        paper.duplicate_count = duplicates
        paper.invalid_count = paper.questions.filter(is_valid=False).count()
        paper.status = QuestionPaper.Status.EXTRACTED
        paper.save()
    except Exception as exc:  # surfaced to the user in the UI
        log.exception("Paper %s failed", paper_id)
        paper.status, paper.error = QuestionPaper.Status.FAILED, str(exc)[:1000]
        paper.save(update_fields=["status", "error"])


@shared_task
def classify_paper(paper_id: int) -> None:
    """Re-run Claude classification for a paper's unclassified questions (e.g. after adding an API key)."""
    paper = QuestionPaper.objects.select_related("exam").get(pk=paper_id)
    paper.status = QuestionPaper.Status.PROCESSING
    paper.save(update_fields=["status"])
    try:
        pending = list(paper.questions.filter(subject__isnull=True).prefetch_related("options"))
        services.classify_with_ai(pending, paper.exam)
        paper.invalid_count = paper.questions.filter(is_valid=False).count()
    finally:
        paper.status = QuestionPaper.Status.EXTRACTED
        paper.save()
