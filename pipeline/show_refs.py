#!/usr/bin/env python3
"""show_refs.py — какви уроци е избрал AI за всяка карта.
Usage:
    python show_refs.py
    python show_refs.py <папка_insights> <queue.jsonl>
"""
import json, re, sys, io
from pathlib import Path

INS = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"..\generated\insights")
QUEUE = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("queue.jsonl")
OUT = Path("refs.txt")

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace", line_buffering=True)

cat = {}
for line in QUEUE.read_text(encoding="utf-8").splitlines():
    try:
        d = json.loads(line)
        cat[str(d["id"])] = str(d.get("title", ""))
    except Exception:
        pass


def first_line_of_statement(card: str) -> str:
    """Връща първия смислен ред след ## 1. ... (без ограничение на дължината)."""
    m = re.search(r"^##\s*1\..*?$", card, re.M)
    if not m:
        return ""
    for ln in card[m.end():].splitlines():
        ln = ln.strip()
        if ln and not ln.startswith("**С прости думи"):
            return ln          # ← вече без [:140]
    return ""


def sort_key(p: Path):
    m = re.match(r"^(R|\d+)_(\d+)_(\d+)", p.name)
    if not m:
        return (9, 0, 0, p.name)
    a = 0 if m.group(1) == "R" else 1
    return (a, int(m.group(2)) if m.group(1) != "R" else int(m.group(2)),
            int(m.group(3)), p.name)


lines = []
for mp in sorted(INS.glob("*.meta.json"), key=sort_key):
    try:
        meta = json.loads(mp.read_text(encoding="utf-8"))
    except Exception:
        continue
    key = meta.get("key", mp.stem)
    card_file = mp.with_name(mp.name.replace(".meta.json", ".md"))
    stmt = first_line_of_statement(card_file.read_text(encoding="utf-8")) if card_file.exists() else ""
    refs = meta.get("lesson_refs") or []
    flag = "" if refs else "   [БЕЗ ПРЕПРАТКИ]"
    
    lines.append(f"\n== {key}  (тема: {key.split('#')[0]} — {cat.get(key.split('#')[0], '?')}){flag}")
    if stmt:
        lines.append(f"   условие: {stmt}")
    for r in refs:
        lines.append(f"   {r:>5} — {cat.get(r, '??? (няма в каталога)')}")

text = "\n".join(lines) + "\n"
OUT.write_text(text, encoding="utf-8-sig")

print(f"Written {OUT.resolve()}  ({len(lines)} lines)")
print("First few lines:")
print("\n".join(lines[:15]))