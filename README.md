# CBT Mock Test Creator & Exam Simulator

Upload practice-paper PDFs/images → extract questions → classify with Claude (via MCP) → build a mock that follows the exam pattern → take it in a real CBT-style interface → get scored results and analysis.

**Stack:** React + TypeScript (Vite, React Router, TanStack Query, Zustand, Tailwind) · Django + DRF · PostgreSQL · Celery + Redis · MCP server (FastMCP) for Claude.

## Quick start

```bash
cp .env.example .env          # already present; add ANTHROPIC_API_KEY to enable AI features
docker compose up --build
```

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:5173        |
| API       | http://localhost:8000/api/   |
| Admin     | http://localhost:8000/admin/ |
| MCP       | http://localhost:8811/mcp    |

Create an admin user (to edit exam patterns): `docker compose exec backend python manage.py createsuperuser`

Migrations and exam seeding (`seed_exams`) run automatically on backend start.

### Hot reload
- **Backend:** source is bind-mounted; Django `runserver` reloads on change.
- **Celery worker and MCP server:** restarted by `watchfiles` on any `.py` change.
- **Frontend:** Vite dev server with polling (works on Docker Desktop / WSL).
- After changing `frontend/package.json`: `docker compose exec frontend npm install` (or `docker compose down -v && docker compose up --build`).
- After changing `backend/requirements.txt`: `docker compose up --build`.

`make up | down | logs | migrations | migrate | superuser | seed | test | reset` are shortcuts.

## Architecture: AI vs deterministic

| Layer | Responsibility |
|-------|----------------|
| Claude / MCP | Understand, extract (fallback), classify, generate missing questions, explain |
| Django | Store, validate, schedule, **timer deadline, scoring, negative marking**, persist, analytics |
| React | Display, interact, navigate, timer UI, results |

The exam deadline lives on the server (`TestSession.expires_at`); the client clock is only a display. Submission is idempotent and expired sessions are auto-submitted (lazy on access plus a Celery ETA backstop). Unsaved answers are mirrored to `localStorage` and restored after a refresh or network drop.

The "not enough questions" check is pure backend logic (`/api/mocks/availability/`). Creating a mock with too few questions returns **409**; the UI then offers: add my own questions, upload another paper, or generate additional questions with AI.

## Connecting Claude to the MCP server

```bash
claude mcp add --transport http cbt http://localhost:8811/mcp
```

Tools: `list_exams`, `get_exam_pattern`, `get_subjects`, `get_topics`, `get_question_bank`, `analyze_question_paper`, `validate_question`, `classify_question`, `create_questions`, `get_availability`, `get_missing_question_brief`, `create_mock_test`, `explain_question`, `save_explanation`.

## Notes and caveats
- Extraction is heuristic (regex segmentation + answer-key parsing, Tesseract OCR for scans, `eng+hin`). If the regex finds few questions, Claude extraction is used as a fallback. Papers with unusual layouts may need review.
- `ANTHROPIC_API_KEY` is optional. Without it, upload/extract, manual subject assignment, manual questions and the whole CBT flow still work; classification, generation and explanations return a clear "not configured" error.
- Seeded exam patterns are **simplified starting points**. Verify them against the official notification and edit them in the admin.
- The MCP server has **no authentication**. Do not expose port 8811 beyond localhost.
- Dev `SECRET_KEY`, `DEBUG=1` and open CORS are development defaults; harden before deploying (phase 8: Nginx, backups, monitoring, rate limiting).

## Project structure

```
cbt-mock-creator/
├── docker-compose.yml   .env / .env.example   Makefile
├── backend/
│   ├── config/          settings, celery, urls
│   ├── apps/
│   │   ├── accounts/    register / login (JWT)
│   │   ├── exams/       Exam, ExamPattern, PatternSection, Subject, Topic + seed_exams
│   │   ├── questions/   Question bank, AI helpers (classify/generate/extract/explain)
│   │   ├── papers/      Upload, text extraction, OCR, segmentation (Celery)
│   │   ├── mocks/       Availability, mock builder, AI generation jobs
│   │   ├── attempts/    Sessions, answers, deterministic scoring, results
│   │   └── analytics/   Performance summary
│   └── mcp_server/      FastMCP server exposing the tools above
└── frontend/
    └── src/
        ├── api/         axios client (JWT refresh), types, endpoints
        ├── store/       auth + live exam state (Zustand)
        ├── features/exam/  palette, submit dialog, autosave, fullscreen, keyboard
        ├── components/  layout, protected route, manual-question modal
        └── pages/       Login, Register, Dashboard, CreateMock, Instructions, Exam, Result, Analytics
```
