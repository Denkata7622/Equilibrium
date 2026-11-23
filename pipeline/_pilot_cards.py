import sys, json, time
from pathlib import Path
sys.path.insert(0, '.')
import pdf_chunker

chunker = pdf_chunker.PDFChunker()
anchors_dir = Path('../generated/anchors')
articles_dir = Path('../generated/articles')
out_dir = Path('../generated/insights_pilot')
out_dir.mkdir(exist_ok=True, parents=True)

PILOT_TASKS = [
    ('1.4', 0), ('1.10', 0), ('5.1', 0), ('6.1', 0), ('8.15', 0),
    ('8.3', 0), ('3.1', 0), ('4.4', 0), ('2.6', 0), ('6.7', 0),
]

INSIGHT_PROMPT = """Ти си опитен олимпийски учител по математика с 20 години стаж.
Пишеш "insight card" за ЕДНА конкретна задача.

═══ КРИТИЧНО ВАЖНО ═══
Ученикът ВЕЧЕ Е ПРОЧЕЛ статията за тази тема (давам ти я по-долу).
Card-ът НЕ трябва да повтаря това, което статията вече казва.

Вместо това:
- Стъпвай на вече обясненото: "Както видя в секция 3.2, [свойство]. Сега виж..."
- Не дефинирай понятия, които статията дефинира
- Не доказвай теореми, които статията доказва
- Фокусирай се върху ТАЗИ задача — какво е специфичното, как се прилага
- Ако задачата използва нещо НЕобяснено в статията → посочи го изрично

═══ СТИЛ ═══
- Български, на "ти"
- Ясно, директно, без повторения
- "Защо" след всяка стъпка
- 2200-2600 думи

═══ СТРУКТУРА (11 секции) ═══

## 1. Условието
[Пълен текст + метаданни (година, клас, трудност).]

## 2. Къде се вписва в темата
[100-150 думи. "Тази задача е пример за [техника]. Статията обяснява [X]
в секция Y. Тук виждаш приложението в [конкретен контекст]."]

## 3. Защо работи — идеята
[200-300 думи. Интуиция. Може да реферираш секции: "(виж секция 3.2)".
НЕ повтаряй дефиниции.]

## 4. Как да се сетиш
[400-500 думи. Мисловен процес. Може: "Ако си чел секция 4.1, ще познаеш
този pattern" — но САМО ако е вярно.]

## 5. Ако не се сетиш — план Б
[150-250 думи. 2-4 КОНКРЕТНИ стъпки за ТАЗИ задача. Може: "върни се на
секция X и виж примера — там е същата идея в по-прост вид".]

## 6. Решението стъпка по стъпка
[Пълно решение С ПРЕПРАТКИ към теорията: "Стъпка 2: Прилагаме [теорема]
(доказана в секция 3.3). Защо работи тук: ..."]

## 7. Общи правила
[3-5 ПРЕНОСИМИ правила. Ако правилото е в статията — не повтаряй,
дай конкретна вариация: "Статията казва X. Тук виждаш X в ситуация Y."]

## 8. Чести грешки
[2-4 грешки специфични за ТАЗИ задача (не за темата).
"Учениците често [грешка] — защо е грешно: [обяснение]".]

## 9. Вариации "какво ако..."
[3-4 вариации. "Какво ако X? → Тогава [промяна]."]

## 10. Алтернативни подходи
[2-ри начин ако има. Ако не — 1-2 реда защо няма.]

## 11. Още задачи от същия тип
[3-5 задачи от същата точка. "Задача N — също [техника], но [вариация]".]

## 12. Self-check
[3 въпроса (Basic, Transfer, Conceptual). С отговори.]

═══ КОНТЕКСТ ═══

Точка: {point_id} — {point_title}
Описание: {point_desc}

═══ ПЪЛНАТА СТАТИЯ ═══
{full_article}

═══ ЗАДАЧАТА ═══
Условие: {statement}
Решение: {solution}
Трудност: {difficulty}

═══ ДРУГИ ЗАДАЧИ ═══
{other_tasks}

═══ ВАЖНО ═══
- НЕ повтаряй съдържание от статията. Стъпвай на него.
- Ако задачата използва нещо НЕобяснено в статията → кажи го.
- Секции 4, 6, 7 са най-важни.
"""

