import json, random
from pathlib import Path
from config import EXTRACTED_DIR

unknown = []
for d in EXTRACTED_DIR.iterdir():
    if not d.is_dir(): continue
    f = d / 'all_problems.json'
    if not f.exists(): continue
    try:
        data = json.load(open(f, encoding='utf-8'))
    except: continue
    if not data.get('verification', {}).get('verdict'):
        unknown.append(data)

print(f"Total unknown: {len(unknown)}")
random.seed(42)
sample = random.sample(unknown, min(10, len(unknown)))

for d in sample:
    print(f"\n{'='*100}")
    print(f"FILE: {d['pdf']}")
    print(f"  problems={len(d['problems'])}")
    for p in d['problems'][:2]:
        stmt = (p.get('statement') or '')[:200]
        sol = (p.get('solution') or '')[:100]
        print(f"\n  [{p.get('num')!r}] grade={p.get('grade')!r}")
        print(f"    STMT: {stmt}")
        if sol:
            print(f"    SOL:  {sol}")
