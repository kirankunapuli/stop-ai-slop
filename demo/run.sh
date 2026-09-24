#!/usr/bin/env bash
# Run the stop-ai-slop skill against working copies of the demo files, then show the result.
# It fixes code (invoice.py) and prose (commit-msg.txt) in the same pass.
# Override the agent with DEMO_AGENT=codex|opencode|claude|pi.
# Set DEMO_QUIET=1 to hide the agent's narration and print only the result.
set -euo pipefail

cd "$(dirname "$0")/.."

export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
trap 'printf "\n=== stop-ai-slop demo complete ===\n"' EXIT

AGENT="${DEMO_AGENT:-claude}"
mkdir -p demo/work
cp demo/sloppy/invoice.py demo/work/invoice.py
cp demo/sloppy/commit-msg.txt demo/work/commit-msg.txt

PROMPT="Apply the stop-ai-slop skill to two files. Fix the code slop in demo/work/invoice.py in place. Rewrite demo/work/commit-msg.txt as a good commit message for that change. Do not touch any other file. Then stop."

run_agent() {
  case "$AGENT" in
    claude)   claude -p --permission-mode acceptEdits "$PROMPT" 2> >(grep -v 'unrecognized_model' >&2 || true) ;;
    codex)    codex exec "$PROMPT" ;;
    opencode) opencode run "$PROMPT" ;;
    pi)       pi -p "$PROMPT" ;;
    *)        echo "unknown DEMO_AGENT: $AGENT" >&2; exit 1 ;;
  esac
}

if [[ "${DEMO_QUIET:-0}" == "1" ]]; then
  run_agent >/dev/null 2>&1 || true
  printf 'stop-ai-slop applied to demo/work/invoice.py and demo/work/commit-msg.txt\n'
else
  run_agent || true
fi

printf '\n--- code: after ---\n'
cat demo/work/invoice.py

printf '\n--- prose: after ---\n'
cat demo/work/commit-msg.txt

printf '\n--- change ---\n'
git diff --no-index --stat demo/sloppy/invoice.py demo/work/invoice.py | tail -1 || true