print(f"Model: {chunker.ai_classify.model}")
print(f"Pilot: {len(PILOT_TASKS)} tasks (with FULL article as context)\n")

results = []
for i, (pid, idx) in enumerate(PILOT_TASKS, 1):
    print(f"\n{'='*78}")
    print(f"[{i}/{len(PILOT_TASKS)}] {pid} / task {idx}")
    print(f"{'='*78}")

    anchor_file = anchors_dir / f"{pid.replace('.', '_')}.json"
    if not anchor_file.exists():
        print(f"  ✗ No anchor file")
        continue
    anchor_data = json.loads(anchor_file.read_text(encoding='utf-8'))
    problems = anchor_data.get('problems', [])
    if idx >= len(problems):
        print(f"  ✗ Only {len(problems)} problems")
        continue

    p = problems[idx]
    stmt = (p.get('statement') or '').strip()
    sol = (p.get('solution') or '').strip()
    if not stmt or not sol:
        print(f"  ✗ Empty stmt/sol")
        continue

    # Load FULL article (deep.md)
    article_folder = articles_dir / pid.replace('.', '_')
    full_article = "(няма статия)"
    if article_folder.exists():
        deep_md = article_folder / 'deep.md'
        if deep_md.exists():
            content = deep_md.read_text(encoding='utf-8')
            if '---' in content[:200]:
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    content = parts[2]
            full_article = content.strip()

    info = chunker.steps_info.get(pid, {})
    title = info.get('title', '?')
    desc = info.get('desc', '')[:200]

    other = []
    for j, op in enumerate(problems):
        if j == idx: continue
        other_stmt = (op.get('statement') or '')[:150].replace('\n', ' ')
        other.append(f"  Задача {j+1} ({op.get('difficulty', '?')}): {other_stmt}...")
        if len(other) >= 5: break
    other_tasks = "\n".join(other) if other else "(няма)"

    user = INSIGHT_PROMPT.format(
        point_id=pid, point_title=title, point_desc=desc,
        full_article=full_article,
        statement=stmt[:3000], solution=sol[:3500],
        difficulty=p.get('difficulty', '?'),
        other_tasks=other_tasks,
    )

    print(f"  stmt={len(stmt)}c sol={len(sol)}c article={len(full_article)}c")
    print(f"  Prompt size: ~{len(user)//4} tokens")
    print(f"  Calling AI...")

    t0 = time.time()
    try:
        raw = chunker.ai_classify.call(INSIGHT_PROMPT, user, f"insight-{pid}-{idx}")
    except Exception as e:
        print(f"  ✗ {e}")
        continue
    dur = int(time.time() - t0)

    if not raw:
        print(f"  ✗ Empty ({dur}s)")
        continue

    out_file = out_dir / f"{pid.replace('.', '_')}_p{idx+1:03d}.md"
    header = f"# {pid} / Задача {idx+1} — {title}\n\n"
    header += f"**Трудност:** {p.get('difficulty', '?')}  \n"
    header += f"**Година:** {p.get('year', '?')}  \n"
    header += f"**Клас:** {p.get('grade', '?')}  \n\n---\n\n"
    out_file.write_text(header + raw, encoding='utf-8')

    wc = len(raw.split())
    print(f"  ✓ {wc} words, {dur}s → {out_file.name}")
    results.append({'pid': pid, 'task': idx+1, 'words': wc, 'time': dur})

print(f"\n{'='*78}")
print(f"PILOT COMPLETE: {len(results)}/{len(PILOT_TASKS)}")
print(f"Total: {sum(r['words'] for r in results)} words")
print(f"Avg: {sum(r['words'] for r in results)//max(1,len(results))} words, {sum(r['time'] for r in results)//max(1,len(results))}s")
