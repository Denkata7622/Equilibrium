#!/usr/bin/env python3
"""
insight_cards.py v2 — per-problem insight cards (12-секционни).

Промени спрямо v1:
  - картата идва между <<<CARD ... CARD>>> (без JSON ескейпване на LaTeX); fallback към стария JSON
  - маха <think>...</think> (reasoning модели)
  - локална проверка на структурата ПРЕДИ verifier (хваща отрязани карти, без разход)
  - пази НАЙ-ДОБРАТА версия (v1 записваше последната, дори да е по-слаба)
  - math_errors от verifier => score <= 6 (задейства retry)
  - картите под прага се пишат като .revise.md и се опитват пак (v1 ги пропускаше)
  - дедупликация на почти еднакви условия в точка (напр. 1.1 #1/#2)
  - --regen: backup в backups/<ts>/insights + чисто пре-генериране; --dry-run
  - adjudication: оспорените констатации на verifier-а се проверяват втори път (отсява фалшиви тревоги)
  - --accept KEY...: ръчно одобряване на .revise.md карта
  - v3: карти за ученик — „С прости думи", малък пример, стълба от подсказки и препратки към уроци
        ([[ID]] от каталога -> „Урок X.Y — заглавие"); --enrich допълва вече готови карти евтино

CLI:
  python insight_cards.py --stats
  python insight_cards.py --dry-run [--point 1.4]
  python insight_cards.py --point 1.4 --idx 0
  python insight_cards.py --limit 20 --min-difficulty medium
  python insight_cards.py --regen --point 11.6      # backup + пре-генериране на една точка
  python insight_cards.py --regen                   # backup + пре-генериране на ВСИЧКО
  python insight_cards.py --reset-point 1.4
"""
import sys, re, json, time, shutil, logging, argparse, difflib
from pathlib import Path
from datetime import datetime, date

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from config import (
    PIPELINE_DIR,
    ANCHORS_DIR,
    CHUNKER_STATE_FILE,
    LOGS_DIR,
)
from pdf_chunker import (
    AIClient,
    BudgetExhausted,
    parse_json,
    CONFIG,
)
from prompts import format_prompt
from insight_prompts import (
    INSIGHT_PROMPT,
    INSIGHT_USER_TEMPLATE,
    INSIGHT_IMPROVE_TEMPLATE,
    INSIGHT_VERIFICATION_PROMPT,
    INSIGHT_VERIFICATION_USER_TEMPLATE,
    INSIGHT_ADJUDICATION_PROMPT,
    INSIGHT_ADJUDICATION_USER_TEMPLATE,
    INSIGHT_ENRICH_PROMPT,
    INSIGHT_ENRICH_USER_TEMPLATE,
)

log = logging.getLogger("insights")

# ── Paths ──
INSIGHTS_DIR = ANCHORS_DIR.parent / "insights"
INSIGHTS_DIR.mkdir(parents=True, exist_ok=True)
INSIGHT_STATE_FILE = CHUNKER_STATE_FILE.parent / "insight_state.json"
BACKUP_ROOT = PIPELINE_DIR.parent / "backups"

_ART_CANDIDATES = [
    ANCHORS_DIR.parent / "articles",
    ANCHORS_DIR.parent / "output",
    PIPELINE_DIR.parent / "output",
    PIPELINE_DIR.parent / "articles",
]
ARTICLES_DIR = next((p for p in _ART_CANDIDATES if p.exists()), _ART_CANDIDATES[0])


# ═══════════════════════════════════════════════════════════════
# TEXT HELPERS (pure — тестваеми без API)
# ═══════════════════════════════════════════════════════════════
def _sanitize(s):
    if not s or not isinstance(s, str):
        return s
    return ''.join(c if not (0xD800 <= ord(c) <= 0xDFFF) else '\uFFFD' for c in s)


_THINK_RE = re.compile(r"<think>.*?</think>", re.S | re.I)
_CARD_RE = re.compile(r"<<<CARD[ \t]*\r?\n(.*?)\r?\n[ \t]*CARD>>>", re.S)
_META_RE = re.compile(r"<<<META[ \t]*\r?\n(.*?)\r?\n[ \t]*META>>>", re.S)
_MARKER_TOKENS = ("<<<CARD", "CARD>>>", "<<<META", "META>>>")


def extract_card(raw: str):
    """raw -> (card_markdown, meta_dict). Вдига ValueError при празен/неразпознат изход."""
    if not raw or not raw.strip():
        raise ValueError("empty output")
    text = _THINK_RE.sub("", raw)

    m = _CARD_RE.search(text)
    if m:
        meta = {}
        mm = _META_RE.search(text)
        if mm:
            try:
                meta = json.loads(mm.group(1))
            except Exception:
                meta = {}
        return _sanitize(m.group(1).strip()), meta

    # legacy: JSON с card_markdown
    try:
        data = parse_json(text)
    except Exception:
        data = None
    if isinstance(data, dict) and data.get("card_markdown"):
        meta = {k: data[k] for k in
                ("plan_b_type", "how_to_think_specificity", "caught_errors_in_solution")
                if k in data}
        return _sanitize(str(data["card_markdown"]).strip()), meta

    # последен шанс: суров markdown (напр. липсва затварящ маркер => вероятно отрязан;
    # check_structure ще го хване)
    i = text.find("## 1.")
    if i != -1:
        card = text[i:]
        for tok in _MARKER_TOKENS:
            card = card.replace(tok, "")
        return _sanitize(card.strip()), {}

    raise ValueError(f"unrecognized output (len={len(raw)})")


_SEC_RE = re.compile(r"^##\s*(\d{1,2})\.", re.M)


def get_section(card: str, n: int) -> str:
    ms = list(_SEC_RE.finditer(card))
    for i, m in enumerate(ms):
        if int(m.group(1)) == n:
            end = ms[i + 1].start() if i + 1 < len(ms) else len(card)
            return card[m.end():end]
    return ""


