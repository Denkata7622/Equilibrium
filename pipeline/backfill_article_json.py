#!/usr/bin/env python3
"""backfill_article_json.py — създава article.json за точки без такъв.

Не пипа API. Използва Writer._write_article_json върху вече съществуващи
text-v*.md / deep-v*.md / metadata.json.

За разлика от pipeline.py, тук прилагаме clean_markdown() върху text
съдържанието — мимикрия на стария integrate.py, за да не се показват
сурови **markdown** маркери в modal-а.

Използване:
    python backfill_article_json.py --dry-run
    python backfill_article_json.py --only R.1       # тест на една точка
    python backfill_article_json.py                  # всички
"""
import sys
import re
import json
import argparse
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from pipeline import Writer, _atomic_write

BASE = Path(__file__).parent.resolve()
ARTICLES = BASE.parent / "generated" / "articles"


def clean_markdown(text: str) -> str:
    """Мимикрия на integrate.py::clean_markdown — запазва LaTeX, маха markdown."""
    latex_blocks = []
    def _save_latex(m):
        latex_blocks.append(m.group(0))
        return f'\x00LTX{len(latex_blocks)-1}\x00'

    text = re.sub(r'\$\$.+?\$\$', _save_latex, text, flags=re.DOTALL)
    text = re.sub(r'(?<!\$)\$[^\$\n]+?\$(?!\$)', _save_latex, text)

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

    for i, block in enumerate(latex_blocks):
        text = text.replace(f'\x00LTX{i}\x00', block)
    return text.strip()


def _strip_header(raw: str) -> str:
    """Маха '# Title\n\n**ID:** ...\n---\n\n' — оставя само съдържанието."""
    m = re.search(r"\n---\n+(.*)", raw, re.DOTALL)
    return (m.group(1) if m else raw).strip()


def _collect(folder: Path, prefix: str, clean_text: bool) -> list[dict]:
    files = []
    for f in folder.glob(f"{prefix}-v*.md"):
        m = re.search(rf"{prefix}-v(\d+)\.md$", f.name)
        if m:
            files.append((int(m.group(1)), f))
    files.sort(key=lambda x: x[0])
    out = []
    for v, f in files:
        try:
            content = _strip_header(f.read_text(encoding="utf-8"))
            if clean_text:
                content = clean_markdown(content)
            out.append({"v": v, "content": content})
        except Exception as e:
            print(f"  ⚠ {f.name}: {e}")
    return out


def _build_bundle(folder: Path, pid: str) -> dict:
    meta = {}
    meta_path = folder / "metadata.json"
    if meta_path.exists():
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    return {
        "id": pid,
        "title": meta.get("title") or pid,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "generator_model": meta.get("generator_model"),
        "verifier_model": meta.get("verifier_model"),
        "word_count": meta.get("word_count"),
        "versions":      _collect(folder, "text", clean_text=True),
        "deep_versions": _collect(folder, "deep", clean_text=False),  # raw — DeepDive.md2html го рендерира
        "verification": None,
    }


def backfill(dry_run: bool = False, only: str | None = None) -> tuple[int, int, int]:
    if not ARTICLES.exists():
        print(f"✗ {ARTICLES} не съществува")
        return 0, 0, 0

    made = skipped = missing = 0
    for d in sorted(ARTICLES.iterdir()):
        if not d.is_dir():
            continue
        pid = d.name.replace("_", ".", 1)
        if only and pid != only:
            continue

        article_json = d / "article.json"
        if article_json.exists():
            skipped += 1
            if only:
                print(f"  ⏭  {pid}: article.json вече съществува")
            continue

        if not list(d.glob("text-v*.md")):
            missing += 1
            if only:
                print(f"  ∅ {pid}: няма text-v*.md")
            continue

        try:
            bundle = _build_bundle(d, pid)
        except Exception as e:
            print(f"  ✗ {pid}: {e}")
            continue

        n_v = len(bundle["versions"])
        n_d = len(bundle["deep_versions"])

        if dry_run:
            print(f"  [dry] {pid}: {n_v} text, {n_d} deep")
            made += 1
            continue

        try:
            _atomic_write(article_json, json.dumps(bundle, ensure_ascii=False, indent=2))
            made += 1
            print(f"  ✓ {pid}: {n_v} text, {n_d} deep")
        except Exception as e:
            print(f"  ✗ {pid}: {e}")

    return made, skipped, missing


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", default=None, help="Само една точка (напр. R.1)")
    args = ap.parse_args()

    print(f"📂 {ARTICLES}\n")
    made, skipped, missing = backfill(dry_run=args.dry_run, only=args.only)
    print()
    print("═" * 55)
    if args.dry_run:
        print(f"  DRY RUN: {made} нуждаят се, {skipped} имат, {missing} без data")
    else:
        print(f"  Створени: {made} | Вече имаха: {skipped} | Без text.md: {missing}")
    print("═" * 55)


if __name__ == "__main__":
    main()