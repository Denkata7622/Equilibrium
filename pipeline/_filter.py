import json
from pathlib import Path

anchors = Path('../generated/anchors')
props = json.loads((anchors / '_crosslink_oly.json').read_text(encoding='utf-8'))

def family(pid):
    if pid.startswith('R.') or pid.startswith('12.'): return 'mixed'
    major = pid.split('.')[0]
    return {
        '1': 'geometry', '2': 'geometry',
        '3': 'number', '4': 'number', '13': 'number',
        '5': 'algebra', '10': 'algebra',
        '6': 'functions', '7': 'functions', '11': 'functions',
        '8': 'combinatorics', '9': 'combinatorics',
    }.get(major, 'other')

def is_compatible(t, s):
    if t == 'mixed' or s == 'mixed': return True
    if t == s: return True
    return (t, s) in {('algebra','functions'), ('functions','algebra'),
                      ('number','algebra'), ('algebra','number'),
                      ('geometry','combinatorics')}

filtered = {}
removed = 0
deduped = 0
for pid, items in props.items():
    seen = set()
    kept = []
    for item in items:
        key = (item['from'], item['problem'].get('num'),
               (item['problem'].get('statement') or '')[:80])
        if key in seen:
            deduped += 1; continue
        seen.add(key)
        if not is_compatible(family(pid), family(item['from'])):
            removed += 1; continue
        kept.append(item)
    if kept:
        filtered[pid] = kept

print(f"Deduped: -{deduped}, Topic filtered: -{removed}")
print(f"Kept: {sum(len(v) for v in filtered.values())} items in {len(filtered)} points")
print()
for pid, items in sorted(filtered.items()):
    own = len(json.loads((anchors / f"{pid.replace('.', '_')}.json")
                         .read_text(encoding='utf-8')).get('problems', []))
    print(f"\n{pid} ({family(pid)}, has {own}):")
    for item in items[:3]:
        print(f"  ← {item['from']}: {(item['problem'].get('statement') or '')[:65]}...")

(anchors / '_crosslink_oly_filtered.json').write_text(
    json.dumps(filtered, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"\n✓ Saved → _crosslink_oly_filtered.json")
