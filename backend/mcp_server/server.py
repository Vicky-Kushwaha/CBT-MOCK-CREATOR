"""MCP server: Claude (the client) calls these tools; Django stays the source of truth.

Run:  python -m mcp_server.server      (streamable HTTP on :8811, endpoint /mcp)
Tools only *understand / classify / generate / explain*. They never touch timers, scoring or exam state.

SECURITY: this server is unauthenticated - keep it on localhost/private network, or put auth in front of
it before exposing it. Tools that write data take a `username` and act on that user's question bank.
"""
import os
from functools import wraps

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from asgiref.sync import sync_to_async  # noqa: E402
from django.contrib.auth import get_user_model  # noqa: E402
from django.db import close_old_connections  # noqa: E402
from mcp.server.fastmcp import FastMCP  # noqa: E402

from apps.exams.models import Exam, Subject  # noqa: E402
from apps.mocks import builder, generation  # noqa: E402
from apps.papers.models import QuestionPaper  # noqa: E402
from apps.questions import services  # noqa: E402
from apps.questions.models import Question, QuestionExplanation  # noqa: E402

mcp = FastMCP(
    "cbt-mock-creator",
    host=os.environ.get("MCP_HOST", "0.0.0.0"),
    port=int(os.environ.get("MCP_PORT", "8811")),
)


def db_tool(fn):
    """Run a synchronous Django-ORM tool safely from the async MCP event loop."""

    @wraps(fn)
    async def wrapper(*args, **kwargs):
        def run():
            close_old_connections()
            try:
                return fn(*args, **kwargs)
            finally:
                close_old_connections()

        return await sync_to_async(run, thread_sensitive=True)()

    return wrapper


def _exam(slug_or_name: str) -> Exam:
    exam = (Exam.objects.filter(slug=slug_or_name).first() or Exam.objects.filter(name__iexact=slug_or_name).first()
            or Exam.objects.filter(name__icontains=slug_or_name).first())
    if not exam:
        raise ValueError(f"Unknown exam '{slug_or_name}'. Call list_exams to see valid exams.")
    return exam


def _user(username: str):
    user = get_user_model().objects.filter(username=username).first()
    if not user:
        raise ValueError(f"Unknown user '{username}'.")
    return user


def _q(q: Question) -> dict:
    return {
        "id": q.id, "text": q.text, "subject": q.subject.name if q.subject else None,
        "topic": q.topic.name if q.topic else None, "difficulty": q.difficulty, "valid": q.is_valid,
        "notes": q.validation_notes, "answer_source": q.answer_source,
        "options": [{"index": i, "text": o.text, "correct": o.is_correct} for i, o in enumerate(q.options.all())],
    }


@mcp.tool()
@db_tool
def list_exams() -> list[dict]:
    """List supported exams (slug + name)."""
    return [{"slug": e.slug, "name": e.name, "is_default": e.is_default} for e in Exam.objects.filter(is_active=True)]


@mcp.tool()
@db_tool
def get_exam_pattern(exam: str) -> dict:
    """Structured pattern for an exam: duration, sections, questions per section, marks, negative marking,
    difficulty distribution. Always use this instead of assuming a pattern."""
    ex = _exam(exam)
    if not hasattr(ex, "pattern") or ex.pattern is None:
        raise ValueError(f"Exam '{ex.name}' has no pattern configured.")
    return ex.pattern.as_dict()


@mcp.tool()
@db_tool
def get_subjects() -> list[dict]:
    """All subjects with their known topics."""
    return [{"subject": s.name, "topics": [t.name for t in s.topics.all()]} for s in Subject.objects.prefetch_related("topics")]


@mcp.tool()
@db_tool
def get_topics(subject: str) -> list[str]:
    """Topics for one subject."""
    s = services.resolve_subject(subject)
    if not s:
        raise ValueError(f"Unknown subject '{subject}'. Use get_subjects.")
    return [t.name for t in s.topics.all()]


@mcp.tool()
@db_tool
def get_question_bank(username: str, exam: str, subject: str | None = None, limit: int = 50) -> list[dict]:
    """Questions in a user's bank for an exam (optionally one subject), newest first."""
    qs = Question.objects.filter(owner=_user(username), exam=_exam(exam)).select_related("subject", "topic").prefetch_related("options")
    if subject:
        qs = qs.filter(subject__name__iexact=subject)
    return [_q(q) for q in qs.order_by("-id")[: max(1, min(limit, 200))]]


