#!/usr/bin/env python3
"""Diagnostic: колко problems са извлечени от olympiad PDFs."""
import json
import re
import sys
from pathlib import Path
from collections import Counter, defaultdict

BASE = Path(__file__).parent.parent
EXTRACTED = BASE / "generated" / "cache" / "extracted"

if not EXTRACTED.exists():
    print(f"✗ Няма {EXTRACTED}")
    sys.exit(1)

olimp = []
books = []
for f in sorted(EXTRACTED.glob("*/all_problems.json")):
    try:
        d = json.loads(f.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"⚠ Skip {f.name}: {e}")
        continue
    pdf = d.get("pdf", "?")
    n = len(d.get("problems", []))

    if "Областен" in pdf or "Национален" in pdf:
        olimp.append((pdf, n))
    else:
        books.append((pdf, n))

print(f"═══════════════════════════════════════════════════════════════")
print(f"  OLYMPIAD FILES: {len(olimp)}")
print(f"  BOOK FILES:     {len(books)}")
print(f"═══════════════════════════════════════════════════════════════")

# ── Областен ──
o_obl = [(p, n) for p, n in olimp if "Областен" in p]
print(f"\n▶ ОБЛАСТЕН (expected: 4)")
print(f"  Total files: {len(o_obl)}")
dist_obl = Counter(n for _, n in o_obl)
print(f"  Count distribution:")
for cnt in sorted(dist_obl):
    n_files = dist_obl[cnt]
    if cnt == 4:
        marker = "✅"
    elif cnt in (3, 5):
        marker = "⚠ "
    elif cnt > 5:
        marker = "🔴"
    else:
        marker = "🔴"
    print(f"    {cnt:3} problems: {n_files:3} files  {marker}")

# Покажи bad examples
bad_obl = [(p, n) for p, n in o_obl if n > 5]
if bad_obl:
    print(f"\n  Top offenders (>5 problems):")
    for p, n in sorted(bad_obl, key=lambda x: -x[1])[:10]:
        print(f"    {n:3} | {p[:60]}")

# ── Национален ──
o_nac = [(p, n) for p, n in olimp if "Национален" in p]
print(f"\n▶ НАЦИОНАЛЕН (expected: 6)")
print(f"  Total files: {len(o_nac)}")
dist_nac = Counter(n for _, n in o_nac)
print(f"  Count distribution:")
for cnt in sorted(dist_nac):
    n_files = dist_nac[cnt]
    if cnt == 6:
        marker = "✅"
    elif cnt in (5, 7):
        marker = "⚠ "
    elif cnt > 7:
        marker = "🔴"
    else:
        marker = "🔴"
    print(f"    {cnt:3} problems: {n_files:3} files  {marker}")

bad_nac = [(p, n) for p, n in o_nac if n > 7]
if bad_nac:
    print(f"\n  Top offenders (>7 problems):")
    for p, n in sorted(bad_nac, key=lambda x: -x[1])[:10]:
        print(f"    {n:3} | {p[:60]}")

# ── Verdict ──
print(f"\n═══════════════════════════════════════════════════════════════")
print(f"  VERDICT")
print(f"═══════════════════════════════════════════════════════════════")

total_obl = len(o_obl)
ok_obl = dist_obl.get(4, 0)
total_nac = len(o_nac)
ok_nac = dist_nac.get(6, 0)

if total_obl:
    pct_obl = ok_obl / total_obl * 100
    print(f"  Областен OK (4):      {ok_obl}/{total_obl}  ({pct_obl:.0f}%)")
if total_nac:
    pct_nac = ok_nac / total_nac * 100
    print(f"  Национален OK (6):    {ok_nac}/{total_nac}  ({pct_nac:.0f}%)")

total = total_obl + total_nac
ok = ok_obl + ok_nac
if total:
    pct = ok / total * 100
    if pct >= 80:
        print(f"\n  ✅ Extraction is HEALTHY ({pct:.0f}% correct)")
        print(f"     Problem is elsewhere (classifier / anchors / prompts)")
    elif pct >= 50:
        print(f"\n  ⚠ Extraction has ISSUES ({pct:.0f}% correct)")
        print(f"     Prompt fix would help but not critical")
    else:
        print(f"\n  🔴 Extraction is BROKEN ({pct:.0f}% correct)")
        print(f"     Prompt + count validation is MANDATORY")

print()