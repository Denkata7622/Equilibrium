import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from config import EXTRACTED_DIR, OCR_CACHE_DIR
from pathlib import Path
import json
from pdf_chunker import _segment_by_markers

name = "OLI-2-Областен кръг-2012-10 кл-sol"
d = EXTRACTED_DIR / name

print("=" * 80)
print(f"FILE: {name}")
print("=" * 80)

# 1. Version history
print("\n─── Version history ───")
for f in sorted(d.glob("all_problems*.json")):
    try:
        data = json.load(open(f, encoding='utf-8'))
        v = data.get('verification', {})
        print(f"  {f.name}: {len(data['problems'])} problems, "
              f"verdict={v.get('verdict')}, level={data.get('extraction_level')}")
    except Exception as e:
        print(f"  {f.name}: ERROR {e}")

# 2. OCR source (what segmenter sees)
print("\n─── OCR source ───")
ocr_file = OCR_CACHE_DIR / f"{name}__v2.json"
if ocr_file.exists():
    ocr = json.load(open(ocr_file, encoding='utf-8'))
    text = "\n\n".join(p['text'] for p in ocr)
    print(f"  Total: {len(text)} chars")
    segs = _segment_by_markers(text)
    print(f"  Segmenter found: {len(segs)} segments")
    for s in segs:
        print(f"    num={s['num']!r}, len={len(s['text'])}")
    
    # Show potential markers in text
    import re
    markers = re.findall(r'(?m)^.{0,40}', text)
    print(f"\n  First 15 lines of source:")
    for line in markers[:15]:
        print(f"    {line}")
else:
    print(f"  NO OCR cache")
