#!/usr/bin/env python3
"""
extract_js_modules.py — извлича inline JS от стария index.html
и го разбива на ES модули под js/.

Usage:
    python extract_js_modules.py old_index.html
    python extract_js_modules.py old_index.html --skip-existing
"""
import re
import sys
from pathlib import Path

# name → път (относително към js/)
MAPPING = {
    'CONFIG':       'core/config.js',
    'Utils':        'core/utils.js',
    'State':        'core/utils.js',
    'Store':        'core/store.js',
    'LEVELS':       'data/levels.js',
    'PLAN_DAYS':    'data/levels.js',
    'ACHIEVEMENTS': 'data/achievements.js',
    'PREREQS':      'data/prereqs.js',
    'EXTRA_TASKS':  'data/extra-tasks.js',
    'Theme':        'ui/theme.js',
    'FontSize':     'ui/theme.js',
    'MathRender':   'ui/math.js',
    'Stats':        'ui/stats.js',
    'UI':           'ui/ui.js',
    'Tabs':         'ui/ui.js',
    'Events':       'ui/events.js',
    'Sidebar':      'ui/sidebar.js',
    'Content':      'ui/content.js',
    'ModeSwitcher': 'ui/content.js',
    'PointActions': 'ui/point-actions.js',
    'Modal':        'ui/modal.js',
    'DeepDive':     'ui/deepdive.js',
    'Pomodoro':     'features/pomodoro.js',
    'Palette':      'features/palette.js',
    'Help':         'features/palette.js',
    'SearchHistory':'features/palette.js',
    'Quiz':         'features/quiz.js',
    'Achievements': 'features/achievements.js',
    'Formulas':     'features/formulas.js',
    'ProblemLog':   'features/problem-log.js',
    'Report':       'features/report.js',
    'Bookmarks':    'features/bookmarks.js',
    'Scratchpad':   'features/scratchpad.js',
    'ExamSim':      'features/exam-sim.js',
    'SpacedRep':    'features/spaced-rep.js',
    'Keys':         'features/keys.js',
    'Plan':         'features/plan.js',
    'Library':      'features/library.js',
    'Tools':        'features/tools.js',
    'StatsModal':   'features/stats-modal.js',
    'Videos':       'features/videos.js',
    'Today':        'features/today.js',
    'Goal':         'features/today.js',
    'Calendar':     'features/today.js',
    'FormulaOfDay': 'features/today.js',
    'Recent':       'features/today.js',
    'Random':       'features/today.js',
    'Focus':        'features/today.js',
    'ExportNotes':  'features/export-notes.js',
    'History':      'features/history.js',
    'FirstHint':    'features/first-hint.js',
    'TimeTracker':  'features/time-tracker.js',
    'PageState':    'features/page-state.js',
    'Versions':     'features/versions.js',
}

HELPERS = ['getPoint', 'getFlatPoints', 'matchFilter', 'matchSearch']
HELPERS_FILE = 'ui/helpers.js'

# Универсални imports — работят от всеки файл в js/{core,data,ui,features}/
# защото `../` от всяка поддиректория връща в js/, откъдето всички пътища са валидни.
ALL_IMPORTS = """import { CONFIG } from '../core/config.js';
import { Utils, State } from '../core/utils.js';
import { Store } from '../core/store.js';
import { LEVELS, PLAN_DAYS } from '../data/levels.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { PREREQS } from '../data/prereqs.js';
import { Theme, FontSize } from '../ui/theme.js';
import { MathRender } from '../ui/math.js';
import { Stats } from '../ui/stats.js';
import { UI, Tabs } from '../ui/ui.js';
import { Events } from '../ui/events.js';
import { getPoint, getFlatPoints, matchFilter, matchSearch } from '../ui/helpers.js';
import { Sidebar } from '../ui/sidebar.js';
import { Content, ModeSwitcher } from '../ui/content.js';
import { PointActions } from '../ui/point-actions.js';
import { Modal } from '../ui/modal.js';
import { DeepDive } from '../ui/deepdive.js';
import { Pomodoro } from '../features/pomodoro.js';
import { Palette, Help, SearchHistory } from '../features/palette.js';
import { Quiz } from '../features/quiz.js';
import { Achievements } from '../features/achievements.js';
import { Formulas } from '../features/formulas.js';
import { ProblemLog } from '../features/problem-log.js';
import { Report } from '../features/report.js';
import { Bookmarks } from '../features/bookmarks.js';
import { Scratchpad } from '../features/scratchpad.js';
import { ExamSim } from '../features/exam-sim.js';
import { SpacedRep } from '../features/spaced-rep.js';
import { Keys } from '../features/keys.js';
import { Plan } from '../features/plan.js';
import { Library } from '../features/library.js';
import { Tools } from '../features/tools.js';
import { StatsModal } from '../features/stats-modal.js';
import { Videos } from '../features/videos.js';
import { Today, Goal, Calendar, FormulaOfDay, Recent, Random, Focus } from '../features/today.js';
import { ExportNotes } from '../features/export-notes.js';
import { History } from '../features/history.js';
import { FirstHint } from '../features/first-hint.js';
import { TimeTracker } from '../features/time-tracker.js';
import { PageState } from '../features/page-state.js';
import { Versions } from '../features/versions.js';
import { ArticleLoader } from '../features/article-loader.js';
"""


