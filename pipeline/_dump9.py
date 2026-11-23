import json
from pathlib import Path
import html

base = Path('../generated/cache/extracted')
targets = ["2006-10", "2012-12", "2018-10", "2018-11", "2019-10",
           "2021-11", "2022-10", "2024-12", "2025-10"]

out = []
out.append("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Dump 9 files</title>")
out.append("<style>")
out.append("body{font-family:monospace;padding:20px;max-width:1400px;margin:auto;background:#fafafa}")
out.append(".file{background:#fff;padding:15px;margin:20px 0;border-left:4px solid #2196F3;box-shadow:0 1px 3px rgba(0,0,0,0.1)}")
out.append(".stmt{background:#fafafa;padding:10px;margin:8px 0;border-left:2px solid #ccc}")
out.append(".num{color:#d32f2f;font-weight:bold}")
out.append(".grade{color:#666;font-size:0.85em}")
out.append(".ok{color:#2e7d32;font-weight:bold}")
out.append(".fail{color:#c62828;font-weight:bold}")
out.append("pre{white-space:pre-wrap;word-wrap:break-word;margin:8px 0}")
out.append("</style></head><body>")
out.append("<h1>Dump 9 files</h1>")

for t in targets:
    matches = list(base.glob('*' + t + '*'))
    matches = [m for m in matches if m.is_dir()]
    if not matches:
        out.append("<div class='file'><h2>" + t + " - MISSING</h2></div>")
        continue
    f = matches[0] / 'all_problems.json'
    if not f.exists():
        out.append("<div class='file'><h2>" + t + " - no all_problems.json (" + matches[0].name + ")</h2></div>")
        continue
    d = json.load(open(f, encoding='utf-8'))
    v = d.get('verification', {})
    verdict = v.get('verdict', '?')
    cls = 'ok' if verdict in ('PASS', 'PASS_WITH_WARNINGS') else 'fail'
    out.append("<div class='file'>")
    out.append("<h2>" + t + " -> " + matches[0].name + "</h2>")
    out.append("<p>level: <b>" + str(d.get('extraction_level')) + "</b> | verdict: <b class='" + cls + "'>" + str(verdict) + "</b>")
    out.append(" | verified: <b>" + str(v.get('verified')) + "/" + str(v.get('expected')) + "</b>")
    out.append(" | duplicates: " + str(v.get('duplicates', 0)))
    out.append(" | hallucinated: " + str(v.get('hallucinated', 0)))
    out.append(" | total: " + str(len(d['problems'])) + "</p>")
    for p in d['problems']:
        stmt = html.escape(p.get('statement') or '(no statement)')
        grade = p.get('_quote_grade', '?')
        num = p.get('num', '?')
        out.append("<div class='stmt'>")
        out.append("<span class='num'>[" + str(num) + "]</span> <span class='grade'>(" + str(grade) + ")</span>")
        out.append("<pre>" + stmt + "</pre>")
        out.append("</div>")
    out.append("</div>")

out.append("</body></html>")
Path('_dump9.html').write_text('\n'.join(out), encoding='utf-8')
print("Saved: _dump9.html")
