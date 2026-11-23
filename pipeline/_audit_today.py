import json
from pathlib import Path
import re

# Пълен списък със счупени файлове
bad = []
empty = []
partial = []

for d in Path('../generated/cache/extracted').iterdir():
    if not d.is_dir(): continue
    f = d / 'all_problems.json'
    if not f.exists(): continue
    data = json.loads(f.read_text('utf-8'))
    pdf = data['pdf']
    n = len(data.get('problems', []))
    
    expected = None
    if 'Областен' in pdf:
        m = re.search(r'-(\d{4})-1[0-2] кл', pdf)
        if m:
            year = int(m.group(1))
            expected = 6 if year <= 2012 else 4
    elif 'Национален' in pdf:
        expected = 6
    
    if expected is not None and n != expected:
        bad.append((pdf, n, expected))
    if n == 0:
        empty.append(pdf)

print(f'=== Wrong count ({len(bad)}) ===')
for pdf, n, exp in bad:
    print(f'  {n:2d}/{exp} | {pdf}')

print(f'\n=== Empty ({len(empty)}) ===')
for pdf in empty:
    print(f'  {pdf}')

# Кои са НЕобработени (от 279 общо)
extracted = {json.loads(f.read_text('utf-8'))['pdf'] 
             for f in Path('../generated/cache/extracted').glob('*/all_problems.json')}
print(f'\n=== Extracted total: {len(extracted)} ===')
print(f'=== Missing: ~{279 - len(extracted)} (спрямо 279) ===')
