#!/usr/bin/env python3
import os, re, sys, time, subprocess, requests

API_URL = os.environ.get("HACKCLUB_API_URL",
                         "https://ai.hackclub.com/proxy/v1/chat/completions")
API_KEY = os.environ["HACKCLUB_API_KEY"]
MODEL   = os.environ.get("COMMIT_MODEL", "openai/gpt-6.1-sol")
MAX_DIFF_CHARS   = int(os.environ.get("COMMIT_MAX_CHARS", "14000"))
MAX_PATCH_SAMPLE = 2000
VALID_TYPES = ("feat|fix|docs|style|refactor|test|build|chore|data|perf|ci")

def git(*args):
    return subprocess.check_output(["git", *args], stderr=subprocess.DEVNULL).decode("utf-8", "replace")

def staged():
    stat  = git("diff", "--cached", "--stat")
    patch = git("diff", "--cached", "--no-color", "--no-ext-diff")
    if not stat.strip() and not patch.strip():
        sys.exit("nothing staged")
    return stat, patch

def build_input(stat, patch):
    if len(patch) <= MAX_DIFF_CHARS:
        return stat + "\n" + patch
    return (stat + "\n[diff truncated from " + str(len(patch)) + " to " + str(MAX_PATCH_SAMPLE) + " chars]\n" + patch[:MAX_PATCH_SAMPLE])

def clean(msg):
    msg = re.sub(r"^```[a-zA-Z]*\s*\n?", "", msg)
    msg = re.sub(r"\n?```\s*$", "", msg)
    return msg.strip()

def generate(diff):
    prompt = (
        "Write ONE Conventional Commits message for the staged diff.\n"
        "Format: type(scope): imperative subject <= 72 chars\n"
        "If warranted, add a blank line + 2-3 bullet body explaining WHAT and WHY.\n"
        "Allowed types: " + VALID_TYPES + ".\n"
        "Scope = top-level directory or module name.\n"
        "Return only the message, no prose, no code fences.\n\n"
        "DIFF:\n" + diff
    )
    for attempt in range(5):
        r = requests.post(API_URL,
            headers={"Authorization": "Bearer " + API_KEY},
            json={"model": MODEL,
                  "messages": [{"role": "user", "content": prompt}],
                  "temperature": 0.2, "max_tokens": 600},
            timeout=90)
        if r.status_code == 429 or 500 <= r.status_code < 600:
            wait = 2 ** attempt
            print("[retry " + str(attempt+1) + "] HTTP " + str(r.status_code) + ", sleeping " + str(wait) + "s", file=sys.stderr)
            time.sleep(wait); continue
        r.raise_for_status()
        return clean(r.json()["choices"][0]["message"]["content"])
    sys.exit("API failed after retries")

def validate(msg):
    return bool(re.match(r"^(" + VALID_TYPES + r")(\([^)]+\))?: \S", msg))

if __name__ == "__main__":
    commit = "--commit" in sys.argv
    stat, patch = staged()
    msg = generate(build_input(stat, patch))
    if not validate(msg):
        print("warning: not Conventional Commits:\n" + msg, file=sys.stderr)
    if commit:
        subprocess.check_call(["git", "commit", "-m", msg])
        print("OK " + msg.splitlines()[0])
    else:
        print(msg)
