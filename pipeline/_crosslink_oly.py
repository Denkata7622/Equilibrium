import json
from pathlib import Path
from collections import Counter

anchors = Path('../generated/anchors')
all_points = {}
for f in anchors.glob('*.json'):
    if f.name.startswith('_'): continue
    d = json.loads(f.read_text(encoding='utf-8'))
    all_points[d['point_id']] = d.get('problems', [])

pool = [(pid, p) for pid, probs in all_points.items() for p in probs]
thin = [pid for pid, probs in all_points.items() if 1 <= len(probs) <= 2]

print(f"Thin points: {len(thin)}")
print("=" * 78)

proposals = {}
for pid in thin:
    own = all_points[pid]
    own_techs = Counter()
    for p in own:
        for t in p.get('techniques', []):
            own_techs[t] += 1
    if not own_techs:
        print(f"\n{pid}: NO TECHNIQUES — skip")
        continue
    candidates = []
    for src_pid, p in pool:
        if src_pid == pid: continue
        p_techs = set(p.get('techniques', []))
        overlap = len(p_techs & set(own_techs))
        if overlap == 0: continue
        score = sum(own_techs[t] for t in p_techs if t in own_techs)
        candidates.append((src_pid, p, score, overlap))
    candidates.sort(key=lambda x: x[2], reverse=True)
    top = candidates[:3]
    if top:
        proposals[pid] = top
        print(f"\n{pid} (has {len(own)}, needs {3-len(own)}+):")
        for src_pid, p, score, overlap in top:
            stmt = (p.get('statement') or '')[:65]
            print(f"  ← {src_pid} (score={score}, {overlap}tech): {stmt}...")

out = {pid: [{'from': src, 'problem': p, 'score': s, 'overlap': o}
             for src, p, s, o in cands]
       for pid, cands in proposals.items()}
(anchors / '_crosslink_oly.json').write_text(
    json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"\n{'='*78}")
print(f"✓ {len(proposals)}/{len(thin)} thin points have proposals")
