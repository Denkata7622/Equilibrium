import json
from pathlib import Path

class_dir = Path('../generated/cache/classified')
anchors_dir = Path('../generated/anchors')

# ── Load STEPS titles ──
steps_file = Path('../data/steps.js')
steps_text = steps_file.read_text(encoding='utf-8')
import re
steps_info = {}
for m in re.finditer(
    r'\{\s*id\s*:\s*"([^"]+)"[^{}]*?title\s*:\s*"((?:\\.|[^"\\])*)"',
    steps_text, re.DOTALL
):
    pid = m.group(1)
    title = m.group(2).replace('\\"', '"').replace("\\'", "'")
    steps_info[pid] = title

# ── Current anchor counts ──
current_anchors = {}
for f in anchors_dir.glob('*.json'):
    if f.name.startswith('_'): continue
    try:
        d = json.loads(f.read_text(encoding='utf-8'))
        current_anchors[d['point_id']] = d['total']
    except: continue
thin = {pid for pid, n in current_anchors.items() if n <= 2}

# ── Collect secondary assignments ──
assignments = []
for src in class_dir.iterdir():
    if not src.is_dir(): continue
    f = src / 'all_problems.json'
    if not f.exists(): continue
    try:
        data = json.loads(f.read_text(encoding='utf-8'))
    except: continue
    pdf = data.get('pdf', src.name)
    if any(pdf.upper().startswith(p) for p in ('BMC', 'BMO', 'BMS')):
        continue
    for p in data.get('problems', []):
        sec = p.get('secondary_points')
        if not sec or not isinstance(sec, list): continue
        for s in sec:
            if s.get('confidence', 0) < 0.7: continue
            assignments.append({
                'pdf': pdf,
                'num': p.get('num'),
                'year': p.get('year'),
                'grade': p.get('grade'),
                'statement': (p.get('statement') or '').strip(),
                'primary': p.get('point_id'),
                'target': s.get('id'),
                'conf': s.get('confidence'),
                'reasoning': (p.get('reasoning') or '').strip()[:150],
            })

# ── Group by target point (only thin ones) ──
by_target = {}
for a in assignments:
    if a['target'] not in thin: continue
    by_target.setdefault(a['target'], []).append(a)

print("=" * 90)
print("HIGH-CONFIDENCE SECONDARY ASSIGNMENTS INTO THIN POINTS")
print("=" * 90)
print(f"Total high-conf: {len(assignments)}")
print(f"Into thin points: {sum(len(v) for v in by_target.values())}")
print(f"Thin targets: {len(by_target)}")
print()

for target in sorted(by_target.keys()):
    items = by_target[target]
    current = current_anchors.get(target, 0)
    would_become = current + len(items)
    title = steps_info.get(target, '?')
    status = "★ WILL REACH ≥3" if would_become >= 3 else "· still thin"

    print("=" * 90)
    print(f"TARGET: {target} — {title}")
    print(f"  Currently: {current} anchors  →  Would become: {would_become}  {status}")
    print("=" * 90)

    for i, a in enumerate(items, 1):
        primary_title = steps_info.get(a['primary'], '?')
        print(f"\n  [{i}] {a['pdf']} · {a['year']}-{a['grade']} · Зад. {a['num']}")
        print(f"      PRIMARY: {a['primary']} — {primary_title}")
        print(f"      → SECONDARY: {target} ({title})  conf={a['conf']}")
        print(f"      STATEMENT:")
        # Wrap statement nicely, max 400 chars
        stmt = a['statement'].replace('\n', ' ')
        if len(stmt) > 400:
            stmt = stmt[:400] + '...'
        # Indent wrapped lines
        for line in [stmt[j:j+85] for j in range(0, len(stmt), 85)]:
            print(f"        {line}")
        if a['reasoning']:
            print(f"      WHY model said: {a['reasoning']}")

print()
print("=" * 90)
print("SECONDARY INTO RICH POINTS (skipped by aggregate, ignored)")
print("=" * 90)
rich_count = len(assignments) - sum(len(v) for v in by_target.values())
print(f"  {rich_count} assignments into rich points (already have ≥3 anchors)")
print("  These don't help thin points but improve cross-references in future articles")

# ── Also show mid-confidence into thin points (would need threshold 0.5) ──
print()
print("=" * 90)
print("MID-CONFIDENCE (0.5-0.7) INTO THIN POINTS — would need threshold 0.5")
print("=" * 90)

mid_by_target = {}
for src in class_dir.iterdir():
    if not src.is_dir(): continue
    f = src / 'all_problems.json'
    if not f.exists(): continue
    try: data = json.loads(f.read_text(encoding='utf-8'))
    except: continue
    pdf = data.get('pdf', src.name)
    if any(pdf.upper().startswith(p) for p in ('BMC', 'BMO', 'BMS')):
        continue
    for p in data.get('problems', []):
        sec = p.get('secondary_points')
        if not sec or not isinstance(sec, list): continue
        for s in sec:
            conf = s.get('confidence', 0)
            if not (0.5 <= conf < 0.7): continue
            if s.get('id') not in thin: continue
            mid_by_target.setdefault(s.get('id'), []).append({
                'pdf': pdf, 'num': p.get('num'),
                'statement': (p.get('statement') or '')[:300],
                'primary': p.get('point_id'), 'conf': conf,
            })

if not mid_by_target:
    print("  (none)")
else:
    for target in sorted(mid_by_target.keys()):
        print(f"\n  → {target} — {steps_info.get(target, '?')}")
        for a in mid_by_target[target]:
            print(f"      from {a['pdf']} #{a['num']} (primary={a['primary']}, conf={a['conf']})")
            print(f"      {a['statement'][:200]}")
