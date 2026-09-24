#!/usr/bin/env bash
# Replay a captured run for the demo recording. Written by demo/record.sh.
set -euo pipefail

cd "$(dirname "$0")/.."
trap 'printf "\n=== stop-ai-slop demo complete ===\n"' EXIT

while IFS= read -r line; do
  printf '%s\n' "$line"
  sleep 0.08
done < demo/transcript.txt
