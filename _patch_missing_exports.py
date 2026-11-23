#!/usr/bin/env python3
"""
patch_missing_exports.py — добавя липсващите exports в js/ модули
и създава versions.js. Изпълнява се след extract_js_modules.py.

Usage:
    python patch_missing_exports.py old_index.html
"""
import re
import sys
from pathlib import Path

MAPPING = {
    'PLAN_DAYS':     'js/data/levels.js',
    'FontSize':      'js/ui/theme.js',
    'Tabs':          'js/ui/ui.js',
    'ModeSwitcher':  'js/ui/content.js',
    'Help':          'js/features/palette.js',
    'SearchHistory': 'js/features/palette.js',
    'Goal':          'js/features/today.js',
    'Calendar':      'js/features/today.js',
    'FormulaOfDay':  'js/features/today.js',
    'Recent':        'js/features/today.js',
    'Random':        'js/features/today.js',
    'Focus':         'js/features/today.js',
}


def find_block(src, name):
    m = re.search(rf'\b(?:const|let|var)\s+{re.escape(name)}\s*=\s*', src)
    if m:
        i = m.end()
        opener = src[i]
        if opener in '{[':
            closer = '}' if opener == '{' else ']'
            depth = 1
            j = i + 1
            in_str, quote, escape = False, None, False
            while j < len(src) and depth > 0:
                c = src[j]
                if escape: escape = False; j += 1; continue
                if in_str:
                    if c == '\\': escape = True
                    elif c == quote: in_str = False
                    j += 1; continue
                if c in ('"', "'", '`'): in_str = True; quote = c; j += 1; continue
                if c == opener: depth += 1
                elif c == closer: depth -= 1
                j += 1
            if depth == 0:
                return src[m.start():j]
        end = src.find(';', i)
        if end != -1:
            return src[m.start():end + 1]

    m = re.search(rf'\bfunction\s+{re.escape(name)}\s*\(', src)
    if m:
        brace = src.find('{', m.end())
        if brace == -1: return None
        depth = 1
        j = brace + 1
        in_str, quote, escape = False, None, False
        while j < len(src) and depth > 0:
            c = src[j]
            if escape: escape = False; j += 1; continue
            if in_str:
                if c == '\\': escape = True
                elif c == quote: in_str = False
                j += 1; continue
            if c in ('"', "'", '`'): in_str = True; quote = c; j += 1; continue
            if c == '{': depth += 1
            elif c == '}': depth -= 1
            j += 1
        return src[m.start():j]
    return None


def add_export(block, name):
    block = re.sub(rf'^(?:const|let|var)\s+{name}\b',
                   f'export const {name}', block, count=1, flags=re.MULTILINE)
    block = re.sub(rf'^function\s+{name}\b',
                   f'export function {name}', block, count=1, flags=re.MULTILINE)
    return block


def main():
    if len(sys.argv) < 2:
        print("Usage: python patch_missing_exports.py old_index.html")
        sys.exit(1)
    js = ''
    html = Path(sys.argv[1]).read_text(encoding='utf-8')
    for m in re.finditer(r'<script\b(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.DOTALL):
        if len(m.group(1)) > len(js):
            js = m.group(1)
    print(f"Inline JS: {len(js)} chars\n")

    # ── 1. Append missing exports ──
    for name, target_path in MAPPING.items():
        target = Path(target_path)
        if not target.exists():
            print(f"  ⚠ {target_path} missing — skipping {name}")
            continue
        existing = target.read_text(encoding='utf-8')
        if re.search(rf'\bexport\s+(const|function|let|var)\s+{name}\b', existing):
            print(f"  ⊘ {name} already exported in {target_path}")
            continue
        block = find_block(js, name)
        if not block:
            print(f"  ⚠ {name} not in old_index.html")
            continue
        block = add_export(block, name)
        target.write_text(existing.rstrip() + '\n\n' + block + '\n', encoding='utf-8')
        print(f"  ✓ appended {name} → {target_path}")

    # ── 2. Append IIFE to extra-tasks.js ──
    tasks_path = Path('js/data/extra-tasks.js')
    if tasks_path.exists():
        content = tasks_path.read_text(encoding='utf-8')
        if 'expandTasks' not in content:
            m = re.search(r'\(function\s+expandTasks\s*\(\s*\)\s*\{.*?\}\)\(\);',
                          js, re.DOTALL)
            if m:
                tasks_path.write_text(content.rstrip() + '\n\n' + m.group(0) + '\n',
                                      encoding='utf-8')
                print(f"  ✓ appended expandTasks IIFE → js/data/extra-tasks.js")
            else:
                print(f"  ⚠ expandTasks IIFE not in old_index.html")
        else:
            print(f"  ⊘ expandTasks IIFE already in extra-tasks.js")

    # ── 3. Create versions.js ──
    versions_path = Path('js/features/versions.js')
    if not versions_path.exists():
        versions_path.parent.mkdir(parents=True, exist_ok=True)
        versions_path.write_text("""// Versions — sync fallback за versions UI.
// Основният път е ArticleLoader (async fetch от article.json).
// Този модул се ползва само ако bundle липсва.

import { Utils } from '../core/utils.js';

export const Versions = {
  render(versions, fallbackContent, cssClass = '', processor = (s) => Utils.escapeHtml(s)) {
    if (!versions || !versions.length) {
      return `<div class="version-content active ${cssClass}">${processor(fallbackContent || '')}</div>`;
    }
    const sorted = [...versions].sort((a, b) => a.v - b.v);
    const latest = sorted[sorted.length - 1].v;
    const btns = sorted.map(v =>
      `<button class="ver-btn${v.v === latest ? ' active' : ''}" data-version="${v.v}">v${v.v}</button>`
    ).join('');
    const panes = sorted.map(v =>
      `<div class="version-content${v.v === latest ? ' active' : ''} ${cssClass}" data-version="${v.v}">${processor(v.content || '')}</div>`
    ).join('');
    return `<div class="versions">${btns}</div>${panes}`;
  },

  install() {
    console.warn('[Versions.install] deprecated — ArticleLoader.install() покрива това');
  },
};
""", encoding='utf-8')
        print(f"  ✓ created js/features/versions.js")
    else:
        print(f"  ⊘ js/features/versions.js already exists")

    print("\n✅ Done. Reload http://localhost:8000 and check console.")


if __name__ == '__main__':
    main()