def check_structure(card: str, require_refs: bool = False) -> dict:
    """Евтини локални проверки. fatal => не пращай на verifier."""
    nums = [int(n) for n in _SEC_RE.findall(card)]
    missing = [n for n in range(1, 13) if n not in nums]
    sec3 = get_section(card, 3)
    sec6 = get_section(card, 6)
    sec12 = get_section(card, 12)

    has_boxed = ("\\boxed" in sec3) or any(
        l.lstrip().startswith(">") for l in sec3.splitlines())
    why_count = len(re.findall(r"Защо", sec6))
    sec12_words = len(sec12.split())
    ends_ok = bool(re.search(r"[\.\?\!\)\]\$»\"\*\d`]\s*$", card.rstrip()))

    fatal = []
    if missing:
        fatal.append(f"липсват секции: {missing}")
    if not missing and sec12_words < 40:
        fatal.append(f"секция 12 е твърде къса ({sec12_words} думи) — вероятно отрязана")
    if not missing and not ends_ok:
        fatal.append("картата не завършва с пълно изречение — вероятно отрязана")

    sec1 = get_section(card, 1)
    sec2 = get_section(card, 2)
    sec4 = get_section(card, 4)
    refs = _unique(re.findall(r"Урок\s+((?:R\.\d+)|(?:\d+\.\d+))", sec2))
    refs_ok = (len(refs) >= 1) if require_refs else True
    has_plain = "С прости думи" in sec1
    has_example = "Малък пример" in sec3
    has_hints = ("Подсказка 1" in sec4) and ("Подсказка 3" in sec4)

    soft = []
    if require_refs and not refs_ok:
        soft.append("секция 2 няма „Нужни уроци“: поне 1 препратка [[ID]] от каталога")
    if not has_plain:
        soft.append("секция 1 няма „С прости думи“")
    if not has_example:
        soft.append("секция 3 няма „Малък пример“")
    if not has_hints:
        soft.append("секция 4 няма „Стълба от подсказки“ (Подсказка 1–3)")
    if not has_boxed:
        soft.append("секция 3 няма \\boxed{...} верига или blockquote")
    if why_count < 4:
        soft.append(f"секция 6 има само {why_count} „Защо“ (нужни ≥6)")

    return {
        "missing": missing,
        "has_boxed": has_boxed,
        "why_count": why_count,
        "sec12_words": sec12_words,
        "ends_ok": ends_ok,
        "lesson_refs": refs,
        "refs_ok": refs_ok,
        "has_plain": has_plain,
        "has_example": has_example,
        "has_hints": has_hints,
        "fatal": fatal,
        "soft": soft,
    }


