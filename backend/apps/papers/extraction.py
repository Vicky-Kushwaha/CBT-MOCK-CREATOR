"""PDF/image -> raw text -> structured questions.

Segmentation is heuristic (regex). When it struggles, tasks.py falls back to Claude-based extraction.
"""
import re

from django.conf import settings

Q_START = re.compile(r"^\s*(?:Q(?:uestion)?\s*\.?\s*)?(\d{1,3})\s*[\.\)\:]\s+(\S.*)$", re.I)
PAREN_OPT = re.compile(r"(?m)(?:(?<=\s)|^)\(([A-Da-d1-4])\)\s*")
LINE_OPT = re.compile(r"(?m)^\s*([A-Da-d])[\.\)]\s+")
ANS_INLINE = re.compile(r"(?im)^\s*(?:ans(?:wer)?|correct\s+answer)\s*[:\-\.]\s*\(?([A-Da-d1-4])\)?.*$")
KEY_PAIR = re.compile(r"(\d{1,3})\s*[\.\-:\)]?\s*\(?([A-Da-d])\)?(?=\s|,|;|$)")
NOISE = re.compile(r"^(page\s*\d+(\s*of\s*\d+)?|\d+\s*/\s*\d+)$", re.I)


def _ocr_image(img) -> str:
    import pytesseract

    return pytesseract.image_to_string(img, lang=settings.OCR_LANGS)


def extract_text(path: str, file_type: str) -> str:
    if file_type == "pdf":
        import fitz  # PyMuPDF
        from PIL import Image

        parts = []
        with fitz.open(path) as doc:
            for page in doc:
                text = page.get_text("text", sort=True)
                if len(text.strip()) < 40:  # scanned page -> OCR
                    pix = page.get_pixmap(dpi=200, alpha=False)
                    text = _ocr_image(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
                parts.append(text)
        return "\n".join(parts)
    from PIL import Image

    return _ocr_image(Image.open(path))


def _idx(ch: str) -> int:
    ch = ch.lower()
    return "abcd".index(ch) if ch in "abcd" else int(ch) - 1


def _option_markers(block: str) -> list[tuple[int, int]]:
    for pattern in (PAREN_OPT, LINE_OPT):
        seq, want = [], 0
        for m in pattern.finditer(block):
            if _idx(m.group(1)) == want:
                seq.append((m.start(), m.end()))
                want += 1
                if want == 4:
                    break
        if len(seq) >= 2:
            return seq
    return []


def _parse_block(lines: list[str]) -> dict:
    block = "\n".join(lines)
    answer = None
    m = ANS_INLINE.search(block)
    if m:
        answer = _idx(m.group(1))
        block = block[: m.start()] + block[m.end():]
    marks = _option_markers(block)
    if not marks:
        return {"text": re.sub(r"\s+", " ", block).strip(), "options": [], "answer_index": answer}
    text = block[: marks[0][0]]
    options = []
    for i, (_, end) in enumerate(marks):
        stop = marks[i + 1][0] if i + 1 < len(marks) else len(block)
        options.append(re.sub(r"\s+", " ", block[end:stop]).strip())
    return {"text": re.sub(r"\s+", " ", text).strip(), "options": options, "answer_index": answer}


def _split_answer_key(text: str) -> tuple[str, dict[int, int]]:
    idx = text.lower().rfind("answer key")
    if idx <= 0:
        return text, {}
    key = {int(n): _idx(a) for n, a in KEY_PAIR.findall(text[idx:])}
    return text[:idx], key


def segment_questions(text: str) -> list[dict]:
    body, key = _split_answer_key(text)
    blocks, current, last = [], None, 0
    for raw in body.splitlines():
        line = raw.strip()
        if not line or NOISE.match(line):
            continue
        m = Q_START.match(line)
        if m and int(m.group(1)) == last + 1:  # sequential numbering avoids mistaking "1." options for questions
            last = int(m.group(1))
            current = {"number": last, "lines": [m.group(2)]}
            blocks.append(current)
        elif current is not None:
            current["lines"].append(line)
    questions = []
    for b in blocks:
        parsed = _parse_block(b["lines"])
        if not parsed["text"]:
            continue
        if parsed["answer_index"] is None:
            parsed["answer_index"] = key.get(b["number"])
        parsed["number"] = b["number"]
        questions.append(parsed)
    return questions
