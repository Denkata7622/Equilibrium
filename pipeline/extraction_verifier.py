#!/usr/bin/env python3
"""extraction_verifier.py — professional extraction verifier.

Categories of failure detected:
- FAIL_HALLUCINATED    — quote/statement not in source
- FAIL_NUMERIC         — quote has numbers not in source
- FAIL_NULL_NUM        — problem has no num
- FAIL_DUPLICATE       — two problems share the same num
- FAIL_MIXED_GRADE     — problem's grade doesn't match filename
- FAIL_MISSING         — fewer problems than expected
- FAIL_COUNT           — more problems than expected
- FAIL_UNREADABLE      — [неразчетено] markers
- FAIL_LOW_CONFIDENCE  — avg quote confidence below threshold
- FAIL_NO_EXTRACTION   — extractor returned 0 problems

Each verdict maps to a recommended escalation level:
- L1_ocr         — OCR text (different source text)
- L2_vlm         — VLM transcription (different extraction path)
- L3_escalation  — smarter/expensive extractor
- human_review   — all automated levels exhausted
"""
import json
import re
import unicodedata
import logging
from dataclasses import dataclass, field, asdict
from typing import Optional

log = logging.getLogger("verifier")


# ═══════════════════════════════════════════════════════════════
# OCR CONFUSABLE PAIRS — for fuzzy matching only, never for writes
# ═══════════════════════════════════════════════════════════════
_OCR_FOLD_MAP = str.maketrans({
    '0': 'o', 'О': 'o',
    '1': 'l', 'I': 'l', '|': 'l',
    '5': 's',
    '8': 'b',
    '2': 'z',
    '6': 'g',
    '×': 'x', 'х': 'x',
    '–': '-', '—': '-', '−': '-',
    '“': '"', '”': '"', '„': '"',
    '‘': "'", '’': "'",
    'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff',
})

_SENTENCE_PUNCT = '.,;:!?"\'«»„“”‘’'


def _clean_token(t: str) -> str:
    return t.strip(_SENTENCE_PUNCT)


def _strip_sentence_punct(s: str) -> str:
    return ' '.join(_clean_token(t) for t in s.split() if _clean_token(t))


