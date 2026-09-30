"""Claude-backed helpers: classify, infer answers, generate, extract, explain.

These are *understanding* tasks only. Timer, scoring and exam state stay deterministic in Django.
The same service functions are exposed to external Claude clients through the MCP server.
"""
import json
import logging
import re

from django.conf import settings

log = logging.getLogger(__name__)


class AIUnavailable(Exception):
    pass


def is_enabled() -> bool:
    return bool(settings.ANTHROPIC_API_KEY)


def _call(system: str, user: str, max_tokens: int = 8000) -> str:
    if not is_enabled():
        raise AIUnavailable("ANTHROPIC_API_KEY is not configured")
    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    resp = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")


def _parse_json(text: str):
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.M).strip()
    starts = [i for i in (text.find("["), text.find("{")) if i != -1]
    if not starts:
        raise ValueError("No JSON in model response")
    return json.JSONDecoder().raw_decode(text[min(starts):])[0]


JSON_SYSTEM = "You are a careful assistant for Indian competitive-exam content. Reply with valid JSON only - no prose, no markdown."


def classify_questions(items: list[dict], allowed: dict[str, list[str]]) -> list[dict]:
    """items: [{id, text, options, has_answer}] -> [{id, subject, topic, difficulty, answer_index}]"""
    user = (
        "Allowed subjects with known topics:\n"
        f"{json.dumps(allowed, ensure_ascii=False)}\n\n"
        "For every question return an object with keys:\n"
        '  "id": the question id,\n'
        '  "subject": exactly one of the allowed subject names,\n'
        '  "topic": short topic name (prefer known topics),\n'
        '  "difficulty": "easy" | "medium" | "hard",\n'
        '  "answer_index": 0-based index of the correct option when "has_answer" is false, otherwise null.\n'
        "Return a JSON array.\n\nQuestions:\n" + json.dumps(items, ensure_ascii=False)
    )
    data = _parse_json(_call(JSON_SYSTEM, user))
    return data if isinstance(data, list) else []


def generate_questions(exam_name, subject, topics, count, difficulty_mix, avoid, language="english") -> list[dict]:
    lang_prompt = "Write the questions, options, and explanation in English. Leave the `_hi` fields empty."
    if language == "hindi":
        lang_prompt = "Write the questions, options, and explanation entirely in Hindi. Put them in the `_hi` fields. Leave the English fields empty."
    elif language == "both":
        lang_prompt = "Write the questions, options, and explanation in BOTH English and Hindi. Use the base fields for English, and the `_hi` fields for Hindi."

    user = (
        f"Write {count} new, original multiple-choice questions for the {exam_name} exam.\n"
        f"Subject: {subject}\nPreferred topics (mix them): {json.dumps(topics)}\n"
        f"Difficulty mix in percent: {json.dumps(difficulty_mix)}\n"
        "Each question needs exactly 4 options and exactly one correct option. Questions must be unambiguous, "
        "factually correct and match the style and difficulty of the real exam.\n"
        f"Do not repeat or paraphrase these existing questions: {json.dumps(avoid, ensure_ascii=False)}\n\n"
        f"LANGUAGE INSTRUCTION: {lang_prompt}\n\n"
        'Return a JSON array of objects: {"question": str, "question_hi": str, "options": [str, str, str, str], "options_hi": [str, str, str, str], '
        '"correct_index": 0-3, "topic": str, "difficulty": "easy|medium|hard", "explanation": str, "explanation_hi": str}'
    )
    data = _parse_json(_call(JSON_SYSTEM, user, max_tokens=12000))
    return data if isinstance(data, list) else []


def extract_questions_from_text(text: str) -> list[dict]:
    """Fallback when regex segmentation struggles (messy OCR, unusual layouts)."""
    out: list[dict] = []
    for i in range(0, len(text), 9000):
        chunk = text[i : i + 9000]
        user = (
            "Extract every complete multiple-choice question from this raw PDF/OCR text. Fix obvious OCR noise but do not "
            "invent content. Skip incomplete questions cut off at the chunk edge.\n"
            'Return a JSON array of {"text": str, "options": [str, ...], "answer_index": 0-based int or null}. '
            "Use answer_index only if an answer is explicitly printed.\n\nTEXT:\n" + chunk
        )
        try:
            data = _parse_json(_call(JSON_SYSTEM, user))
            out.extend(d for d in data if isinstance(d, dict))
        except Exception:
            log.exception("AI extraction failed on chunk %s", i)
    return out


def explain_question(text: str, options: list[str], correct_index: int) -> str:
    user = (
        "Explain step by step, concisely, why the marked option is correct. Add a quick shortcut or memory tip if useful.\n\n"
        f"Question: {text}\nOptions: {json.dumps(options, ensure_ascii=False)}\nCorrect option: {options[correct_index]}"
    )
    return _call("You are a friendly exam tutor. Use plain text, no markdown headings.", user, max_tokens=1200).strip()
