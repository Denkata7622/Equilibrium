import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import json
from pathlib import Path
from config import EXTRACTED_DIR

# Find all PASS_WITH_WARNINGS with shortfall
problematic = []
for d in EXTRACTED_DIR.iterdir():
    if not d.is_dir(): continue
    f = d / 'all_problems.json'
    if not f.exists(): continue
    try:
        data = json.load(open(f, encoding='utf-8'))
    except: continue
    v = data.get('verification', {})
    if v.get('verdict') != 'PASS_WITH_WARNINGS': continue
    verified = v.get('verified', 0) or 0
    expected = v.get('expected', 0) or 0
    actual = v.get('actual', 0) or 0
    if expected and verified < expected:
        problematic.append({
            'name': data['pdf'],
            'verified': verified,
            'expected': expected,
            'actual': actual,
            'problems': data['problems'],
            'reasons': v.get('reasons', []),
        })

print(f"\n{'='*100}")
print(f"FOUND {len(problematic)} files with PASS_WITH_WARNINGS and shortfall")
print(f"{'='*100}\n")

for entry in problematic:
    print(f"\n{'─'*100}")
    print(f"FILE: {entry['name']}")
    print(f"  verified={entry['verified']}/{entry['expected']}, actual={entry['actual']}")
    print(f"  reasons: {entry['reasons']}")
    print(f"{'─'*100}")

    for p in entry['problems']:
        num = p.get('num')
        grade = p.get('grade')
        seg = p.get('segment_num', '?')
        qg = p.get('_quote_grade', '?')
        qw = p.get('_quote_warning', '')
        stmt = (p.get('statement') or '')
        sol = (p.get('solution') or '')

        # Detect issues
        flags = []
        if not stmt: flags.append('NO_STMT')
        if any(0xD800 <= ord(c) <= 0xDFFF for c in stmt+sol): flags.append('SURROGATE')
        if '\uFFFD' in stmt+sol: flags.append('FFFD')
        flag_str = f" ⚠️ {'/'.join(flags)}" if flags else ""

        print(f"\n─── [{num}] grade={grade} seg={seg} quote={qg} {qw}{flag_str} ───")
        print(f"  STMT ({len(stmt)} chars):")
        if stmt:
            for line in stmt.split('\n')[:5]:
                print(f"    {line}")
            if len(stmt.split('\n')) > 5:
                print(f"    ... [{len(stmt.split(chr(10)))-5} more]")
        else:
            print(f"    (празно)")
        print(f"  SOL ({len(sol)} chars):")
        if sol:
            for line in sol.split('\n')[:2]:
                print(f"    {line}")
        else:
            print(f"    (празно)")
