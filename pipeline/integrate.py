#!/usr/bin/env python3
"""
integrate.py — Вгражда AI обяснения в index.html.
Всички полета се записват като TEMPLATE LITERAL (backticks) — устойчиво на
нови редове и специални символи.
"""
import re, sys, argparse, shutil
from pathlib import Path
from datetime import datetime

# ── Windows UTF-8 fix (defense in depth) ──
# Дори когато parent-ът (serve.py) е подал PYTHONIOENCODING=utf-8,
# при някои Windows комбинации (pipe + cp1252 codepage) Python 3.12
# продължава да ползва cp1252 за sys.stdout. Emoji в print() гърми.
if sys.platform == "win32":
    try:
        if "pytest" not in sys.modules:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

BASE_DIR = Path(__file__).parent.resolve()
# ВАЖНО: pipeline.py пише статиите в generated/articles/, НЕ в pipeline/output/
OUTPUT_DIR = BASE_DIR.parent / "generated" / "articles"


# ─── Escape ────────────────────────────────────────────────────
def escape_for_backtick(s: str) -> str:
    """Escape за JS template literal — newlines остават RAW."""
    s = s.replace('\r\n', '\n').replace('\r', '\n')
    s = s.replace('\x00', '')
    s = s.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    s = s.replace('\\', '\\\\')
    s = s.replace('`', '\\`')
    s = s.replace('${', '\\${')
    s = s.replace('</script', '<\\/script')
    return s


