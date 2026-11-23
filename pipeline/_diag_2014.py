import json
from pathlib import Path

# 1. Провери OCR кеша
cache = Path("../generated/cache/ocr/OLI-3-Национален кръг-2014-9-12 кл-sol__v2.json")
if cache.exists():
    pages = json.loads(cache.read_text("utf-8"))
    total = sum(len(p["text"]) for p in pages)
    print(f"=== OCR CACHE: {len(pages)} pages, {total} chars ===")
    full = "\n".join(p["text"] for p in pages)
    
    # Търси маркери за задачи/решения
    import re
    for pat in [r"Задача\s+\d+", r"Решение\s+\d*", r"^\d+\."]:
        matches = re.findall(pat, full, re.MULTILINE)
        print(f"  Pattern {pat!r}: {len(matches)} hits → {matches[:10]}")
    
    print(f"\n=== Първи 1500 chars на OCR ===")
    print(full[:1500])
else:
    print(f"OCR cache не е намерен на {cache}")

# 2. Провери какво е извлякъл моделът
print(f"\n\n=== EXTRACTED JSON ===")
ext = Path("../generated/cache/extracted/OLI-3-Национален кръг-2014-9-12 кл-sol/all_problems.json")
if ext.exists():
    data = json.loads(ext.read_text("utf-8"))
    print(f"Version: {data.get('version')}, Problems: {len(data.get('problems', []))}")
    for i, p in enumerate(data["problems"]):
        num = p.get("num")
        stmt = (p.get("statement") or "")[:120]
        sol = (p.get("solution") or "")[:120]
        quote = (p.get("source_quote") or "")[:80]
        print(f"\n  [{i}] num={num}")
        print(f"      stmt: {stmt!r}")
        print(f"      sol:  {sol!r}")
        print(f"      quote: {quote!r}")
