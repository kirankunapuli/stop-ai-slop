# Demo recording

`demo/demo.gif` is generated. One command rebuilds it:

```bash
./demo/record.sh
```

The recorder installs missing tools (VHS, gifski, JetBrains Mono), captures a real run, records it with `demo/demo.tape` to `demo/demo.mp4`, then converts to GIF with [gifski](https://gif.ski) for sharp text at a small size.

## What the recording shows

`demo/run.sh` copies the slop-filled `demo/sloppy/invoice.py` and `demo/sloppy/commit-msg.txt` to `demo/work/`, asks the agent to apply the skill to both, then prints the fixed code, the fixed commit message, and the change stat. The demo shows the default fix mode, not report-only.

Try it live without recording:

```bash
./demo/run.sh
```

Override the agent:

```bash
DEMO_AGENT=codex ./demo/run.sh
DEMO_AGENT=opencode ./demo/run.sh
DEMO_AGENT=claude ./demo/run.sh
DEMO_AGENT=pi ./demo/run.sh
```

The recording uses `DEMO_QUIET=1`, which hides the agent's narration and prints the result and the diff. That keeps the GIF short.

## Re-recording

The recorder reuses `demo/transcript.txt` if it exists. Force a new model run after changing the skill:

```bash
DEMO_REFRESH=1 ./demo/record.sh
```

The output is non-deterministic because it comes from a live model. Re-record, then commit `demo/demo.gif`.
