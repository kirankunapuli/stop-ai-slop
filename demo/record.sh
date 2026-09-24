#!/usr/bin/env bash
# One command to (re)build demo/demo.gif.
# Installs missing tools, captures a real run, records it with VHS, converts with gifski.
set -euo pipefail

cd "$(dirname "$0")/.."

export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

command -v vhs >/dev/null || { echo "installing vhs..."; brew install vhs; }
command -v gifski >/dev/null || { echo "installing gifski..."; brew install gifski; }
fc-list 2>/dev/null | grep -qi "JetBrains Mono" || { echo "installing JetBrains Mono..."; brew install --cask font-jetbrains-mono; }

if [[ ! -s demo/transcript.txt || "${DEMO_REFRESH:-0}" == "1" ]]; then
  echo "capturing a real run with ${DEMO_AGENT:-claude}..."
  DEMO_QUIET=1 ./demo/run.sh 2>&1 | grep -v 'stop-ai-slop demo complete' > demo/transcript.txt
fi

chmod +x demo/replay.sh
vhs demo/demo.tape
gifski --fps 12 --width 900 --quality 82 --lossy-quality 40 -o demo/demo.gif demo/demo.mp4
rm -f demo/demo.mp4

echo "wrote demo/demo.gif ($(du -h demo/demo.gif | cut -f1))"
