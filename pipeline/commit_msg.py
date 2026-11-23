#!/usr/bin/env python3
"""Generate a Conventional Commits message for the staged diff via Hack Club AI."""
import os, re, sys, time, subprocess, requests

API_URL = os.environ.get("HACKCLUB_API_URL",
                         "https://ai.hackclub.com/proxy/v1/chat/completions")
API_KEY = os.environ["HACKCLUB_API_KEY"]          # never hardcode
MODEL   = os.environ.get("COMMIT_MODEL", "openai/gpt-6.1-sol")
MAX_DIFF_CHARS  = int(os.environ.get("COMMIT_MAX_CHARS", "14000"))
MAX_PATCH_SAMPLE = 2000

VALID_TYPES = ("feat|fix|docs|style|refactor|test|build|chore|data|perf|ci")

def git(*args: str) -> str:
    return subprocess.check_output(["git", *args],
                                   stderr=subprocess.DEVNULL).decode("utf-8", "replace")

def staged() -> tuple[str, str]:
    stat  = git("diff", "--cached", "--stat")
    patch = git("diff", "--cached", "--no-color", "--no-ext-diff")
    if not stat.strip() and not patch.strip():
        sys.exit("nothing staged (did you forget `git add`?)")
    return stat, patch

def build_input(stat: str, patch: str) -> str:
    if len(patch) <= MAX_DIFF_CHARS:
        return f"{stat}\n{patch}"
    # Too big: keep the stat (full file list) + a head sample
    return (f"{stat}\n"
            f"[diff truncated from {len(patch)} to {MAX_PATCH_SAMPLE} chars]\n"
            f"{patch[:MAX_PATCH_SAMPLE]}")

def clean(msg: str) -> str:
    msg = re.sub(r"^```[a-zA-Z]*\s*\n?", "", msg)
    msg = re.sub(r"\n?```\s*$", "", msg)
    return msg.strip()

def generate(diff: str) -> str:
    prompt = (
        "Write ONE Conventional Commits message for the staged diff.\n"
        "Format: type(scope): imperative subject <= 72 chars\n"
        "If the change warrants it, add a blank line + 2-3 bullet body "
        "explaining WHAT and WHY. Skip the body for trivial changes.\n"
        f"Allowed types: {VALID_TYPES}.\n"
        "Scope = top-level directory or module name.\n"
        "Return only the message, no prose, no code fences.\n\n"
        f"DIFF:\n{diff}"
    )
    for attempt in range(5):
        r = requests.post(API_URL,
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={"model": MODEL,
                  "messages": [{"role": "user", "content": prompt}],
                  "temperature": 0.2, "max_tokens": 600},
            timeout=90)
        if r.status_code == 429 or 500 <= r.status_code < 600:
            wait = 2 ** attempt
            print(f"[retry {attempt+1}] HTTP {r.status_code}, sleeping {wait}s",
                  file=sys.stderr)
            time.sleep(wait); continue
        r.raise_for_status()
        return clean(r.json()["choices"][0]["message"]["content"])
    sys.exit("API failed after retries")

def validate(msg: str) -> bool:
    return bool(re.match(rf"^({VALID_TYPES})(\([^)]+\))?: \S", msg))

if __name__ == "__main__":
    commit = "--commit" in sys.argv
    stat, patch = staged()
    msg = generate(build_input(stat, patch))
    if not validate(msg):
        print(f"warning: not Conventional Commits:\n{msg}", file=sys.stderr)
    if commit:
        subprocess.check_call(["git", "commit", "-m", msg])
        print(f"✓ {msg.splitlines()[0]}")
    else:
        print(msg)