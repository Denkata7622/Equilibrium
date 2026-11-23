#!/usr/bin/env python3
"""check_extraction.py — quality audit на extraction файлове."""
import json, sys
from pathlib import Path
from difflib import SequenceMatcher

EXTRACTED = Path("../generated/cache/extracted")

def _norm(s):
    import re
    return re.sub(r'\s+', ' ', (s or '')).strip().lower()

def check_file(f: Path):
    d = json.load(open(f, encoding='utf-8'))
    probs = d.get('problems', [])
    name = d.get('pdf', f.parent.name)

    # Очакван брой
    import re
    expected = None
    m = re.search(r'-(\d{4})-(\d{1,2}) кл', name)
    if m:
        year, grade = int(m.group(1)), int(m.group(2))
        if grade in (9, 10, 11, 12) and 'Областен' in name:
            expected = 6 if year <= 2012 else 4
    if 'Национален' in name:
        expected = 6

    nums = [p.get('num') for p in probs]
    unique_nums = len(set(str(n) for n in nums))
    quote_grades = {}
    null_stmt = sum(1 for p in probs if not p.get('statement'))
    null_sol = sum(1 for p in probs if not p.get('solution'))
    readability = {}
    for p in probs:
        qg = p.get('_quote_grade', '?')
        quote_grades[qg] = quote_grades.get(qg, 0) + 1
        r = p.get('readability', '?')
        readability[r] = readability.get(r, 0) + 1

    print(f"\n{'='*70}")
    print(f"  {name}")
    print(f"  problems: {len(probs)}  |  expected: {expected or '?'}  |  unique nums: {unique_nums}")
    if expected and len(probs) != expected:
        print(f"  ⚠️  MISMATCH: got {len(probs)}, expected {expected}")
    if len(probs) != unique_nums:
        print(f"  ⚠️  DUPLICATE nums: {len(probs) - unique_nums} dupes")
    print(f"  null statement: {null_stmt}/{len(probs)}")
    print(f"  null solution:  {null_sol}/{len(probs)}")
    print(f"  quote grades:  {quote_grades}")
    print(f"  readability:   {readability}")
    print(f"  nums: {sorted(str(n) for n in nums)}")

def main():
    files = sorted(EXTRACTED.glob("*/all_problems.json"))
    if not files:
        print("Няма extraction файлове")
        return
    for f in files:
        check_file(f)

if __name__ == "__main__":
    main()