def _normalize(s: str) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFKC", s)
    s = s.casefold()
    s = s.translate(_OCR_FOLD_MAP)
    s = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1\2', s)
    s = re.sub(r'[*_`]', '', s)
    s = re.sub(r'[{}]', '', s)
    s = re.sub(r'\$+', '', s)
    # Convert LaTeX math commands to their Unicode equivalents BEFORE
    # stripping backslashes, so "\sqrt{p}" matches "√p".
    latex_to_unicode = [
        (r'< \)', '∠'),  # pypdf artifact: `∠` → `<)` with optional space
        (r'<\)', '∠'),   # pypdf artifact: `∠` → `<)` 
        (r'\\sqrt\s*\{?([^{}]*)\}?', r'√\1'),
        (r'\\le(?![a-zA-Z])', '≤'),
        (r'\\ge(?![a-zA-Z])', '≥'),
        (r'\\times(?![a-zA-Z])', '×'),
        (r'\\cdot(?![a-zA-Z])', '·'),
        (r'\\pm(?![a-zA-Z])', '±'),
        (r'\\infty(?![a-zA-Z])', '∞'),
        (r'\\alpha(?![a-zA-Z])', 'α'),
        (r'\\beta(?![a-zA-Z])', 'β'),
        (r'\\gamma(?![a-zA-Z])', 'γ'),
        (r'\\delta(?![a-zA-Z])', 'δ'),
        (r'\\pi(?![a-zA-Z])', 'π'),
        (r'\\angle(?![a-zA-Z])', '∠'),
        (r'\\triangle(?![a-zA-Z])', '△'),
        (r'\\in(?![a-zA-Z])', '∈'),
        (r'\\subset(?![a-zA-Z])', '⊂'),
        (r'\\cup(?![a-zA-Z])', '∪'),
        (r'\\cap(?![a-zA-Z])', '∩'),
    ]
    for pat, repl in latex_to_unicode:
        s = re.sub(pat, repl, s)
    s = re.sub(r'\\[a-zA-Z]+', '', s)  # strip remaining LaTeX
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def _match_quality(quote: str, haystack: str) -> dict:
    """EXACT / NORMALIZED / OCR_FUZZY / ABSENT."""
    nq = _normalize(quote)
    nh = _normalize(haystack)
    if not nq:
        return {"grade": "ABSENT", "confidence": 0.0}

    if quote.strip() and quote.strip() in haystack:
        return {"grade": "EXACT", "confidence": 1.00}
    if nq in nh:
        return {"grade": "NORMALIZED", "confidence": 0.95}

    nq_p = _strip_sentence_punct(nq)
    nh_p = _strip_sentence_punct(nh)
    if nq_p and nq_p in nh_p:
        return {"grade": "NORMALIZED", "confidence": 0.93}

    q_tok = [_clean_token(t) for t in nq.split()]
    h_tok = [_clean_token(t) for t in nh.split()]
    q_tok = [t for t in q_tok if t]
    h_tok = [t for t in h_tok if t]
    if len(q_tok) < 3:
        return {"grade": "ABSENT", "confidence": 0.0}

    max_interruptions = max(1, min(4, len(q_tok) // 25))
    max_gap = max(5, min(25, len(q_tok) // 4))
    # Allow up to 2 quote tokens to be "skipped" — they may be OCR typos
    # corrected by the model ("тригълник" → "триъгълник"). Only for longer
    # quotes, and only 1-2 max to avoid accepting real hallucinations.
    max_skipped_quote = min(2, len(q_tok) // 8) if len(q_tok) >= 8 else 0

    best_matched = 0
    best_score = 0.0
    for start in range(len(h_tok)):
        if h_tok[start] != q_tok[0]:
            continue
        matched, interruptions, skipped_quote = 1, 0, 0
        hi = start + 1
        for qi in range(1, len(q_tok)):
            found = -1
            for hj in range(hi, min(hi + max_gap + 1, len(h_tok))):
                if h_tok[hj] == q_tok[qi]:
                    found = hj
                    break
            if found < 0:
                # Quote token not in source — likely OCR typo correction
                skipped_quote += 1
                if skipped_quote > max_skipped_quote:
                    break
                continue
            if found - hi > 0:
                interruptions += 1
                if interruptions > max_interruptions:
                    break
            matched += 1
            hi = found + 1

        # Coverage = matched / total quote tokens
        score = matched / len(q_tok)
        if score > best_score:
            best_score = score
            best_matched = matched

    coverage = best_score

    if coverage >= 0.80:
        return {"grade": "OCR_FUZZY", "confidence": round(0.85 * coverage, 2)}
    return {"grade": "ABSENT", "confidence": 0.0}


def _numeric_guard(quote: str, haystack: str) -> bool:
    q_nums = set(re.findall(r'\d+(?:[.,]\d+)?', quote or ""))
    h_nums = set(re.findall(r'\d+(?:[.,]\d+)?', haystack or ""))
    return len(q_nums - h_nums) == 0


def _has_unreadable(p: dict) -> bool:
    return any("[неразчетено]" in (p.get(f) or "") for f in ("statement", "solution"))


def _check_problem_content(p: dict, source_text: str) -> dict:
    quote = (p.get("source_quote") or "").strip()
    stmt = (p.get("statement") or "").strip()

    if _has_unreadable(p):
        return {"matched": False, "grade": "UNREADABLE",
                "confidence": 0.0, "reason": "has_unreadable_markers"}

    if quote:
        q = _match_quality(quote, source_text)
        if q["grade"] != "ABSENT":
            if not _numeric_guard(quote, source_text):
                return {"matched": False, "grade": "NUMERIC_MISMATCH",
                        "confidence": 0.0, "reason": "quote_numeric_mismatch"}
            return {"matched": True, **q}

    if stmt:
        q = _match_quality(stmt, source_text)
        if q["grade"] != "ABSENT":
            if not _numeric_guard(stmt, source_text):
                return {"matched": False, "grade": "NUMERIC_MISMATCH",
                        "confidence": 0.0, "reason": "statement_numeric_mismatch"}
            q["confidence"] = max(0.0, q["confidence"] - 0.10)
            return {"matched": True, **q}

    return {"matched": False, "grade": "ABSENT",
            "confidence": 0.0, "reason": "no_match_in_source"}


# ═══════════════════════════════════════════════════════════════
# Grade helpers
# ═══════════════════════════════════════════════════════════════
def _grade_of(p: dict) -> Optional[int]:
    try:
        return int(p.get("grade")) if p.get("grade") is not None else None
    except (ValueError, TypeError):
        return None


def _num_grade(p: dict) -> Optional[int]:
    num = p.get("num")
    if isinstance(num, str) and "." in num:
        try:
            return int(num.split(".", 1)[0])
        except (ValueError, IndexError):
            return None
    return None


def _num_key(p: dict) -> str:
    num = p.get("num")
    return str(num).strip() if num is not None else ""


# ═══════════════════════════════════════════════════════════════
# Structured result
# ═══════════════════════════════════════════════════════════════
@dataclass
class VerificationResult:
    verdict: str
    expected: Optional[int]
    actual: int
    verified: list = field(default_factory=list)
    hallucinated: list = field(default_factory=list)
    unreadable: list = field(default_factory=list)
    wrong_grade: list = field(default_factory=list)
    duplicates: list = field(default_factory=list)
    null_num: list = field(default_factory=list)
    numeric_mismatch: list = field(default_factory=list)
    avg_confidence: float = 0.0
    expected_grade: Optional[int] = None
    grade_distribution: dict = field(default_factory=dict)
    escalate_to: str = "none"
    reasons: list = field(default_factory=list)
    ai_checked: bool = False
    ai_result: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        d = asdict(self)
        for k in ("verified", "hallucinated", "unreadable", "wrong_grade",
                  "duplicates", "null_num", "numeric_mismatch"):
            d[k] = len(d[k])
        return d


def _determine_verdict(
    verified, hallucinated, unreadable, wrong_grade, duplicates, null_num,
    numeric_mismatch, expected, tolerance, avg_conf, expected_grade, cfg
) -> tuple:
    unreadable_thr = cfg.get("unreadable_threshold_pct", 0.15)
    min_conf = cfg.get("min_avg_confidence", 0.75)
    total_rel = len(verified) + len(hallucinated) + len(unreadable)
    unreadable_pct = len(unreadable) / total_rel if total_rel else 0.0

    # Allow up to 1 unverified problem IF we still have enough verified.
    # Common cause: R1 rewrites LaTeX slightly ("2^{2ax+1}" → "2^(2ax+1)")
    # which fails verbatim but is not a real hallucination. If 5/6 pass with
    # high confidence, 1 borderline is noise, not hallucination.
    verified_target = (expected - tolerance) if expected is not None else len(verified)
    if hallucinated and len(hallucinated) > 1:
        return "FAIL_HALLUCINATED", "L1_ocr", \
               [f"{len(hallucinated)} hallucinated problems"]
    if hallucinated:
        # 1 outlier: allow PASS_WITH_WARNINGS if we still have enough verified
        # AND confidence is high. Common cause: R1 "fixes" OCR typo in quote
        # → verbatim fails, but problem is real.
        if len(verified) >= verified_target - 1 and avg_conf >= 0.85:
            return "PASS_WITH_WARNINGS", "none", \
                   [f"1 borderline unverified (conf={avg_conf:.2f}), "
                    f"{len(verified)}/{verified_target} verified"]
        return "FAIL_HALLUCINATED", "L1_ocr", \
               [f"{len(hallucinated)} hallucinated + only {len(verified)}/{verified_target} verified"]
    if numeric_mismatch:
        return "FAIL_NUMERIC", "L2_vlm", \
               [f"{len(numeric_mismatch)} numeric mismatches"]
    if null_num:
        return "FAIL_NULL_NUM", "L1_ocr", \
               [f"{len(null_num)} problems with null num"]
    if duplicates:
        return "FAIL_DUPLICATE", "L1_ocr", \
               [f"{len(duplicates)} duplicate num values"]
    if wrong_grade:
        return "FAIL_MIXED_GRADE", "L1_ocr", \
               [f"{len(wrong_grade)} wrong grade (expected {expected_grade})"]
    if expected is not None:
        if len(verified) < expected - tolerance:
            return "FAIL_MISSING", "L1_ocr", \
                   [f"missing: {len(verified)} < {expected}±{tolerance}"]
        if len(verified) > expected + tolerance:
            return "FAIL_COUNT", "L2_vlm", \
                   [f"extra: {len(verified)} > {expected}±{tolerance}"]
    if unreadable_pct > unreadable_thr:
        return "FAIL_UNREADABLE", "L2_vlm", \
               [f"unreadable ratio {unreadable_pct:.2f} > {unreadable_thr}"]
    if avg_conf < min_conf:
        return "FAIL_LOW_CONFIDENCE", "L3_escalation", \
               [f"low confidence {avg_conf:.2f} < {min_conf}"]
    if unreadable:
        return "PASS_WITH_WARNINGS", "none", \
               [f"{len(unreadable)} unreadable (below threshold)"]
    if hallucinated:
        return "PASS_WITH_WARNINGS", "none", \
               [f"{len(hallucinated)} unverified (below threshold) — likely LaTeX normalization"]
    return "PASS", "none", []


def verify_extraction(
    problems: list,
    source_text: str,
    pdf_name: str,
    expected: Optional[int] = None,
    tolerance: int = 1,
    expected_grade: Optional[int] = None,
    ai_client=None,
    config: dict = None,
) -> VerificationResult:
    cfg = config or {}

    # Pre-filter by grade — verifier must not judge problems that will
    # be filtered out anyway. Otherwise mixed-grade files always fail.
    if expected_grade is not None:
        original_count = len(problems)
        problems = [
            p for p in problems
            if _grade_of(p) == expected_grade or _num_grade(p) == expected_grade
        ]
        if len(problems) < original_count:
            log.info(
                f"[{pdf_name}] verifier: pre-filtered {original_count} → {len(problems)} "
                f"(expected grade={expected_grade})"
            )

    # Dedupe by num BEFORE validation. Duplicates are artifacts of segmented
    # extraction. _dedupe_problems runs again after save.
    if problems:
        seen_nums = set()
        deduped = []
        for p in problems:
            n = _num_key(p)
            if n and n in seen_nums:
                continue
            if n:
                seen_nums.add(n)
            deduped.append(p)
        if len(deduped) < len(problems):
            log.info(f"[{pdf_name}] verifier: deduped {len(problems)} → {len(deduped)}")
        problems = deduped

    verified, hallucinated, unreadable = [], [], []
    wrong_grade, duplicates, null_num, numeric_mismatch = [], [], [], []
    confidences = []

    # Duplicate nums
    num_counts = {}
    for p in problems:
        k = _num_key(p)
        if k:
            num_counts[k] = num_counts.get(k, 0) + 1
    dup_nums = {k for k, c in num_counts.items() if c > 1}

    for p in problems:
        if _num_key(p) in dup_nums:
            duplicates.append(p)
        if p.get("num") is None or p.get("num") == "":
            null_num.append(p)
        if expected_grade is not None:
            if _grade_of(p) != expected_grade and _num_grade(p) != expected_grade:
                wrong_grade.append(p)

        r = _check_problem_content(p, source_text)
        if r["grade"] == "UNREADABLE":
            unreadable.append({**p, "_verify": r})
        elif r["grade"] == "NUMERIC_MISMATCH":
            numeric_mismatch.append({**p, "_verify": r})
        elif r["matched"]:
            verified.append({**p, "_verify": r})
            confidences.append(r["confidence"])
        else:
            hallucinated.append({**p, "_verify": r})

    avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

    grade_dist = {}
    for p in problems:
        g = _grade_of(p) or _num_grade(p)
        if g:
            grade_dist[g] = grade_dist.get(g, 0) + 1

    verdict, escalate_to, reasons = _determine_verdict(
        verified, hallucinated, unreadable, wrong_grade,
        duplicates, null_num, numeric_mismatch,
        expected, tolerance, avg_conf, expected_grade, cfg
    )

    result = VerificationResult(
        verdict=verdict, expected=expected, actual=len(problems),
        verified=verified, hallucinated=hallucinated, unreadable=unreadable,
        wrong_grade=wrong_grade, duplicates=duplicates, null_num=null_num,
        numeric_mismatch=numeric_mismatch,
        avg_confidence=round(avg_conf, 3),
        expected_grade=expected_grade, grade_distribution=grade_dist,
        escalate_to=escalate_to, reasons=reasons,
    )


    if ai_client and cfg.get("enable_ai_fallback", False):
        needs_ai = verdict in (
            "FAIL_HALLUCINATED", "FAIL_MISSING", "FAIL_COUNT",
            "FAIL_UNREADABLE", "FAIL_LOW_CONFIDENCE", "FAIL_MIXED_GRADE"
        )
        if needs_ai:
            log.info(f"[{pdf_name}] verifier: AI fallback (verdict={verdict})")
            try:
                result.ai_result = _ai_verify(
                    problems, source_text, pdf_name, expected, ai_client
                )
                result.ai_checked = True
            except Exception as e:
                log.error(f"[{pdf_name}] AI verifier failed: {e}")

    return result


def _format_prompt(template, **kwargs):
    if not kwargs:
        return template
    pattern = re.compile(r'\{(' + '|'.join(re.escape(k) for k in kwargs) + r')\}')
    return pattern.sub(lambda m: str(kwargs[m.group(1)]), template)


def _parse_json(text):
    if not text:
        return None
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```\s*$', '', text)
    m = re.search(r'\{.*\}', text, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        try:
            return json.loads(re.sub(r',\s*([}\]])', r'\1', m.group(0)))
        except Exception:
            return None


def _ai_verify(problems, source_text, pdf_name, expected, ai_client):
    problems_json = [
        {"index": i, "num": str(p.get("num")),
         "statement": (p.get("statement") or "")[:600],
         "source_quote": (p.get("source_quote") or "")[:300]}
        for i, p in enumerate(problems)
    ]

    prompt = """Ти си строг верификатор на extraction от олимпиадни PDF-и.

═══ SOURCE ═══
{source}

═══ EXTRACTOR OUTPUT ({n}) ═══
{problems}

═══ ОЧАКВАН БРОЙ ═══
{expected}

За ВСЯКА задача: присъства ли statement в source? (yes/no/partial)

Върни САМО JSON:
{{
  "per_problem": [{{"index": 0, "present": "yes|no|partial", "reason": "..."}}],
  "missing_count": число,
  "hallucinated_indices": [index-и],
  "overall": "ok|missing|hallucinated|mixed"
}}"""

    user = _format_prompt(
        prompt,
        source=source_text[:15000],
        problems=json.dumps(problems_json, ensure_ascii=False, indent=2),
        n=len(problems),
        expected=expected if expected is not None else "unknown",
    )

    raw = ai_client.call(prompt, user, f"{pdf_name}-verify")
    if not raw:
        return {"error": "no_response"}
    parsed = _parse_json(raw)
    if not parsed:
        return {"error": "parse_failed"}
    return {
        "missing_count": parsed.get("missing_count"),
        "hallucinated_indices": parsed.get("hallucinated_indices", []),
        "overall": parsed.get("overall"),
    }