@mcp.tool()
@db_tool
def analyze_question_paper(paper_id: int) -> dict:
    """Summary of an uploaded paper after extraction: counts by subject/difficulty, invalid and unclassified
    questions, plus the first few invalid ones so you can fix them."""
    try:
        paper = QuestionPaper.objects.select_related("exam").get(pk=paper_id)
    except QuestionPaper.DoesNotExist:
        raise ValueError(f"Paper {paper_id} not found.")
    qs = list(paper.questions.select_related("subject", "topic").prefetch_related("options"))
    by_subject: dict[str, int] = {}
    for q in qs:
        by_subject[q.subject.name if q.subject else "Unclassified"] = by_subject.get(q.subject.name if q.subject else "Unclassified", 0) + 1
    return {
        "paper": paper.original_name, "exam": paper.exam.name, "status": paper.status, "error": paper.error,
        "total": len(qs), "valid": sum(q.is_valid for q in qs), "by_subject": by_subject,
        "duplicates_skipped": paper.duplicate_count,
        "needs_attention": [_q(q) for q in qs if not q.is_valid or not q.subject][:15],
    }


@mcp.tool()
@db_tool
def validate_question(question_id: int) -> dict:
    """Run deterministic validation (text length, >=2 options, no duplicates, exactly one correct option)."""
    try:
        q = Question.objects.get(pk=question_id)
    except Question.DoesNotExist:
        raise ValueError(f"Question {question_id} not found.")
    q = services.revalidate(q)
    return _q(q)


@mcp.tool()
@db_tool
def classify_question(question_id: int, subject: str, topic: str | None = None, difficulty: str | None = None,
                      correct_index: int | None = None) -> dict:
    """Set subject/topic/difficulty on a question (subject must exist; see get_subjects). Optionally set the
    correct option index (0-based) when the answer key is missing and you are confident."""
    try:
        q = Question.objects.get(pk=question_id)
    except Question.DoesNotExist:
        raise ValueError(f"Question {question_id} not found.")
    
    s = services.resolve_subject(subject)
    if not s:
        raise ValueError(f"Unknown subject '{subject}'. Use get_subjects.")
    services.update_question(q, subject=s, topic_name=topic, difficulty=difficulty, correct_index=correct_index)
    if correct_index is not None:
        q.refresh_from_db()
        q.answer_source = Question.AnswerSource.AI
        q.save(update_fields=["answer_source"])
    return _q(Question.objects.get(pk=question_id))


@mcp.tool()
@db_tool
def create_questions(username: str, exam: str, questions: list[dict]) -> dict:
    """Add questions to a user's bank (e.g. ones you generated to fill a shortfall). Each item:
    {subject, topic, question, options: [4 strings], correct_index, difficulty, explanation}."""
    user, ex = _user(username), _exam(exam)
    created, skipped = [], []
    for item in questions:
        try:
            q = services.create_question(
                owner=user, exam=ex, subject=item.get("subject"), topic=item.get("topic"), text=item.get("question", ""),
                options=item.get("options", []), correct_index=item.get("correct_index"),
                difficulty=item.get("difficulty", "medium"), origin=Question.Origin.AI_GENERATED, source="Claude via MCP",
                explanation=item.get("explanation", ""), answer_source=Question.AnswerSource.AI,
            )
            (created if q.is_valid else skipped).append(q.id if q.is_valid else {"id": q.id, "notes": q.validation_notes})
        except services.DuplicateQuestion:
            skipped.append({"question": item.get("question", "")[:60], "notes": "duplicate"})
    return {"created_ids": created, "skipped": skipped}


@mcp.tool()
@db_tool
def get_availability(username: str, exam: str, paper_ids: list[int]) -> dict:
    """Deterministic question-count check against the exam pattern (per section shortfall included)."""
    ex = _exam(exam)
    if not hasattr(ex, "pattern") or ex.pattern is None:
        raise ValueError(f"Exam '{ex.name}' has no pattern configured.")
    return builder.availability(_user(username), ex, paper_ids)


@mcp.tool()
@db_tool
def get_missing_question_brief(username: str, exam: str, paper_ids: list[int]) -> list[dict]:
    """Per-section brief of the questions still needed (subject, topics, count, difficulty mix).
    Generate those questions yourself and save them with create_questions."""
    ex = _exam(exam)
    if not hasattr(ex, "pattern") or ex.pattern is None:
        raise ValueError(f"Exam '{ex.name}' has no pattern configured.")
    return generation.shortfall_brief(_user(username), ex, paper_ids)


@mcp.tool()
@db_tool
def create_mock_test(username: str, exam: str, paper_ids: list[int], title: str | None = None) -> dict:
    """Build the mock deterministically. If questions are insufficient, returns availability instead of a mock."""
    try:
        mock = builder.create_mock(_user(username), _exam(exam), paper_ids, title)
    except builder.InsufficientQuestions as e:
        return {"created": False, "availability": e.availability}
    return {"created": True, "mock_id": mock.id, "title": mock.title, "questions": mock.questions.count()}


@mcp.tool()
@db_tool
def explain_question(question_id: int) -> dict:
    """Return a question with its correct answer so you can write an explanation, then store it with save_explanation."""
    try:
        q = Question.objects.select_related("subject", "topic").prefetch_related("options").get(pk=question_id)
        return _q(q)
    except Question.DoesNotExist:
        raise ValueError(f"Question {question_id} not found.")