def _norm_stmt(s: str) -> str:
    s = re.sub(r"\\[a-zA-Z]+|[\\${}()\[\]_^]", " ", s.lower())
    s = re.sub(r"[^\w\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()[:400]


def is_dup_statement(stmt: str, seen: list, threshold: float = 0.93) -> bool:
    n = _norm_stmt(stmt)
    if not n:
        return False
    for other in seen:
        if difflib.SequenceMatcher(None, n, other).ratio() >= threshold:
            return True
    return False


# ═══════════════════════════════════════════════════════════════
# УРОЦИ: каталог, предпоставки, препратки [[ID]] -> „Урок X.Y — заглавие"
# ═══════════════════════════════════════════════════════════════
_ID_PAT = r"(?:R\.\d+|\d+\.\d+)"
_TOKEN_RE = re.compile(r"\[\[\s*(" + _ID_PAT + r")\s*\]\]", re.I)
_RESOLVED_RE = re.compile(r"\*\*Урок\s+(" + _ID_PAT + r")(?:\s+—\s+[^*\n]+)?\*\*")
_CATALOG = None
_PREREQS = None


def _unique(seq):
    seen, out = set(), []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def _id_sort_key(pid: str):
    if pid.upper().startswith("R."):
        return (0, int(pid.split(".")[1]), 0)
    a, b = pid.split(".")
    return (1, int(a), int(b))


def _parse_catalog_jsonl(path: Path) -> dict:
    cat = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            d = json.loads(line)
        except Exception:
            continue
        pid, title = str(d.get("id", "")).strip(), str(d.get("title", "")).strip()
        if re.fullmatch(_ID_PAT, pid) and title:
            cat[pid] = title
    return cat


def _parse_catalog_js(text: str) -> dict:
    cat = {}
    pat = re.compile(r"[\"\']?id[\"\']?\s*:\s*[\"\'](" + _ID_PAT + r")[\"\']\s*,\s*[\"\']?title[\"\']?\s*:\s*"
                     r"[\"\']((?:[^\"\'\\\n]|\\.)*)[\"\']")
    for m in pat.finditer(text):
        cat.setdefault(m.group(1), m.group(2).strip())
    return cat


def load_lesson_catalog() -> dict:
    """{id: заглавие}. Ред: insights.lesson_catalog_file -> queue.jsonl -> data/steps.js (регекс)."""
    cfg_path = CONFIG.get("insights", {}).get("lesson_catalog_file")
    cands = [Path(cfg_path)] if cfg_path else []
    cands += [PIPELINE_DIR / "queue.jsonl", PIPELINE_DIR.parent / "queue.jsonl",
              ANCHORS_DIR.parent / "queue.jsonl"]
    for p in cands:
        try:
            if p.exists():
                cat = _parse_catalog_jsonl(p)
                if cat:
                    log.info(f"lesson catalog: {len(cat)} урока от {p}")
                    return cat
        except Exception as e:
            log.warning(f"catalog {p}: {e}")
    for p in (PIPELINE_DIR.parent / "data" / "steps.js", PIPELINE_DIR.parent / "index.html"):
        try:
            if p.exists():
                cat = _parse_catalog_js(p.read_text(encoding="utf-8", errors="replace"))
                if cat:
                    log.info(f"lesson catalog: {len(cat)} урока от {p}")
                    return cat
        except Exception as e:
            log.warning(f"catalog {p}: {e}")
    log.warning("lesson catalog: НЕ е намерен (queue.jsonl / steps.js) — картите ще са без препратки")
    return {}


def get_catalog() -> dict:
    global _CATALOG
    if _CATALOG is None:
        _CATALOG = load_lesson_catalog()
    return _CATALOG


def format_catalog(catalog: dict, current_pid: str = "") -> str:
    if not catalog:
        return "(каталогът с уроци не е зареден — НЕ слагай препратки [[ID]])"
    lines = []
    for pid in sorted(catalog, key=_id_sort_key):
        mark = "   ← темата на тази задача" if pid == current_pid else ""
        lines.append(f"{pid} — {catalog[pid]}{mark}")
    return "\n".join(lines)


def _parse_prereqs_js(text: str) -> dict:
    i = text.find("PREREQS")
    if i == -1:
        return {}
    j = text.find("{", i)
    if j == -1:
        return {}
    depth, k = 0, j
    while k < len(text):
        c = text[k]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                break
        k += 1
    body = text[j:k + 1]
    out = {}
    for m in re.finditer(r"[\"\']?(" + _ID_PAT + r")[\"\']?\s*:\s*\[([^\]]*)\]", body):
        out[m.group(1)] = re.findall(r"[\"\'](" + _ID_PAT + r")[\"\']", m.group(2))
    return out


def load_prereqs() -> dict:
    global _PREREQS
    if _PREREQS is not None:
        return _PREREQS
    _PREREQS = {}
    root = PIPELINE_DIR.parent
    cands = [root / "index.html", root / "data" / "steps.js"]
    cands += sorted((root / "data").glob("*.js")) if (root / "data").exists() else []
    for p in cands:
        try:
            if p.exists():
                got = _parse_prereqs_js(p.read_text(encoding="utf-8", errors="replace"))
                if got:
                    _PREREQS = got
                    break
        except Exception:
            pass
    return _PREREQS


def prereq_hint(pid: str, catalog: dict) -> str:
    ids = [x for x in load_prereqs().get(pid, []) if x in catalog]
    if not ids:
        return "(няма данни)"
    return ", ".join(f"{x} ({catalog[x]})" for x in ids) + " — включи само ако наистина са нужни за решението"


def resolve_lesson_refs(card: str, catalog: dict, link_fmt=None):
    """[[ID]] -> **Урок ID — заглавие** (първо срещане) / **Урок ID**. Връща (текст, валидни ID, невалидни ID)."""
    seen, invalid = [], []

    def _sub(m):
        pid = m.group(1)
        pid = "R." + pid.split(".")[1] if pid.upper().startswith("R.") else pid
        if catalog and pid not in catalog:
            invalid.append(pid)
            return "съответния урок"
        first = pid not in seen
        if first:
            seen.append(pid)
        title = catalog.get(pid, "") if catalog else ""
        label = f"Урок {pid} — {title}" if (first and title) else f"Урок {pid}"
        if link_fmt:
            return f"[{label}]({link_fmt.format(id=pid)})"
        return f"**{label}**"

    return _TOKEN_RE.sub(_sub, card), seen, _unique(invalid)


_RESOLVED_LINK_RE = re.compile(r"\[Урок\s+(" + _ID_PAT + r")(?:\s+—\s+[^\]\n]+)?\]\([^)\n]*\)")


def unresolve_lesson_refs(card: str) -> str:
    """**Урок 3.2 — ...** (или markdown линк) -> [[3.2]] (за чист prompt при improve/enrich)."""
    card = _RESOLVED_LINK_RE.sub(lambda m: f"[[{m.group(1)}]]", card)
    return _RESOLVED_RE.sub(lambda m: f"[[{m.group(1)}]]", card)


def extract_lesson_refs(card: str) -> list:
    return _unique(re.findall(r"Урок\s+(" + _ID_PAT + r")", card))


# ═══════════════════════════════════════════════════════════════
# STATE — mirrors ChunkerState
# ═══════════════════════════════════════════════════════════════
class InsightState:
    def __init__(self):
        if INSIGHT_STATE_FILE.exists():
            try:
                self.data = json.loads(INSIGHT_STATE_FILE.read_text(encoding="utf-8"))
            except Exception:
                self.data = self._default()
        else:
            self.data = self._default()
            INSIGHT_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)

    def _default(self):
        return {
            "processed": {},
            "budget": {"date": str(date.today()), "spent_usd": 0.0, "calls": 0},
            "total_calls": 0,
            "total_cost_usd": 0.0,
            "started_at": datetime.now().isoformat(),
        }

    def save(self):
        text = json.dumps(self.data, ensure_ascii=False, indent=2)
        tmp = INSIGHT_STATE_FILE.with_suffix(".tmp")
        try:
            tmp.write_text(text, encoding="utf-8")
        except PermissionError:
            INSIGHT_STATE_FILE.write_text(text, encoding="utf-8")
            return
        for attempt in range(6):
            try:
                tmp.replace(INSIGHT_STATE_FILE)
                return
            except PermissionError:
                if attempt < 5:
                    time.sleep(0.3 * (attempt + 1))
                else:
                    INSIGHT_STATE_FILE.write_text(text, encoding="utf-8")
                    try:
                        tmp.unlink()
                    except Exception:
                        pass
                    return

    def check_budget_reset(self):
        today = str(date.today())
        if self.data["budget"]["date"] != today:
            self.data["budget"] = {"date": today, "spent_usd": 0.0, "calls": 0}
            self.save()

    def add_cost(self, usd: float):
        self.check_budget_reset()
        self.data["budget"]["spent_usd"] += usd
        self.data["budget"]["calls"] += 1
        self.data["total_calls"] += 1
        self.data["total_cost_usd"] += usd
        self.save()

    def budget_exceeded(self) -> bool:
        self.check_budget_reset()
        cfg = CONFIG.get("insights", {})
        budget = cfg.get("daily_budget_usd", 2.0)
        stop = cfg.get("budget_stop_pct", 0.85)
        return self.data["budget"]["spent_usd"] >= budget * stop

    def budget_spent(self) -> float:
        self.check_budget_reset()
        return self.data["budget"]["spent_usd"]

    def is_done(self, key: str) -> bool:
        return self.data["processed"].get(key, {}).get("status") == "done"

    def record(self, key: str, status: str, **fields):
        entry = self.data["processed"].setdefault(key, {})
        entry["status"] = status
        entry["ts"] = int(time.time())
        entry.update(fields)
        self.save()


# ═══════════════════════════════════════════════════════════════
# PATHS
# ═══════════════════════════════════════════════════════════════
def _stem(key: str) -> str:
    pid, idx = key.split("#")
    return f"{pid.replace('.', '_')}_{idx}"


def card_path(key: str) -> Path:
    return INSIGHTS_DIR / f"{_stem(key)}.md"


