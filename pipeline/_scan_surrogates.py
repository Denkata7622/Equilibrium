from pypdf import PdfReader
from pathlib import Path
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Check ALL PDFs for surrogates
base = Path('../Задачи_Минали_Години')
bad_files = []

for pdf in base.rglob('*.pdf'):
    try:
        reader = PdfReader(str(pdf))
        count = 0
        for page in reader.pages[:2]:  # check first 2 pages only (fast)
            text = page.extract_text() or ""
            count += sum(1 for c in text if 0xD800 <= ord(c) <= 0xDFFF)
        if count > 0:
            bad_files.append((pdf.name, count))
    except Exception:
        pass

print(f"PDFs with surrogates in first 2 pages: {len(bad_files)}")
for name, count in sorted(bad_files, key=lambda x: -x[1])[:20]:
    print(f"  {count:4d}  {name}")