# ─── Markdown изчистване (за explanation) ─────────────────────
def clean_markdown(text: str) -> str:
    # ── 1. Запази LaTeX формулите ($$ ... $$ и $ ... $) ──
    latex_blocks = []
    def _save_latex(m):
        latex_blocks.append(m.group(0))
        return f'\x00LTX{len(latex_blocks)-1}\x00'
    
    # Първо display ($$...$$), после inline ($...$)
    text = re.sub(r'\$\$.+?\$\$', _save_latex, text, flags=re.DOTALL)
    text = re.sub(r'(?<!\$)\$[^\$\n]+?\$(?!\$)', _save_latex, text)

    # ── 2. Markdown изчистване ──
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    text = re.sub(r'```[a-zA-Z0-9]*\n', '', text)
    text = re.sub(r'```', '', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\*\*(.+?)\*\*',     r'\1', text, flags=re.DOTALL)
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'__(.+?)__',         r'\1', text, flags=re.DOTALL)
    text = re.sub(r'(?<!_)_(?!_)(.+?)(?<!_)_(?!_)', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    text = re.sub(r'^[ \t]*[-*+]\s+', '• ', text, flags=re.MULTILINE)
    text = re.sub(r'^[-*_]{3,}\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # ── 3. Възстанови LaTeX формулите ──
    for i, block in enumerate(latex_blocks):
        text = text.replace(f'\x00LTX{i}\x00', block)

    return text.strip()

def read_text_md(path: Path) -> str:
    text = path.read_text(encoding='utf-8')
    # Strip YAML frontmatter (opening --- ... closing ---), if present
    parts = text.split('---', 2)
    body = parts[2] if len(parts) >= 3 else text
    body = re.sub(r'^#\s+.*?\n', '', body, count=1)
    return clean_markdown(body)


def read_deep_md(path: Path) -> str:
    text = path.read_text(encoding='utf-8')
    # Strip YAML frontmatter (opening --- ... closing ---), if present
    parts = text.split('---', 2)
    body = parts[2] if len(parts) >= 3 else text
    body = re.sub(r'^\s*#\s+.*?\n', '', body, count=1)
    return body.strip()


# ─── HTML scanner ──────────────────────────────────────────────
def find_object_end(text: str, start: int) -> int:
    depth = 0; in_str = False; quote = None; escape = False
    i = start
    while i < len(text):
        c = text[i]
        if escape:
            escape = False; i += 1; continue
        if in_str:
            if c == '\\': escape = True
            elif c == quote: in_str = False
            i += 1; continue
        if c in ('"', "'", '`'):
            in_str = True; quote = c; i += 1; continue
        if c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return i + 1
        i += 1
    return len(text)


def find_point_block(html: str, pid: str):
    pattern = re.compile(r'\{\s*id\s*:\s*"' + re.escape(pid) + r'"\s*,', re.DOTALL)
    m = pattern.search(html)
    if not m:
        return -1, -1
    return m.start(), find_object_end(html, m.start())


def find_field_span(block: str, key: str):
    """Връща (start, end, content) за key: <quote>...<quote> или None."""
    pattern = re.compile(r'\b' + re.escape(key) + r'\s*:\s*')
    m = pattern.search(block)
    if not m:
        return None
    j = m.end()
    while j < len(block) and block[j] in ' \t\n\r':
        j += 1
    if j >= len(block) or block[j] not in ('"', "'", '`'):
        return None
    quote = block[j]
    content_start = j + 1
    k = content_start
    in_escape = False
    while k < len(block):
        c = block[k]
        if in_escape:
            in_escape = False; k += 1; continue
        if c == '\\': in_escape = True; k += 1; continue
        if c == quote: break
        k += 1
    if k >= len(block): return None
    return (m.start(), k + 1, block[content_start:k])


def replace_or_insert_field(block: str, key: str, value: str, anchor: str | None = None) -> tuple[str, str]:
    """Замества key с `value`, или го вмъква след anchor."""
    escaped = escape_for_backtick(value)
    new_field = f'{key}:`{escaped}`'

    span = find_field_span(block, key)
    if span:
        start, end, _ = span
        return block[:start] + new_field + block[end:], 'replaced'

    if anchor:
        anchor_span = find_field_span(block, anchor)
        if anchor_span:
            _, aend, _ = anchor_span
            return block[:aend] + f',\n    {new_field}' + block[aend:], 'inserted'

    # Ако няма anchor — вмъкни преди последната }
    last = block.rstrip()
    if last.endswith('}'):
        return last[:-1].rstrip() + f',\n    {new_field}\n  }}', 'inserted'
    return block, 'error'


# ─── Version collection & array literals ───────────────────────
def collect_versions(item_dir: Path, prefix: str) -> list[dict]:
    """Връща [{v: 1, content: '...'}, ...] от {prefix}-v1.md, {prefix}-v2.md, ...
    За 'text' → clean_markdown (както explanation); за 'deep' → raw markdown
    (DeepDive.md2html го обработва на frontend-а)."""
    pattern = re.compile(rf'^{re.escape(prefix)}-v(\d+)\.md$')
    files = []
    for f in item_dir.glob(f'{prefix}-v*.md'):
        m = pattern.match(f.name)
        if m:
            files.append((int(m.group(1)), f))
    files.sort(key=lambda x: x[0])
    if not files:
        return []
    reader = read_text_md if prefix == 'text' else read_deep_md
    out = []
    for v, f in files:
        try:
            content = reader(f)
            if content:
                out.append({'v': v, 'content': content})
        except Exception as e:
            print(f"  ⚠ {f.name}: {e}")
    return out


def build_versions_js(versions: list[dict]) -> str:
    """[{v, content}, ...] → JS array literal, безопасен за вграждане."""
    if not versions:
        return '[]'
    parts = []
    for item in versions:
        content = escape_for_backtick(item['content'])
        parts.append(f'{{v:{item["v"]},content:`{content}`}}')
    return '[' + ','.join(parts) + ']'


def find_value_span(block: str, key: str):
    """Връща (start, end) за key:<value> — поддържа string, array и object."""
    pattern = re.compile(r'\b' + re.escape(key) + r'\s*:\s*')
    m = pattern.search(block)
    if not m:
        return None
    j = m.end()
    if j >= len(block):
        return None
    opener = block[j]

    # ── String ──
    if opener in ('"', "'", '`'):
        quote = opener
        k = j + 1
        in_escape = False
        while k < len(block):
            c = block[k]
            if in_escape:
                in_escape = False; k += 1; continue
            if c == '\\':
                in_escape = True; k += 1; continue
            if c == quote:
                return (m.start(), k + 1)
            k += 1
        return None

    # ── Array / object — bracket counting (устойчиво на backtick-стрингове вътре) ──
    if opener in ('[', '{'):
        open_ch = opener
        close_ch = ']' if opener == '[' else '}'
        depth = 1
        k = j + 1
        in_str = False; quote = None; escape = False
        while k < len(block):
            c = block[k]
            if escape:
                escape = False; k += 1; continue
            if in_str:
                if c == '\\':
                    escape = True
                elif c == quote:
                    in_str = False
                k += 1; continue
            if c in ('"', "'", '`'):
                in_str = True; quote = c; k += 1; continue
            if c == open_ch:
                depth += 1
            elif c == close_ch:
                depth -= 1
                if depth == 0:
                    return (m.start(), k + 1)
            k += 1
        return None

    return None


def replace_or_insert_array_field(block: str, key: str, value_js: str,
                                  anchor: str | None = None) -> tuple[str, str]:
    """Замества key с готов JS израз (напр. [{v:1,...},...]), или го вмъква след anchor."""
    new_field = f'{key}: {value_js}'
    span = find_value_span(block, key)
    if span:
        start, end = span
        return block[:start] + new_field + block[end:], 'replaced'

    if anchor:
        anchor_span = find_value_span(block, anchor)
        if anchor_span:
            _, aend = anchor_span
            return block[:aend] + f',\n    {new_field}' + block[aend:], 'inserted'

    last = block.rstrip()
    if last.endswith('}'):
        return last[:-1].rstrip() + f',\n    {new_field}\n  }}', 'inserted'
    return block, 'error'


# ─── Main ──────────────────────────────────────────────────────
def integrate(html_path: Path, only=None):
    stats = {'expl_replaced': 0, 'expl_inserted': 0, 'deep_replaced': 0, 'deep_inserted': 0,
             'deep_skipped': 0, 'missing_md': 0, 'not_found': 0, 'errors': 0,
             'expl_ver': 0, 'deep_ver': 0}

    if not html_path.exists():
        print(f"✗ {html_path} не съществува"); return stats
    if not OUTPUT_DIR.exists():
        print(f"✗ {OUTPUT_DIR} не съществува"); return stats

    print(f"📖 HTML:   {html_path}")
    print(f"📂 Output: {OUTPUT_DIR}\n")

    html = html_path.read_text(encoding='utf-8')
    original = html

    for item_dir in sorted(OUTPUT_DIR.iterdir()):
        if not item_dir.is_dir(): continue
        pid = item_dir.name.replace('_', '.')
        if only and pid not in only: continue

        start, end = find_point_block(html, pid)
        if start == -1:
            print(f"✗ [{pid}] не е намерена"); stats['not_found'] += 1; continue
        block = html[start:end]

        # Explanation
        expl_md = item_dir / 'text.md'
        if not expl_md.exists():
            vs = sorted(item_dir.glob('text-v*.md'))
            if vs: expl_md = vs[-1]
        if expl_md.exists():
            try:
                txt = read_text_md(expl_md)
                if txt and len(txt) >= 20:
                    block, action = replace_or_insert_field(block, 'explanation', txt, anchor='desc')
                    if action == 'replaced': stats['expl_replaced'] += 1
                    elif action == 'inserted': stats['expl_inserted'] += 1
                    else: stats['errors'] += 1
            except Exception as e:
                print(f"✗ [{pid}] explanation: {e}"); stats['errors'] += 1

        # Deep explanation
        deep_md = item_dir / 'deep.md'
        if not deep_md.exists():
            vs = sorted(item_dir.glob('deep-v*.md'))
            if vs: deep_md = vs[-1]
        if not deep_md.exists():
            stats['missing_md'] += 1
        else:
            try:
                txt = read_deep_md(deep_md)
                if txt and len(txt) >= 50:
                    block, action = replace_or_insert_field(
                        block, 'deepExplanation', txt, anchor='explanation')
                    if action == 'replaced':
                        stats['deep_replaced'] += 1
                        print(f"↻ [{pid}] deepExplanation заменен ({len(txt)} симв.)")
                    elif action == 'inserted':
                        stats['deep_inserted'] += 1
                        print(f"+ [{pid}] deepExplanation добавен ({len(txt)} симв.)")
                    else: stats['errors'] += 1
            except Exception as e:
                print(f"✗ [{pid}] deep: {e}"); stats['errors'] += 1

        # ── Versions: запиши ВСИЧКИ версии като array ──
        try:
            expl_versions = collect_versions(item_dir, 'text')
            if expl_versions:
                js = build_versions_js(expl_versions)
                block, action = replace_or_insert_array_field(
                    block, 'explanationVersions', js, anchor='explanation')
                if action in ('replaced', 'inserted'):
                    stats['expl_ver'] += 1
                    print(f"  📚 [{pid}] explanationVersions: {len(expl_versions)} версии ({action})")
                else:
                    stats['errors'] += 1
        except Exception as e:
            print(f"✗ [{pid}] explanationVersions: {e}"); stats['errors'] += 1

        try:
            deep_versions = collect_versions(item_dir, 'deep')
            if deep_versions:
                js = build_versions_js(deep_versions)
                block, action = replace_or_insert_array_field(
                    block, 'deepExplanationVersions', js, anchor='deepExplanation')
                if action in ('replaced', 'inserted'):
                    stats['deep_ver'] += 1
                    print(f"  📚 [{pid}] deepExplanationVersions: {len(deep_versions)} версии ({action})")
                else:
                    stats['errors'] += 1
        except Exception as e:
            print(f"✗ [{pid}] deepExplanationVersions: {e}"); stats['errors'] += 1

        html = html[:start] + block + html[end:]

    if html == original:
        print("\n⚠ Няма промени"); return stats

    bak = html_path.with_suffix(f".html.bak-int-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(html_path, bak)
    print(f"\n💾 {bak.name}")

    tmp = html_path.with_suffix(html_path.suffix + '.tmp')
    tmp.write_text(html, encoding='utf-8')
    tmp.replace(html_path)

    print(f"\n✅ Записан: {html_path}")
    print(f"\n📊 Explanation: replaced={stats['expl_replaced']} inserted={stats['expl_inserted']}")
    print(f"   Deep:       replaced={stats['deep_replaced']} inserted={stats['deep_inserted']} missing_md={stats['missing_md']}")
    print(f"   Versions:   explanation={stats['expl_ver']}  deep={stats['deep_ver']}")
    print(f"   Errors: {stats['errors']}  Not found: {stats['not_found']}")
    return stats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", default=None)
    ap.add_argument("--only", default=None)
    args = ap.parse_args()
    if args.html:
        path = Path(args.html).resolve()
    else:
        path = (BASE_DIR.parent / "index.html")
    only = set(x.strip() for x in args.only.split(',')) if args.only else None
    integrate(path, only)


if __name__ == "__main__":
    main()