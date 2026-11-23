"""
Roll-out script for insight cards generation.
Uses GPT-6.1-SOL explicitly (not R1).
Resumable — skips already-generated cards.
Handles API budget exhaustion gracefully.

Usage:
    python _rollout_insights.py              # process all (until budget/error)
    python _rollout_insights.py --limit 250  # process only 250 this session
"""
import sys, json, time, argparse
from pathlib import Path
from datetime import datetime
from collections import defaultdict
sys.path.insert(0, '.')
import pdf_chunker


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None,
                    help="Max cards this session (default: unlimited)")
    ap.add_argument("--model", type=str, default="openai/gpt-6.1-sol",
                    help="Model to use")
    ap.add_argument("--sleep", type=float, default=2.0,
                    help="Seconds between calls (default: 2)")
    ap.add_argument("--dry-run", action="store_true",
                    help="Count tasks but don't call API")
    args = ap.parse_args()

    # ─── Setup ───
    chunker = pdf_chunker.PDFChunker()

    # Explicit GPT client (ignore ai_extract which may be R1)
    api_key = chunker.ai_extract.headers.get("Authorization", "").replace("Bearer ", "")
    gpt = pdf_chunker.AIClient({
        "api_url": chunker.ai_extract.url,
        "api_key": api_key,
        "model": args.model,
        "max_tokens": 32000,
        "temperature": 0.3,
    }, "gpt-card")

    anchors_dir = Path('../generated/anchors')
    articles_dir = Path('../generated/articles')
    out_dir = Path('../generated/insights')
    out_dir.mkdir(exist_ok=True, parents=True)

    prompt_file = Path('insight_prompt.txt')
    if not prompt_file.exists():
        print(f"✗ {prompt_file} not found. Save it first.")
        sys.exit(1)
    PROMPT = prompt_file.read_text(encoding='utf-8')

    print(f"{'='*78}")
    print(f"INSIGHT CARDS ROLL-OUT")
    print(f"{'='*78}")
    print(f"Model:        {gpt.model}")
    print(f"Prompt:       {len(PROMPT)} chars")
    print(f"Sleep:        {args.sleep}s between calls")
    print(f"Output:       {out_dir.resolve()}")
    print(f"Limit:        {args.limit or 'unlimited'}")
    print()

    # ─── Collect all tasks (skip done) ───
    all_tasks = []
    already_done = 0
    skipped_empty = 0
    total_anchors = 0

    for f in sorted(anchors_dir.glob('*.json')):
        if f.name.startswith('_'):
            continue
        try:
            d = json.loads(f.read_text(encoding='utf-8'))
        except Exception as e:
            print(f"⚠ Cannot read {f.name}: {e}")
            continue

        pid = d['point_id']
        safe_pid = pid.replace('.', '_')
        problems = d.get('problems', [])

        for idx, p in enumerate(problems):
            total_anchors += 1
            stmt = (p.get('statement') or '').strip()
            sol = (p.get('solution') or '').strip()

            if not stmt or not sol:
                skipped_empty += 1
                continue

            out_file = out_dir / safe_pid / f"p{idx+1:03d}.md"
            if out_file.exists():
                already_done += 1
                continue

            all_tasks.append({
                'pid': pid,
                'idx': idx,
                'p': p,
                'safe_pid': safe_pid,
                'out_file': out_file,
            })

    print(f"Anchors total:     {total_anchors}")
    print(f"Already done:      {already_done}")
    print(f"Skipped (empty):   {skipped_empty}")
    print(f"To process:        {len(all_tasks)}")
    print(f"Estimated cost:    ${len(all_tasks) * 0.0086:.2f}")
    print(f"Estimated time:    {len(all_tasks) * 97 // 60} min")
    print()

    if not all_tasks:
        print("✓ All cards already generated!")
        sys.exit(0)

    if args.dry_run:
        print("DRY RUN — not calling API")
        sys.exit(0)

    # ─── Apply session limit ───
    tasks_this_session = all_tasks
    if args.limit and args.limit < len(all_tasks):
        tasks_this_session = all_tasks[:args.limit]
        print(f"Session limit: {args.limit} cards")
        print(f"Remaining after session: {len(all_tasks) - args.limit}")
        print()

    # ─── Group by point (to load article once) ───
    by_point = defaultdict(list)
    for t in tasks_this_session:
        by_point[t['pid']].append(t)

    # ─── Process ───
    start = time.time()
    total_done = 0
    total_cost = 0.0
    total_words = 0
    consecutive_errors = 0
    failed = []
    stop_reason = None

    try:
        for pid, tasks in by_point.items():
            # Load article once per point
            article_folder = articles_dir / pid.replace('.', '_')
            full_article = "(няма статия)"
            if article_folder.exists():
                deep = article_folder / 'deep.md'
                if deep.exists():
                    content = deep.read_text(encoding='utf-8')
                    if '---' in content[:200]:
                        parts = content.split('---', 2)
                        if len(parts) >= 3:
                            content = parts[2]
                    full_article = content.strip()[:12000]

            info = chunker.steps_info.get(pid, {})
            point_title = info.get('title', '?')

            for task in tasks:
                idx = task['idx']
                p = task['p']
                out_file = task['out_file']

                # Build prompt
                user = PROMPT.format(
                    point_id=pid,
                    point_title=point_title,
                    full_article=full_article,
                    statement=(p.get('statement') or '')[:3000],
                    solution=(p.get('solution') or '')[:3500],
                    difficulty=p.get('difficulty', '?'),
                )

                # Progress line
                num = total_done + 1
                print(f"[{num}/{len(tasks_this_session)}] {pid}/task{idx+1}",
                      end=' ', flush=True)

                t0 = time.time()
                try:
                    raw = gpt.call(PROMPT, user, f"card-{pid}-{idx}",
                                   force_json=False)
                except pdf_chunker.BudgetExhausted as e:
                    print(f"\n\n⚠ BUDGET EXHAUSTED: {e}")
                    print("Progress saved. Run again after limit resets.")
                    stop_reason = "budget"
                    break
                except Exception as e:
                    print(f"✗ {type(e).__name__}: {str(e)[:80]}")
                    consecutive_errors += 1
                    failed.append((pid, idx, str(e)[:80]))
                    if consecutive_errors >= 5:
                        print("\n⚠ 5 consecutive errors — stopping")
                        stop_reason = "errors"
                        break
                    time.sleep(10)
                    continue

                dur = int(time.time() - t0)

                # Validate
                if not raw or not raw.strip():
                    print(f"✗ empty ({dur}s)")
                    consecutive_errors += 1
                    failed.append((pid, idx, "empty response"))
                    continue

                if not raw.strip().startswith('#'):
                    print(f"✗ not markdown ({dur}s)")
                    consecutive_errors += 1
                    failed.append((pid, idx, "not markdown"))
                    continue

                # Save atomically
                out_file.parent.mkdir(exist_ok=True, parents=True)
                tmp = out_file.with_suffix('.tmp')
                header = f"# {pid} / Задача {idx+1} — {point_title}\n\n"
                header += f"**Трудност:** {p.get('difficulty', '?')}  \n"
                header += f"**Година:** {p.get('year', '?')}  \n"
                header += f"**Клас:** {p.get('grade', '?')}  \n\n---\n\n"
                tmp.write_text(header + raw, encoding='utf-8')
                tmp.replace(out_file)

                wc = len(raw.split())
                total_done += 1
                total_cost += 0.0086
                total_words += wc
                consecutive_errors = 0

                print(f"✓ {wc}w {dur}s")

                # Checkpoint every 20
                if total_done % 20 == 0:
                    elapsed = time.time() - start
                    avg_sec = elapsed / total_done
                    remaining = len(tasks_this_session) - total_done
                    eta_min = remaining * avg_sec / 60
                    print(f"\n{'─'*78}")
                    print(f"CHECKPOINT: {total_done}/{len(tasks_this_session)} done")
                    print(f"Elapsed: {int(elapsed/60)}min | ETA: {int(eta_min)}min")
                    print(f"Cost: ~${total_cost:.2f} | Avg: {avg_sec:.0f}s/card")
                    print(f"{'─'*78}\n")

                # Sleep between calls
                if args.sleep > 0 and task != tasks[-1]:
                    time.sleep(args.sleep)

            if stop_reason:
                break

    except KeyboardInterrupt:
        print("\n\n⚠ Interrupted by user (Ctrl+C)")
        stop_reason = "interrupted"

    # ─── Final summary ───
    elapsed = time.time() - start
    print()
    print(f"{'='*78}")
    print(f"SESSION COMPLETE")
    print(f"{'='*78}")
    print(f"Stop reason:        {stop_reason or 'finished normally'}")
    print(f"Generated:          {total_done}/{len(tasks_this_session)}")
    if total_done:
        print(f"Avg words:          {total_words // total_done}")
    print(f"Time:               {int(elapsed/60)}min {int(elapsed%60)}s")
    print(f"Cost:               ~${total_cost:.2f}")
    print(f"Failed:             {len(failed)}")

    if failed:
        print(f"\nFailed tasks (first 20):")
        for pid, idx, err in failed[:20]:
            print(f"  {pid}/task{idx+1}: {err}")

    # Overall progress
    total_generated_all = sum(1 for _ in out_dir.rglob('p*.md'))
    print()
    print(f"OVERALL: {total_generated_all} cards generated")
    print(f"Remaining: {len(all_tasks) - total_done}")
    if len(all_tasks) > total_done:
        print(f"\nRun again to continue:  .\\py.bat _rollout_insights.py")

    # Save failures to file
    if failed:
        fail_file = out_dir / '_failed_tasks.json'
        try:
            existing = json.loads(fail_file.read_text(encoding='utf-8')) if fail_file.exists() else []
            existing.extend([{'pid': p, 'idx': i, 'error': e} for p, i, e in failed])
            fail_file.write_text(json.dumps(existing, ensure_ascii=False, indent=2),
                                 encoding='utf-8')
            print(f"Failed tasks logged to: {fail_file}")
        except Exception:
            pass


if __name__ == "__main__":
    main()