def find_block(src: str, name: str):
    """Extract `const NAME = ...` or `function NAME() {...}` verbatim."""
    m = re.search(rf'\b(?:const|let|var)\s+{re.escape(name)}\s*=\s*', src)
    if m:
        i = m.end()
        if i >= len(src):
            return None
        opener = src[i]
        if opener in '{[':
            closer = '}' if opener == '{' else ']'
            depth = 1
            j = i + 1
            in_str = False
            quote = None
            escape = False
            while j < len(src) and depth > 0:
                c = src[j]
                if escape:
                    escape = False
                    j += 1
                    continue
                if in_str:
                    if c == '\\':
                        escape = True
                    elif c == quote:
                        in_str = False
                    j += 1
                    continue
                if c in ('"', "'", '`'):
                    in_str = True
                    quote = c
                    j += 1
                    continue
                if c == opener:
                    depth += 1
                elif c == closer:
                    depth -= 1
                j += 1
            if depth == 0:
                return src[m.start():j]
        end = src.find(';', i)
        if end != -1:
            return src[m.start():end + 1]

    m = re.search(rf'\bfunction\s+{re.escape(name)}\s*\(', src)
    if m:
        brace = src.find('{', m.end())
        if brace == -1:
            return None
        depth = 1
        j = brace + 1
        in_str = False
        quote = None
        escape = False
        while j < len(src) and depth > 0:
            c = src[j]
            if escape:
                escape = False
                j += 1
                continue
            if in_str:
                if c == '\\':
                    escape = True
                elif c == quote:
                    in_str = False
                j += 1
                continue
            if c in ('"', "'", '`'):
                in_str = True
                quote = c
                j += 1
                continue
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
            j += 1
        return src[m.start():j]
    return None


def add_export(block: str, name: str) -> str:
    block = re.sub(
        rf'^(?:const|let|var)\s+{re.escape(name)}\b',
        f'export const {name}', block, count=1, flags=re.MULTILINE)
    block = re.sub(
        rf'^function\s+{re.escape(name)}\b',
        f'export function {name}', block, count=1, flags=re.MULTILINE)
    return block


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_js_modules.py old_index.html [--skip-existing]")
        sys.exit(1)
    html_path = Path(sys.argv[1])
    skip_existing = '--skip-existing' in sys.argv
    html = html_path.read_text(encoding='utf-8')

    pattern = re.compile(r'<script\b(?![^>]*\bsrc=)[^>]*>(.*?)</script>', re.DOTALL)
    js = ''
    for m in pattern.finditer(html):
        if len(m.group(1)) > len(js):
            js = m.group(1)
    print(f"Inline JS: {len(js)} chars")

    js_root = Path('js')
    written = 0

    for name, rel_target in MAPPING.items():
        target = js_root / rel_target
        if skip_existing and target.exists():
            print(f"  ⊘ skip {rel_target} (exists)")
            continue
        block = find_block(js, name)
        if not block:
            print(f"  ⚠ {name} not found")
            continue
        block = add_export(block, name)
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            existing = target.read_text(encoding='utf-8')
            target.write_text(existing + '\n\n' + block, encoding='utf-8')
        else:
            header = f'// Auto-extracted from old index.html\n{ALL_IMPORTS}\n'
            target.write_text(header + block, encoding='utf-8')
        print(f"  ✓ {rel_target} ← {name}")
        written += 1

    # Helpers
    helpers_target = js_root / HELPERS_FILE
    if not (skip_existing and helpers_target.exists()):
        parts = []
        for h in HELPERS:
            b = find_block(js, h)
            if b:
                parts.append(add_export(b, h))
        if parts:
            helpers_target.parent.mkdir(parents=True, exist_ok=True)
            header = '// Auto-extracted helpers\n'
            helpers_target.write_text(header + '\n\n'.join(parts), encoding='utf-8')
            print(f"  ✓ {HELPERS_FILE} ({len(parts)} helpers)")
            written += 1

    # Extra tasks IIFE
    tasks_target = js_root / 'data/extra-tasks.js'
    if not (skip_existing and tasks_target.exists()):
        m = re.search(r'\(function\s+expandTasks\s*\(\s*\)\s*\{.*?\}\)\(\);', js, re.DOTALL)
        if m:
            tasks_target.parent.mkdir(parents=True, exist_ok=True)
            header = '// Expands STEPS with EXTRA_TASKS (STEPS is global from data/steps.js)\n'
            tasks_target.write_text(header + m.group(0), encoding='utf-8')
            print(f"  ✓ data/extra-tasks.js (IIFE)")

    print(f"\n✅ Total: {written} files written")


if __name__ == '__main__':
    main()