def revise_path(key: str) -> Path:
    return INSIGHTS_DIR / f"{_stem(key)}.revise.md"


def meta_path(key: str) -> Path:
    return INSIGHTS_DIR / f"{_stem(key)}.meta.json"


def verify_path(key: str, n: int) -> Path:
    return INSIGHTS_DIR / f"{_stem(key)}.verify-v{n}.json"


def _load_article_context(pid: str) -> str:
    for sub in ("text.md", "deep.md"):
        p = ARTICLES_DIR / pid.replace(".", "_") / sub
        if p.exists():
            try:
                return p.read_text(encoding="utf-8")[:3000]
            except Exception:
                pass
    return ""


# ═══════════════════════════════════════════════════════════════
# BACKUP / REGEN
# ═══════════════════════════════════════════════════════════════
def backup_insights():
    files = [f for f in INSIGHTS_DIR.glob("*") if f.is_file()]
    if not files and not INSIGHT_STATE_FILE.exists():
        return None
    dst = BACKUP_ROOT / datetime.now().strftime("%Y-%m-%d_%H%M%S") / "insights"
    dst.mkdir(parents=True, exist_ok=True)
    for f in files:
        shutil.copy2(f, dst / f.name)
    if INSIGHT_STATE_FILE.exists():
        shutil.copy2(INSIGHT_STATE_FILE, dst.parent / INSIGHT_STATE_FILE.name)
    return dst


def clear_for_regen(state: InsightState, only_point=None):
    prefix = None if not only_point else only_point.replace(".", "_") + "_"
    removed = 0
    for f in INSIGHTS_DIR.glob("*"):
        if f.is_file() and (prefix is None or f.name.startswith(prefix)):
            try:
                f.unlink()
                removed += 1
            except Exception as e:
                log.warning(f"cannot delete {f.name}: {e}")
    for k in list(state.data.get("processed", {})):
        if only_point is None or k.startswith(only_point + "#"):
            del state.data["processed"][k]
    state.save()
    return removed


# ═══════════════════════════════════════════════════════════════
# TASK COLLECTION
# ═══════════════════════════════════════════════════════════════
def collect_tasks(state: InsightState, only_point=None, only_idx=None,
                  min_difficulty=None, limit=None, regen=False) -> list:
    diff_rank = {"easy": 0, "medium": 1, "hard": 2}
    cfg = CONFIG.get("insights", {})
    skip_diff = set(cfg.get("skip_difficulty", []))
    max_per_point = cfg.get("max_problems_per_point") or 999

    tasks = []
    for anchor_file in sorted(ANCHORS_DIR.glob("*.json")):
        if anchor_file.name.startswith("_"):
            continue
        try:
            anchor = json.loads(anchor_file.read_text(encoding="utf-8"))
        except Exception as e:
            log.warning(f"bad anchor {anchor_file.name}: {e}")
            continue

        pid = anchor.get("point_id")
        if not pid:
            continue
        if only_point and pid != only_point:
            continue

        problems = sorted(
            anchor.get("problems", []),
            key=lambda p: -diff_rank.get(p.get("difficulty", "medium"), 1),
        )
        # дедупликация на почти еднакви условия (стабилна: пази първото)
        seen, uniq = [], []
        for p in problems:
            stmt = (p.get("statement") or "").strip()
            if stmt and is_dup_statement(stmt, seen):
                log.debug(f"[{pid}] duplicate statement skipped: {stmt[:60]!r}")
                continue
            if stmt:
                seen.append(_norm_stmt(stmt))
            uniq.append(p)
        problems = uniq[:max_per_point]

        for idx, prob in enumerate(problems):
            if only_idx is not None and idx != only_idx:
                continue
            stmt = (prob.get("statement") or "").strip()
            sol = (prob.get("solution") or "").strip()
            if not stmt or not sol:
                continue
            if prob.get("difficulty") in skip_diff:
                continue
            if min_difficulty and diff_rank.get(prob.get("difficulty"), 0) < diff_rank[min_difficulty]:
                continue

            key = f"{pid}#{idx}"
            if not regen and (state.is_done(key) or card_path(key).exists()):
                continue
            tasks.append({
                "key": key,
                "point_id": pid,
                "idx": idx,
                "statement": stmt,
                "solution": sol,
                "difficulty": prob.get("difficulty") or "unknown",
                "source": prob.get("source") or "unknown",
                "techniques": prob.get("techniques", []),
                "article_text": _load_article_context(pid),
            })
            if limit and len(tasks) >= limit:
                return tasks
    return tasks


# ═══════════════════════════════════════════════════════════════
# CLIENT FACTORY
# ═══════════════════════════════════════════════════════════════
def _make_client(section: str, name: str) -> AIClient:
    insights_cfg = CONFIG.get("insights", {}).get(section, {})
    base_key = "generator" if section in ("generator", "enricher") else "verifier"
    base = dict(CONFIG.get(base_key, {}))
    for k, v in insights_cfg.items():
        if v is not None:
            base[k] = v
    return AIClient(base, name)


# ═══════════════════════════════════════════════════════════════
# GENERATE / VERIFY / IMPROVE
# ═══════════════════════════════════════════════════════════════
def _link_fmt():
    return CONFIG.get("insights", {}).get("lesson_link_format") or None


def generate_card(client: AIClient, task: dict):
    cat = get_catalog()
    user = format_prompt(
        INSIGHT_USER_TEMPLATE,
        point_id=task["point_id"],
        point_title=cat.get(task["point_id"], "(няма данни)"),
        lesson_catalog=format_catalog(cat, task["point_id"]),
        prereq_hint=prereq_hint(task["point_id"], cat),
        idx=task["idx"],
        difficulty=task["difficulty"],
        source=task["source"],
        techniques=", ".join(task["techniques"]) or "(няма)",
        statement=task["statement"],
        solution=task["solution"],
        article_context=task["article_text"] or "(няма)",
    )
    raw = client.call(INSIGHT_PROMPT, user, task["key"], force_json=False)
    md, meta = extract_card(raw)
    md, refs, invalid = resolve_lesson_refs(md, cat, _link_fmt())
    if invalid:
        log.warning(f"[{task['key']}] невалидни препратки към уроци (махнати): {invalid}")
    return md, meta


