import sys, json, time
from pathlib import Path
sys.path.insert(0, '.')
import pdf_chunker

chunker = pdf_chunker.PDFChunker()

# ─── Explicit gpt-6.1-sol client (doesn't touch config.json) ───
gpt_cfg = {
    "api_url": chunker.ai_extract.url,
    "api_key": chunker.ai_extract.headers.get("Authorization", "").replace("Bearer ", ""),
    "model": "openai/gpt-6.1-sol",
    "max_tokens": 32000,
    "temperature": 0.3,
}
gpt = pdf_chunker.AIClient(gpt_cfg, "gpt-card")

print(f"Client model: {gpt.model}")
print(f"ai_extract model (for reference): {chunker.ai_extract.model}")
print(f"ai_classify model (for reference): {chunker.ai_classify.model}\n")

anchors_dir = Path('../generated/anchors')
articles_dir = Path('../generated/articles')
out_dir = Path('../generated/insights_gpt_test')
out_dir.mkdir(exist_ok=True, parents=True)

INSIGHT_PROMPT = """Ти си опитен олимпийски учител по математика с 20 години стаж.
Пишеш "insight card" за ЕДНА конкретна задача.

═══ КРИТИЧНО ВАЖНО ═══
Ученикът ВЕЧЕ Е ПРОЧЕЛ статията за тази тема (давам ти я по-долу).
Card-ът НЕ трябва да повтаря това, което статията вече казва.
Стъпвай на вече обясненото: "Както видя в секция 3.2, [свойство]. Сега виж..."

═══ СТИЛ ═══
- Български, на "ти"
- 2200-2600 думи
- "Защо" след всяка стъпка

═══ СТРУКТУРА (12 секции) ═══
## 1. Условието
## 2. Къде се вписва в темата
## 3. Защо работи — идеята
## 4. Как да се сетиш
## 5. Ако не се сетиш — план Б
## 6. Решението стъпка по стъпка
## 7. Общи правила
## 8. Чести грешки
## 9. Вариации "какво ако..."
## 10. Алтернативни подходи
## 11. Още задачи от същия тип
## 12. Self-check

═══ КОНТЕКСТ ═══
Точка: {point_id} — {point_title}

═══ СТАТИЯ ═══
{full_article}

═══ ЗАДАЧА ═══
Условие: {statement}
Решение: {solution}
Трудност: {difficulty}

Върни САМО markdown. Започни с "## 1. Условието". НЕ обграждай в JSON.
"""

TEST_TASKS = [('1.4', 0), ('4.4', 0), ('6.7', 0), ('5.9', 0), ('8.15', 0)]

# R1 baselines to compare (from prior test)
R1_BASELINES = {
    '1.4': 2600,   # ai_classify_False_1.4_1.md
    '4.4': 1748,   # ai_extract_False_4.4_1.md
    '6.7': 192,    # failed
    '5.9': 2600,   # user showed as "good"
    '8.15': 1112,  # partial
}

results = []
start_total = time.time()

for i, (pid, idx) in enumerate(TEST_TASKS, 1):
    anchor_file = anchors_dir / f"{pid.replace('.', '_')}.json"
    if not anchor_file.exists():
        print(f"[{i}/5] {pid} ✗ no anchor file")
        continue
    d = json.loads(anchor_file.read_text(encoding='utf-8'))
    problems = d.get('problems', [])
    if idx >= len(problems):
        print(f"[{i}/5] {pid} ✗ only {len(problems)} problems")
        continue
    
    p = problems[idx]
    stmt = (p.get('statement') or '').strip()
    sol = (p.get('solution') or '').strip()
    if not stmt or not sol:
        print(f"[{i}/5] {pid} ✗ empty stmt/sol")
        continue
    
    # Load article
    article_folder = articles_dir / pid.replace('.', '_')
    full_article = "(няма статия)"
    if article_folder.exists():
        deep = article_folder / 'deep.md'
        if deep.exists():
            content = deep.read_text(encoding='utf-8')
            if '---' in content[:200]:
                parts = content.split('---', 2)
                if len(parts) >= 3: content = parts[2]
            full_article = content.strip()[:12000]
    
    info = chunker.steps_info.get(pid, {})
    user = INSIGHT_PROMPT.format(
        point_id=pid, point_title=info.get('title', '?'),
        full_article=full_article,
        statement=stmt[:3000],
        solution=sol[:3500],
        difficulty=p.get('difficulty', '?'),
    )
    
    print(f"[{i}/5] {pid}/task{idx+1}: {info.get('title', '?')[:50]}")
    print(f"      prompt ~{len(user)//4} tok, calling gpt-6.1-sol...", end=' ', flush=True)
    
    t0 = time.time()
    try:
        raw = gpt.call(INSIGHT_PROMPT, user, f"gpt-{pid}-{idx}", force_json=False)
    except Exception as e:
        print(f"✗ {e}")
        continue
    dur = int(time.time() - t0)
    
    if not raw:
        print(f"✗ empty ({dur}s)")
        continue
    
    out_file = out_dir / f"{pid.replace('.', '_')}_p{idx+1}.md"
    header = f"# {pid} / Задача {idx+1} — {info.get('title', '?')}\n\n"
    header += f"**Трудност:** {p.get('difficulty', '?')}  \n"
    header += f"**Година:** {p.get('year', '?')}  \n\n---\n\n"
    out_file.write_text(header + raw, encoding='utf-8')
    
    wc = len(raw.split())
    sections = raw.count('## ')
    starts_md = raw.strip().startswith('#') or '## 1.' in raw[:200]
    starts_json = raw.strip().startswith('{')
    
    r1_wc = R1_BASELINES.get(pid, 0)
    delta = wc - r1_wc
    
    status = "✓" if starts_md and not starts_json else "✗"
    print(f"{status} {wc}w {dur}s (R1 was {r1_wc}w, Δ{delta:+d})")
    
    results.append({
        'pid': pid, 'num': idx+1, 'wc': wc, 'dur': dur,
        'sections': sections, 'starts_md': starts_md, 'starts_json': starts_json,
        'file': str(out_file), 'r1_wc': r1_wc,
    })

print(f"\n{'='*78}")
print(f"GPT-6.1-SOL TEST COMPLETE")
print(f"{'='*78}")
print(f"Total time: {int(time.time() - start_total)}s")
print(f"{'PID':<8} {'WORDS':<8} {'SECS':<6} {'SECT':<6} {'MD?':<5} {'R1 words':<10} {'Δ':<6}")
print('-' * 78)
for r in results:
    md_flag = "✓" if r['starts_md'] and not r['starts_json'] else "✗"
    print(f"{r['pid']:<8} {r['wc']:<8} {r['dur']:<6} {r['sections']:<6} {md_flag:<5} {r['r1_wc']:<10} {r['wc']-r['r1_wc']:+d}")

print(f"\nAvg words: {sum(r['wc'] for r in results)//max(1,len(results))}")
print(f"Avg time:  {sum(r['dur'] for r in results)//max(1,len(results))}s")
print(f"Markdown OK: {sum(1 for r in results if r['starts_md'] and not r['starts_json'])}/{len(results)}")
print(f"Full sections (12): {sum(1 for r in results if r['sections'] >= 11)}/{len(results)}")

print(f"\nFiles to review:")
for r in results:
    print(f"  {r['file']}")
