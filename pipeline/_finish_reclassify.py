import sys, json, time
from pathlib import Path
sys.path.insert(0, '.')
import pdf_chunker

chunker = pdf_chunker.PDFChunker()
print(f"Model: {chunker.ai_classify.model}\n")
class_dir = Path('../generated/cache/classified')

to_reclassify = []
already_done = 0
for src in class_dir.iterdir():
    if not src.is_dir(): continue
    f = src / 'all_problems.json'
    if not f.exists(): continue
    try: data = json.loads(f.read_text(encoding='utf-8'))
    except: continue
    pdf = data.get('pdf', src.name)
    if any(pdf.upper().startswith(p) for p in ('BMC', 'BMO', 'BMS')):
        continue
    for i, p in enumerate(data.get('problems', [])):
        if not p.get('point_id'): continue
        if not (p.get('solution') or '').strip(): continue
        if p.get('secondary_points') is not None:
            already_done += 1
            continue
        to_reclassify.append((f, data, i, p, pdf))

print(f"To re-classify: {len(to_reclassify)}")
print(f"Already done:   {already_done}")
print(f"Cost:           ${len(to_reclassify) * chunker.classify_cost:.3f}\n")

updated = 0
with_secondary = 0
with_high = 0
errors = 0
start = time.time()
dirty_files = set()

for n, (f, data, idx, p, pdf) in enumerate(to_reclassify, 1):
    if n % 50 == 0:
        elapsed = int(time.time() - start)
        eta = elapsed / n * (len(to_reclassify) - n) if n else 0
        print(f"[{n}/{len(to_reclassify)}] {elapsed}s, ETA {eta}s")

    try:
        cls = chunker.classify_problem(p)
    except pdf_chunker.BudgetExhausted as e:
        print(f"\n⚠ Budget exhausted at {n}: {e}")
        break
    except Exception as e:
        errors += 1
        continue

    if not cls:
        errors += 1
        continue

    sec = cls.get('secondary_points')
    if sec is not None:
        valid_sec = []
        for s in sec:
            sid = s.get('id')
            sconf = s.get('confidence', 0)
            if sid and sid in chunker.steps_info and sconf >= 0.0:
                valid_sec.append(s)
        data['problems'][idx]['secondary_points'] = valid_sec
        dirty_files.add(f)
        updated += 1
        if valid_sec:
            with_secondary += 1
            if any(s.get('confidence', 0) >= 0.7 for s in valid_sec):
                with_high += 1

    if updated > 0 and updated % 20 == 0:
        for df in dirty_files:
            for ff, dd, _, _, _ in to_reclassify:
                if ff == df:
                    df.write_text(json.dumps(dd, ensure_ascii=False, indent=2), encoding='utf-8')
                    break
        print(f"  💾 Checkpoint: {updated}")

seen = set()
for f, data, _, _, _ in to_reclassify:
    if f in dirty_files and f not in seen:
        f.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        seen.add(f)

print(f"\n{'='*50}")
print(f"✓ Updated:          {updated}/{len(to_reclassify)}")
print(f"  With secondary:   {with_secondary}")
print(f"  With conf >= 0.7: {with_high}")
print(f"  Errors:           {errors}")
print(f"  Modified files:   {len(dirty_files)}")