def verify_card(client: AIClient, task: dict, card_md: str) -> dict:
    user = format_prompt(
        INSIGHT_VERIFICATION_USER_TEMPLATE,
        point_id=task["point_id"],
        statement=task["statement"],
        solution=task["solution"],
        card_markdown=card_md,
    )
    raw = client.call(
        INSIGHT_VERIFICATION_PROMPT, user,
        f"verify:{task['key']}", force_json=True,
    )
    data = parse_json(_THINK_RE.sub("", raw)) if raw else None
    if not data:
        return {"score": 0, "verdict": "reject",
                "issues": [{"severity": "critical", "description": "verifier empty"}],
                "math_errors": []}
    return data


def improve_card(client: AIClient, task: dict, prev_md: str,
                 issues: list, math_errors: list, word_count: int):
    cfg = CONFIG.get("insights", {})
    min_wc = cfg.get("min_word_count", 1500)
    user = format_prompt(
        INSIGHT_IMPROVE_TEMPLATE,
        point_id=task["point_id"],
        statement=task["statement"],
        solution=task["solution"],
        lesson_catalog=format_catalog(get_catalog(), task["point_id"]),
        prev_card=unresolve_lesson_refs(prev_md),
        issues=json.dumps(issues, ensure_ascii=False),
        math_errors=json.dumps(math_errors, ensure_ascii=False),
        word_deficit=max(0, min_wc - word_count),
    )
    raw = client.call(INSIGHT_PROMPT, user, f"improve:{task['key']}", force_json=False)
    md, meta = extract_card(raw)
    md, refs, invalid = resolve_lesson_refs(md, get_catalog(), _link_fmt())
    if invalid:
        log.warning(f"[{task['key']}] невалидни препратки към уроци (махнати): {invalid}")
    return md, meta


# ═══════════════════════════════════════════════════════════════
# ADJUDICATION (втора проверка на оспорените констатации)
# ═══════════════════════════════════════════════════════════════
_FAIL_RE = re.compile(r"грешк|✗|не работи|невярн|неверн|противоречи|не съвпада", re.I)
_OK_RE = re.compile(r"няма грешк|без грешк|не е грешк|не е математическа грешк|не намерих грешк|не е грешна", re.I)


def collect_findings(verifier: dict) -> list:
    """math_errors + issues с severity critical/major -> номерирани констатации."""
    findings = []
    for e in verifier.get("math_errors") or []:
        if isinstance(e, dict):
            claim = f"{e.get('formula', '')} — {e.get('problem', '')}"
        else:
            claim = str(e)
        findings.append({"kind": "math", "section": "-", "claim": claim[:700]})
    for i in verifier.get("issues") or []:
        if not isinstance(i, dict):
            continue
        if str(i.get("severity", "")).lower() in ("critical", "major"):
            findings.append({"kind": "issue", "section": str(i.get("section", "")),
                             "claim": str(i.get("description", ""))[:700],
                             "severity": str(i.get("severity", "")).lower()})
    # предпазна мрежа: verifier понякога открива грешка в "recomputed", но не я вписва в math_errors
    for r in verifier.get("recomputed") or []:
        r = str(r)
        if "✗" in r or (_FAIL_RE.search(r) and not _OK_RE.search(r)
                         and not r.rstrip().endswith("✓")):
            findings.append({"kind": "math", "section": "recomputed", "claim": r[:700]})
    for n, f in enumerate(findings, 1):
        f["id"] = n
    return findings


def adjudicate_findings(client: AIClient, task: dict, card_md: str, findings: list):
    user = format_prompt(
        INSIGHT_ADJUDICATION_USER_TEMPLATE,
        point_id=task["point_id"],
        statement=task["statement"],
        solution=task["solution"],
        card_markdown=card_md,
        findings=json.dumps(findings, ensure_ascii=False, indent=1),
    )
    raw = client.call(INSIGHT_ADJUDICATION_PROMPT, user,
                      f"adjudicate:{task['key']}", force_json=True)
    data = parse_json(_THINK_RE.sub("", raw)) if raw else None
    if not isinstance(data, dict) or not isinstance(data.get("verdicts"), list):
        return None
    return data


def apply_adjudication(verifier: dict, findings: list, adj: dict) -> dict:
    """Записва verifier['_adjudication']. Липсваща присъда = confirmed (консервативно)."""
    by_id = {}
    for v in adj.get("verdicts", []):
        if isinstance(v, dict):
            by_id[v.get("id")] = v
    confirmed_math, confirmed_issues, refuted = [], [], []
    for f in findings:
        v = by_id.get(f["id"])
        is_confirmed = v is None or str(v.get("verdict", "")).lower().startswith("confirm")
        if not is_confirmed:
            refuted.append({"id": f["id"], "claim": f["claim"][:200],
                            "reason": str(v.get("reason", ""))[:300]})
            continue
        sev = str((v or {}).get("severity") or f.get("severity") or "major").lower()
        if f["kind"] == "math":
            confirmed_math.append({"formula": f["claim"], "problem": str((v or {}).get("reason", ""))})
        else:
            confirmed_issues.append({"severity": sev, "section": f.get("section", "-"),
                                     "description": f["claim"]})
    for e in adj.get("additional_errors") or []:
        if isinstance(e, dict) and (e.get("formula") or e.get("problem")):
            confirmed_math.append(e)
    verifier["_adjudication"] = {
        "confirmed_math": confirmed_math,
        "confirmed_issues": confirmed_issues,
        "refuted": refuted,
    }
    return verifier


# ═══════════════════════════════════════════════════════════════
# PER-CARD PIPELINE
# ═══════════════════════════════════════════════════════════════
def _effective_score(verifier: dict, struct: dict) -> int:
    try:
        score = int(float(verifier.get("score", 0) or 0))
    except Exception:
        score = 0
    adj = verifier.get("_adjudication")
    if adj is not None:
        blocking = any(str(i.get("severity", "")).lower() in ("critical", "major")
                       for i in adj.get("confirmed_issues", []))
        if adj.get("confirmed_math") or blocking:
            score = min(score, 6)
        else:
            score = max(score, 8)      # всичко оспорено е отхвърлено като фалшива тревога
    elif verifier.get("math_errors"):
        score = min(score, 6)          # adjudication недостъпен -> стара консервативна логика
    if struct["why_count"] < 4:
        score = min(score, 6)
    if struct.get("refs_ok") is False:
        score = min(score, 6)          # няма препратки към уроци, а каталогът е наличен
    return score


