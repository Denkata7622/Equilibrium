#!/usr/bin/env bash
set -euo pipefail

# Locate py.bat (repo root or ./pipeline)
PY=""
for p in ./pipeline/py.bat ./py.bat; do
  [ -f "$p" ] && PY="$p" && break
done
if [ -z "$PY" ]; then echo "ERROR: py.bat not found in ./pipeline/ or ./" >&2; exit 1; fi
echo "Using Python wrapper: $PY"

# Stage list: staged + unstaged + untracked
{
  git diff --name-only
  git diff --cached --name-only
  git ls-files --others --exclude-standard
} | sort -u \
  | cut -d/ -f1 \
  | sort -u \
  | while read -r top; do
      [ -e "$top" ] || continue
      git add -- "$top"
      git diff --cached --quiet && continue
      "$PY" commit_msg.py --commit
    done
