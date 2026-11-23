import json
from pathlib import Path

class_dir = Path('../generated/cache/classified')
anchors_dir = Path('../generated/anchors')

# ── 1. Load current anchor counts ──
current_anchors = {}
for f in anchors_dir.glob('*.json'):
    if f.name.startswith('_'): continue
    try:
        d = json.loads(f.read_text(encoding='utf-8'))
        current_anchors[d['point_id']] = d['total']
    except Exception:
        continue

thin_before = {pid: n for pid, n in current_anchors.items() if n <= 2}
print(f"Current state: {len(current_anchors)} points, "
      f"{len(thin_before)} thin (<=2 anchors)")
print()

# ── 2. Scan classified for secondary_points ──
assigned = []  # (pdf, num, primary, secondary_list, from_source)
for src in class_dir.iterdir():
    if not src.is_dir(): continue
    f = src / 'all_problems.json'
    if not f.exists(): continue
    try:
        data = json.loads(f.read_text(encoding='utf-8'))
    except Exception:
        continue
    pdf = data.get('pdf', src.name)
    if any(pdf.upper().startswith(p) for p in ('BMC', 'BMO', 'BMS')):
        continue
    for p in data.get('problems', []):
        sec = p.get('secondary_points')
        if sec is None: continue  # not processed yet
        if not isinstance(sec, list): continue
        if not sec: continue  # processed but no secondary assigned
        assigned.append({
            'pdf': pdf,
            'num': p.get('num'),
            'primary': p.get('point_id'),
            'secondary': sec,
        })

print(f"Problems WITH secondary_points assigned: {len(assigned)}")
print()

# ── 3. Classify by confidence threshold ──
high = []  # conf >= 0.7 → will be used in aggregate
mid = []   # 0.5-0.7
low = []   # < 0.5

for a in assigned:
    for s in a['secondary']:
        entry = {**a, 'target_id': s.get('id'), 'conf': s.get('confidence', 0)}
        if entry['conf'] >= 0.7:
            high.append(entry)
        elif entry['conf'] >= 0.5:
            mid.append(entry)
        else:
            low.append(entry)

print(f"Secondary assignments by confidence:")
print(f"  High (>=0.7) → used in aggregate:  {len(high)}")
print(f"  Mid  (0.5-0.7):                    {len(mid)}")
print(f"  Low  (<0.5):                       {len(low)}")
print()

# ── 4. Which thin points would receive high-conf secondary? ──
print("=" * 78)
print("High-confidence secondary -> target points")
print("=" * 78)

by_target = {}
for h in high:
    by_target.setdefault(h['target_id'], []).append(h)

if not by_target:
    print("  (none — 40 updates didn't produce high-conf secondary)")
else:
    for target in sorted(by_target.keys(), key=lambda x: x.startswith('R')):
        items = by_target[target]
        current = current_anchors.get(target, 0)
        would_become = current + len(items)
        is_thin = target in thin_before
        marker = "★ THIN→OK" if is_thin and would_become >= 3 else (
                 "· thin" if is_thin else "· rich")
        print(f"\n  → {target}  (currently {current}, would become {would_become})  {marker}")
        for it in items:
            print(f"      from {it['pdf'][:50]} #{it['num']} "
                  f"(primary={it['primary']}, conf={it['conf']:.2f})")

# ── 5. Summary ──
print()
print("=" * 78)
print("Summary")
print("=" * 78)

thin_gaining = 0
thin_to_ok = 0
for target in by_target:
    if target not in thin_before: continue
    thin_gaining += 1
    if current_anchors.get(target, 0) + len(by_target[target]) >= 3:
        thin_to_ok += 1

print(f"  Thin points that would get ≥1 secondary:  {thin_gaining}")
print(f"  Thin points that would reach >=3:         {thin_to_ok}")
print(f"  Total high-conf secondary assignments:    {len(high)}")
print()

if thin_to_ok >= 5:
    print("  ✓ Worth continuing with v3.2 model (30-45 min, $0.30)")
elif thin_to_ok >= 2:
    print("  ~ Marginal. Continue only if budget allows.")
else:
    print("  ✗ Not worth it. Skip multi-tag.")

# ── 6. Also show mid-confidence (might be useful if we lower threshold) ──
if mid:
    print()
    print("=" * 78)
    print(f"Mid-confidence (0.5-0.7) — {len(mid)} assignments (NOT used by aggregate)")
    print("=" * 78)
    mid_by_target = {}
    for m in mid:
        mid_by_target.setdefault(m['target_id'], []).append(m)
    thin_mid = [t for t in mid_by_target if t in thin_before]
    print(f"  Target points: {len(mid_by_target)} total, {len(thin_mid)} thin")
    if thin_mid:
        for t in sorted(thin_mid):
            print(f"    → {t} (thin, would need threshold 0.5)")