def process_one(gen_client: AIClient, ver_client: AIClient, adj_client: AIClient,
                task: dict, state: InsightState) -> dict:
    key = task["key"]
    t0 = time.time()
    cfg = CONFIG.get("insights", {})
    min_score = cfg.get("min_verification_score", 7)
    min_wc = cfg.get("min_word_count", 1500)
    max_retries = cfg.get("max_verification_retries", 2)
    improve_pct = cfg.get("improve_threshold_pct", 0.3)
    improve_threshold = int(min_wc * improve_pct)

    try:
        md, meta = generate_card(gen_client, task)
    except BudgetExhausted:
        raise
    except Exception as e:
        state.record(key, "error", error=str(e)[:300])
        return {"key": key, "status": "error", "error": str(e)[:300]}

    caught = meta.get("caught_errors_in_solution", []) if isinstance(meta, dict) else []
    best = {"score": -1, "md": md, "verifier": {}, "struct": None, "wc": len(md.split())}

    for attempt in range(max_retries + 1):
        wc = len(md.split())
        struct = check_structure(md, require_refs=bool(get_catalog()))
        local_issues = [{"severity": "critical", "section": "-", "description": f}
                        for f in struct["fatal"]]
        local_issues += [{"severity": "major", "section": "-", "description": s}
                         for s in struct["soft"]]
        if wc < min_wc:
            local_issues.append({"severity": "major", "section": "-",
                                 "description": f"само {wc} думи (минимум {min_wc})"})

        verifier = {}
        if struct["fatal"]:
            log.info(f"[{key}] attempt {attempt+1}: fatal structure -> {struct['fatal']}")
            eff = 0
        else:
            try:
                verifier = verify_card(ver_client, task, md)
            except BudgetExhausted:
                raise
            except Exception as e:
                log.warning(f"[{key}] verifier fail: {e}")
                verifier = {"score": 0, "verdict": "reject",
                            "issues": [{"description": str(e)}], "math_errors": []}
            findings = collect_findings(verifier)
            if findings:
                try:
                    adj = adjudicate_findings(adj_client, task, md, findings)
                    if adj:
                        apply_adjudication(verifier, findings, adj)
                        a = verifier["_adjudication"]
                        log.info(f"[{key}] adjudication: confirmed math={len(a['confirmed_math'])} "
                                 f"issues={len(a['confirmed_issues'])} refuted={len(a['refuted'])}")
                except BudgetExhausted:
                    raise
                except Exception as e:
                    log.warning(f"[{key}] adjudication failed: {e}")
            eff = _effective_score(verifier, struct)

        # best-tracking: пази md заедно със score-а му
        if eff > best["score"]:
            best = {"score": eff, "md": md, "verifier": verifier,
                    "struct": struct, "wc": wc}

        try:
            verify_path(key, attempt + 1).write_text(
                json.dumps({**verifier, "_attempt": attempt + 1,
                            "_effective_score": eff, "_structure": struct,
                            "_model": CONFIG.get("insights", {}).get("verifier", {}).get("model")},
                           ensure_ascii=False, indent=2),
                encoding="utf-8")
        except Exception as e:
            log.warning(f"[{key}] verify file write failed: {e}")

        if eff >= min_score and wc >= min_wc and not struct["fatal"]:
            break
        if attempt == max_retries:
            break

        a = verifier.get("_adjudication")
        if a is not None:
            issues = list(a["confirmed_issues"]) + local_issues
            math_errors = a["confirmed_math"]
        else:
            issues = list(verifier.get("issues", [])) + local_issues
            math_errors = verifier.get("math_errors", [])
        try:
            if struct["fatal"] and (len(struct["missing"]) >= 3 or wc < improve_threshold):
                md, meta2 = generate_card(gen_client, task)         # от нулата
            else:
                md, meta2 = improve_card(gen_client, task, md, issues, math_errors, wc)
            if isinstance(meta2, dict) and meta2.get("caught_errors_in_solution"):
                caught = meta2["caught_errors_in_solution"]
        except BudgetExhausted:
            raise
        except Exception as e:
            log.warning(f"[{key}] retry {attempt+1} failed: {e}")
            break

    final_md = best["md"]
    final_struct = best["struct"] or check_structure(final_md, require_refs=bool(get_catalog()))
    passed = best["score"] >= min_score and not final_struct["fatal"]
    status = "done" if passed else "revise"

    out_path = card_path(key) if passed else revise_path(key)
    other = revise_path(key) if passed else card_path(key)
    out_path.write_text(final_md, encoding="utf-8")
    if other.exists() and not passed:
        pass  # не пипаме одобрена карта; revise върви отделно
    elif other.exists():
        try:
            other.unlink()
        except Exception:
            pass

    meta_path(key).write_text(json.dumps({
        "key": key,
        "point_id": task["point_id"],
        "idx": task["idx"],
        "difficulty": task["difficulty"],
        "source": task["source"],
        "techniques": task["techniques"],
        "word_count": best["wc"],
        "score": best["score"],
        "verdict": "approve" if passed else best["verifier"].get("verdict"),
        "verdict_raw": best["verifier"].get("verdict"),
        "adjudicated": "_adjudication" in best["verifier"],
        "status": status,
        "structure": final_struct,
        "lesson_refs": extract_lesson_refs(final_md),
        "caught_errors_in_solution": caught,
        "generator_model": CONFIG.get("insights", {}).get("generator", {}).get("model"),
        "verifier_model": CONFIG.get("insights", {}).get("verifier", {}).get("model"),
        "elapsed_sec": round(time.time() - t0, 1),
        "generated_at": datetime.now().isoformat(),
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    state.record(key, status, score=best["score"], word_count=best["wc"])
    return {"key": key, "status": status, "score": best["score"], "word_count": best["wc"]}


# ═══════════════════════════════════════════════════════════════
# ENRICH — допълва вече готови карти (С прости думи, пример, подсказки, нужни уроци)
# Работи САМО от текста на картата (не от anchors) => не зависи от индексите/дедупликацията.
# ═══════════════════════════════════════════════════════════════
_ENRICH_RE = re.compile(r"<<<ENRICH[ \t]*\r?\n(.*?)\r?\n[ \t]*ENRICH>>>", re.S)
_ENRICH_LABEL_RE = re.compile(r"^(PLAIN|LESSON|TERM|EXAMPLE|HINT1|HINT2|HINT3)\s*:\s*(.*)$")


def parse_enrichment(raw: str) -> dict:
    if not raw or not raw.strip():
        raise ValueError("empty enrich output")
    text = _THINK_RE.sub("", raw)
    m = _ENRICH_RE.search(text)
    body = m.group(1) if m else text
    items, last = [], None
    for line in body.splitlines():
        lm = _ENRICH_LABEL_RE.match(line.strip())
        if lm:
            last = [lm.group(1), lm.group(2).strip()]
            items.append(last)
        elif last is not None and line.strip():
            last[1] += " " + line.strip()
    if not items:
        raise ValueError("unrecognized enrich output")
    enr = {"plain": "", "lessons": [], "terms": [], "example": "", "h1": "", "h2": "", "h3": ""}
    for label, val in items:
        if label == "PLAIN":
            enr["plain"] = val
        elif label == "LESSON" and "|" in val:
            pid, need = [x.strip() for x in val.split("|", 1)]
            enr["lessons"].append((pid.strip("[] "), need))
        elif label == "TERM" and "|" in val:
            t, d = [x.strip() for x in val.split("|", 1)]
            enr["terms"].append((t, d))
        elif label == "EXAMPLE":
            enr["example"] = val
        elif label in ("HINT1", "HINT2", "HINT3"):
            enr["h" + label[-1]] = val
    return enr


def _insert_at_section_end(card: str, n: int, block: str) -> str:
    ms = list(_SEC_RE.finditer(card))
    for i, m in enumerate(ms):
        if int(m.group(1)) == n:
            if i + 1 < len(ms):
                end = ms[i + 1].start()
                return card[:end].rstrip() + "\n\n" + block.strip() + "\n\n" + card[end:]
            return card.rstrip() + "\n\n" + block.strip() + "\n"
    return card


def apply_enrichment(card: str, enr: dict, catalog: dict) -> str:
    """Вмъква блоковете; идемпотентно (не дублира вече налично). Връща картата с неразрешени [[ID]]."""
    if enr.get("plain") and "С прости думи" not in get_section(card, 1):
        card = _insert_at_section_end(card, 1, f"**С прости думи:** {enr['plain']}")

    lessons = [(pid, need) for pid, need in enr.get("lessons", [])
               if not catalog or pid in catalog][:5]
    if lessons and "Нужни уроци" not in get_section(card, 2):
        lines = ["**Нужни уроци** (прочети ги преди решението):"]
        lines += [f"- [[{pid}]] — {need}" for pid, need in lessons]
        if enr.get("terms"):
            lines += ["", "**Речник:**"] + [f"- {t} — {d}" for t, d in enr["terms"][:5]]
        card = _insert_at_section_end(card, 2, "\n".join(lines))

    if enr.get("example") and "Малък пример" not in get_section(card, 3):
        card = _insert_at_section_end(card, 3, f"**Малък пример:** {enr['example']}")

    if enr.get("h1") and enr.get("h2") and enr.get("h3") and "Подсказка 1" not in get_section(card, 4):
        card = _insert_at_section_end(card, 4, "\n".join([
            "**Стълба от подсказки** (отвори само ако си заседнал):",
            f"- Подсказка 1 — {enr['h1']}",
            f"- Подсказка 2 — {enr['h2']}",
            f"- Подсказка 3 — {enr['h3']}",
        ]))
    return card


def enrich_card_text(client: AIClient, pid: str, card_md: str, key: str):
    """Една заявка: връща (нова карта, enrichment dict). Хвърля ValueError при невалиден изход."""
    cat = get_catalog()
    user = format_prompt(
        INSIGHT_ENRICH_USER_TEMPLATE,
        point_id=pid,
        point_title=cat.get(pid, "(няма данни)"),
        prereq_hint=prereq_hint(pid, cat),
        lesson_catalog=format_catalog(cat, pid),
        card_markdown=unresolve_lesson_refs(card_md),
    )
    raw = client.call(INSIGHT_ENRICH_PROMPT, user, f"enrich:{key}", force_json=False)
    enr = parse_enrichment(raw)
    new_card = apply_enrichment(card_md, enr, cat)
    new_card, refs, invalid = resolve_lesson_refs(new_card, cat, _link_fmt())
    if invalid:
        log.warning(f"[{key}] невалидни препратки (махнати): {invalid}")
    return new_card, enr


def _key_from_card_file(f: Path):
    m = re.match(r"^(.+)_(\d+)$", f.stem)
    if not m or f.name.endswith(".revise.md"):
        return None
    pid = m.group(1).replace("_", ".")
    if not re.fullmatch(_ID_PAT, pid):
        return None
    return f"{pid}#{m.group(2)}", pid


def enrich_cards(only_point=None, limit=None, dry_run=False, force=False):
    cat = get_catalog()
    if not cat:
        log.error("enrich: няма каталог с уроци (queue.jsonl / steps.js) — спирам")
        return
    todo = []
    for f in sorted(INSIGHTS_DIR.glob("*.md")):
        kp = _key_from_card_file(f)
        if not kp:
            continue
        key, pid = kp
        if only_point and pid != only_point:
            continue
        text = f.read_text(encoding="utf-8")
        if not force and "Нужни уроци" in text and "Подсказка 1" in text and "С прости думи" in text:
            continue
        todo.append((key, pid, f))
    if limit:
        todo = todo[:limit]
    log.info(f"enrich: {len(todo)} карти за допълване")
    if dry_run or not todo:
        for key, pid, f in todo:
            log.info(f"  {key}")
        return
    dst = backup_insights()
    log.info(f"backup: {dst}")
    client = _make_client("enricher", "insight-enrich")
    state = InsightState()
    done = 0
    for i, (key, pid, f) in enumerate(todo, 1):
        if state.budget_exceeded():
            log.warning("budget exceeded — stopping")
            break
        log.info(f"[{i}/{len(todo)}] enrich {key}")
        try:
            card = f.read_text(encoding="utf-8")
            new_card, enr = enrich_card_text(client, pid, card, key)
        except BudgetExhausted:
            log.warning("BudgetExhausted (402) — stopping")
            break
        except Exception as e:
            log.warning(f"[{key}] enrich failed: {e}")
            continue
        st = check_structure(new_card, require_refs=True)
        if st["fatal"]:
            log.warning(f"[{key}] след допълване структурата е счупена {st['fatal']} — пропускам")
            continue
        f.write_text(new_card, encoding="utf-8")
        mp = meta_path(key)
        if mp.exists():
            try:
                m = json.loads(mp.read_text(encoding="utf-8"))
                m["lesson_refs"] = extract_lesson_refs(new_card)
                m["enriched"] = True
                m["enriched_at"] = datetime.now().isoformat()
                mp.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")
            except Exception as e:
                log.warning(f"[{key}] meta update failed: {e}")
        log.info(f"  → refs={extract_lesson_refs(new_card)} soft={st['soft']}")
        done += 1
    log.info(f"enrich done: {done}/{len(todo)}")


def accept_card(state: InsightState, key: str) -> bool:
    """Ръчно одобряване: .revise.md -> .md, state=done."""
    rp, cp = revise_path(key), card_path(key)
    if not rp.exists():
        log.warning(f"{key}: няма {rp.name}")
        return False
    cp.write_text(rp.read_text(encoding="utf-8"), encoding="utf-8")
    rp.unlink()
    mp = meta_path(key)
    if mp.exists():
        try:
            m = json.loads(mp.read_text(encoding="utf-8"))
            m["status"] = "done"
            m["accepted_manually"] = True
            mp.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as e:
            log.warning(f"{key}: meta update failed: {e}")
    state.record(key, "done", accepted_manually=True)
    log.info(f"{key}: accepted -> {cp.name}")
    return True


# ═══════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--point", help="само тази точка (напр. 1.4)")
    ap.add_argument("--idx", type=int, help="само този индекс")
    ap.add_argument("--limit", type=int, help="макс карти за сесия")
    ap.add_argument("--min-difficulty", choices=["easy", "medium", "hard"])
    ap.add_argument("--regen", action="store_true",
                    help="backup + изтрива старите карти (на --point или всички) и ги генерира наново")
    ap.add_argument("--dry-run", action="store_true", help="само списък със задачите")
    ap.add_argument("--reset-point", help="изтрий state за тази точка")
    ap.add_argument("--stats", action="store_true")
    ap.add_argument("--enrich", action="store_true",
                    help="допълни ГОТОВИТЕ карти (с прости думи, малък пример, подсказки, нужни уроци); "
                         "комбинирай с --point, --limit, --dry-run, --force")
    ap.add_argument("--force", action="store_true", help="с --enrich: и върху карти, които вече имат допълнения")
    ap.add_argument("--accept", nargs="+", metavar="KEY",
                    help="ръчно одобри .revise.md карти, напр. --accept 10.21#0 11.6#0")
    args = ap.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [INSIGHTS] %(levelname)s %(message)s",
        handlers=[
            logging.FileHandler(LOGS_DIR / f"insights_{date.today()}.log", encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )

    state = InsightState()

    if args.reset_point:
        for k in list(state.data.get("processed", {})):
            if k.startswith(args.reset_point + "#"):
                del state.data["processed"][k]
        state.save()
        log.info(f"reset state for {args.reset_point}")
        return

    if args.accept:
        for k in args.accept:
            accept_card(state, k)
        return

    if args.enrich:
        enrich_cards(args.point, args.limit, args.dry_run, args.force)
        return

    if args.stats:
        procs = state.data.get("processed", {}).values()
        done = sum(1 for v in procs if v.get("status") == "done")
        revise = sum(1 for v in procs if v.get("status") == "revise")
        err = sum(1 for v in procs if v.get("status") == "error")
        log.info(f"done: {done}, revise: {revise}, error: {err}, "
                 f"budget today: ${state.budget_spent():.2f}")
        return

    if not CONFIG.get("insights", {}).get("enabled", True):
        log.info("insights.enabled = false — skipping")
        return

    # tasks се събират ПРЕДИ изтриване (при --regen игнорират done/exists)
    tasks = collect_tasks(state, args.point, args.idx, args.min_difficulty,
                          args.limit, regen=args.regen)
    log.info(f"tasks: {len(tasks)}")
    if args.dry_run:
        for t in tasks:
            log.info(f"  {t['key']:>10}  {t['difficulty']:<7} {t['source'][:50]}")
        log.info("dry-run: нищо не е записано; цената зависи от модела — виж budget в config")
        return
    if not tasks:
        return

    if args.regen:
        dst = backup_insights()
        log.info(f"backup: {dst}" if dst else "backup: нищо за архивиране")
        # при филтър по idx не трием цялата точка
        scope = None if (args.idx is not None) else args.point
        if args.idx is not None:
            for t in tasks:
                for p in (card_path(t["key"]), revise_path(t["key"]), meta_path(t["key"])):
                    p.unlink(missing_ok=True)
                state.data["processed"].pop(t["key"], None)
            state.save()
        else:
            n = clear_for_regen(state, scope)
            log.info(f"regen: изтрити {n} файла")

    gen_client = _make_client("generator", "insight-gen")
    ver_client = _make_client("verifier", "insight-ver")
    adj_client = _make_client("adjudicator", "insight-adj")   # config insights.adjudicator, иначе = verifier

    done = 0
    for i, task in enumerate(tasks, 1):
        if state.budget_exceeded():
            log.warning(f"budget exceeded (${state.budget_spent():.2f}) — stopping")
            break
        state.check_budget_reset()
        log.info(f"[{i}/{len(tasks)}] {task['key']} ({task['difficulty']})")
        try:
            res = process_one(gen_client, ver_client, adj_client, task, state)
            log.info(f"  → {res['status']} score={res.get('score')} wc={res.get('word_count')}")
            done += 1
        except BudgetExhausted:
            log.warning("BudgetExhausted (402) — stopping")
            break

    log.info(f"session done: {done} cards, budget: ${state.budget_spent():.2f}")


if __name__ == "__main__":
    main()