@mcp.tool()
@db_tool
def save_explanation(question_id: int, explanation: str) -> dict:
    """Store a written explanation for a question."""
    if not Question.objects.filter(pk=question_id).exists():
        raise ValueError(f"Question {question_id} not found.")
    QuestionExplanation.objects.update_or_create(question_id=question_id, defaults={"text": explanation})
    return {"saved": True}


@mcp.tool()
@db_tool
def delete_exam(exam_slug: str) -> dict:
    """Delete an exam and all its associated data. 
    WARNING: You MUST ask the user for explicit confirmation before calling this tool."""
    exam = _exam(exam_slug)
    if exam.is_default:
        raise ValueError(f"Exam '{exam.name}' is a default system exam and cannot be deleted.")
    exam.delete()
    return {"deleted": True, "exam": exam.name}


@mcp.tool()
@db_tool
def delete_question(question_id: int) -> dict:
    """Delete a specific question from the database.
    WARNING: You MUST ask the user for explicit confirmation before calling this tool."""
    try:
        q = Question.objects.get(pk=question_id)
        q.delete()
        return {"deleted": True, "question_id": question_id}
    except Question.DoesNotExist:
        raise ValueError(f"Question {question_id} not found.")


@mcp.tool()
@db_tool
def delete_paper(paper_id: int) -> dict:
    """Delete a question paper and all its associated questions.
    WARNING: You MUST ask the user for explicit confirmation before calling this tool."""
    try:
        p = QuestionPaper.objects.get(pk=paper_id)
        p.delete()
        return {"deleted": True, "paper_id": paper_id}
    except QuestionPaper.DoesNotExist:
        raise ValueError(f"Paper {paper_id} not found.")


if __name__ == "__main__":
    import uvicorn
    import httpx
    import time
    from starlette.applications import Starlette
    from starlette.routing import Route, Mount
    from starlette.responses import PlainTextResponse, JSONResponse
    from mcp.server.sse import SseServerTransport

    sse_transport = SseServerTransport("/messages/")
    PUBLIC_BACKEND_URL = os.environ.get("PUBLIC_BACKEND_URL", "http://localhost:8000")

    async def handle_sse(request):
        async with sse_transport.connect_sse(request.scope, request.receive, request._send) as streams:
            await mcp._mcp_server.run(streams[0], streams[1], mcp._mcp_server.create_initialization_options())

    from asgiref.sync import sync_to_async

    @sync_to_async
    def get_signed_auth_url():
        from django.contrib.auth import get_user_model
        from django.core.signing import Signer
        User = get_user_model()
        user = User.objects.filter(is_superuser=True).first() or User.objects.first()
        if not user:
            return f"{PUBLIC_BACKEND_URL}/api/accounts/oauth/authorize"
        sig = Signer().sign(user.username)
        return f"{PUBLIC_BACKEND_URL}/api/accounts/oauth/authorize?sig={sig}"

    async def protected_resource_metadata(request):
        auth_url = await get_signed_auth_url()
        return JSONResponse({
            "resource": "cbt-mock-creator",
            "authorization_servers": [auth_url],
        })

    _token_cache: dict[str, float] = {}

    async def _token_is_valid(token: str) -> bool:
        now = time.monotonic()
        if token in _token_cache and now - _token_cache[token] < 30:
            return True
            
        try:
            async with httpx.AsyncClient(base_url=PUBLIC_BACKEND_URL, timeout=10) as client:
                resp = await client.get("/api/accounts/me/", headers={"Authorization": f"Bearer {token}"})
        except httpx.HTTPError:
            return False
            
        if resp.status_code == 200:
            _token_cache[token] = now
            return True
        return False

    starlette_app = Starlette(routes=[
        Route("/sse", endpoint=handle_sse),
        Mount("/messages/", app=sse_transport.handle_post_message),
        Route("/.well-known/oauth-protected-resource", endpoint=protected_resource_metadata),
    ])

    class BearerAuthMiddleware:
        def __init__(self, app):
            self.app = app

        async def __call__(self, scope, receive, send):
            if scope["type"] != "http" or scope["path"] == "/.well-known/oauth-protected-resource":
                return await self.app(scope, receive, send)

            headers = dict(scope.get("headers") or [])
            auth_header = headers.get(b"authorization", b"").decode()
            token = auth_header[7:] if auth_header.lower().startswith("bearer ") else None

            if not token or not await _token_is_valid(token):
                response = PlainTextResponse(
                    "Unauthorized", status_code=401,
                    headers={"WWW-Authenticate": 'Bearer resource_metadata="/.well-known/oauth-protected-resource"'}
                )
                return await response(scope, receive, send)

            await self.app(scope, receive, send)

    app_with_auth = BearerAuthMiddleware(starlette_app)
    port = int(os.environ.get("MCP_PORT", "8811"))
    uvicorn.run(app_with_auth, host="0.0.0.0", port=port)
