import sys, json, time
from pathlib import Path
sys.path.insert(0, '.')
import pdf_chunker

chunker = pdf_chunker.PDFChunker()
print(f"Model: {chunker.ai_classify.model}\n")
class_dir = Path('../generated/cache/classified')

# Collect 68 NORMAL failures
to_retry = []
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
        if p.get('secondary_points') is not None: continue
        stmt_len = len(p.get('statement') or '')
        sol_len = len(p.get('solution') or '')
        # Skip SHORT and LONG_SOL
        if stmt_len < 100: continue
        if sol_len > 3000: continue
        to_retry.append((f, data, i, p, pdf))

print(f"Retry candidates (NORMAL only): {len(to_retry)}")
print(f"Cost estimate: ${len(to_retry) * chunker.classify_cost:.3f}")
print(f"Pause between requests: 2s (avoid rate limit)\n")

updated = 0
with_secondary = 0
with_high = 0
errors = 0
start = time.time()
dirty_files = set()

for n, (f, data, idx, p, pdf) in enumerate(to_retry, 1):
    if n % 10 == 0:
        elapsed = int(time.time() - start)
        eta = elapsed / n * (len(to_retry) - n) if n else 0
        print(f"[{n}/{len(to_retry)}] {elapsed}s, ETA {eta}s, updated={updated}")

    try:
        cls = chunker.classify_problem(p)
    except pdf_chunker.BudgetExhausted as e:
        print(f"\n⚠ Budget exhausted at {n}: {e}")
        break
    except Exception as e:
        print(f"  ✗ #{p.get('num')} {type(e).__name__}: {str(e)[:100]}")
        errors += 1
        time.sleep(3)
        continue

    if not cls or not isinstance(cls, dict):
        errors += 1
        time.sleep(3)
        continue

    sec = cls.get('secondary_points')
    if sec is not None and isinstance(sec, list):
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

    # Checkpoint every 20
    if updated > 0 and updated % 20 == 0:
        for df in dirty_files:
            for ff, dd, _, _, _ in to_retry:
                if ff == df:
                    df.write_text(json.dumps(dd, ensure_ascii=False, indent=2), encoding='utf-8')
                    break
        print(f"  💾 Checkpoint: {updated}")

    # ⚠️ CRITICAL: 2s pause between requests to avoid rate limit
    time.sleep(2)

# Final save
seen = set()
for f, data, _, _, _ in to_retry:
    if f in dirty_files and f not in seen:
        f.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        seen.add(f)

print(f"\n{'='*50}")
print(f"✓ Updated:          {updated}/{len(to_retry)}")
print(f"  With secondary:   {with_secondary}")
print(f"  With conf >= 0.7: {with_high}")
print(f"  Errors:           {errors}")
print(f"  Modified files:   {len(dirty_files)}")
