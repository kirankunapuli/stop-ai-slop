# Evaluation

Most skills ship on claims. This one ships a small, reproducible benchmark, because a skill is only as good as what it catches and what it invents.

## Run it

```bash
node evals/run.mjs        # openai + gpt-6-luna by default, reads OPENAI_API_KEY

# any provider the action supports
EVAL_PROVIDER=anthropic EVAL_MODEL=claude-haiku-4-5-20251001 EVAL_API_KEY=... node evals/run.mjs
EVAL_PROVIDER=ollama EVAL_MODEL=qwen2.5-coder:7b EVAL_API_KEY=ollama node evals/run.mjs

# inspect the fixtures without calling a model
node evals/run.mjs --dry
```

Env: `EVAL_PROVIDER` (default `openai`), `EVAL_MODEL` (default `gpt-6-luna`), `EVAL_BASE_URL`, `EVAL_API_KEY` (falls back to `OPENAI_API_KEY` then `ANTHROPIC_API_KEY`), `EVAL_MIN_F1` (default `0.75`).

Exit code is non-zero when F1 drops below the threshold, or when the skill reports any finding on a clean fixture. That second check is the one that matters most: a skill that invents problems is worse than one that misses a few.

## What it measures

Four fixtures are sloppy, two are clean. Labels live in `evals/expected.json`. Fixtures carry a `.txt` extension so linters and type checkers skip test data on purpose.

| Fixture | Labeled findings | Purpose |
|---|---|---|
| `code/invoice.py.txt` | 6 | Speculative abstraction, redundant comments, swallowed errors, generic naming, dead code, unverified network call |
| `code/parse.py.txt` | 4 | Money as float, string-built SQL, `shell=True`, naive datetime |
| `code/mixed.py.txt` | 4 | Off-by-one boundary, hallucinated API, reinvented clamp, test that cannot fail |
| `prose/commit-msg.txt` | 5 | Past-tense subject, filler, tool footer, narration, vague wording |
| `clean/format.py.txt` | 0 | False positives: any finding here is a miss |
| `refactor/guards.ts.txt` | 0 | Correct boundary validation. Guards the failure found in the case study |

The harness runs the same two passes as the action, imported from `scripts/prompt.mjs`: detect, then filter questions, guesses, and boundary-validation complaints. Labels match on word boundaries with common suffixes, so `comment` also matches `comments`.

The harness loads `SKILL.md` as the system prompt, asks the model to detect only, and matches each returned finding against the label keywords. A label counts as found when at least one line mentions it. Lines that match no label count as extra.

Output: recall, precision, and extra findings per fixture, then a summary.

## Baseline

Measured on the fixtures above, one run each:

| Model | Recall | Precision | F1 | Findings on clean | Verdict |
|---|---|---|---|---|---|
| `claude-haiku-4-5-20251001` | 0.89 (17/19) | 1.00 | 0.94 | 0 | Pass |

`gpt-6-luna` is the default. Its last measurement, on the earlier three-fixture set, was 1.00 recall and 0.91 precision.

The gate is F1 (`EVAL_MIN_F1`, default 0.75) plus zero findings on both clean fixtures. Recall varies a few points between runs even at temperature 0; precision did not.

Model, harness, and prompt all affect the result. Re-run after changing `SKILL.md`.

## Limitations

- **Keyword scoring is a floor, not a grade.** A correct finding phrased with different words can be scored as a miss, and a vague line that happens to contain a keyword can be scored as a hit. The fixtures are small on purpose; read the raw findings, not only the number.
- **One fixture per domain.** Three sloppy files and two clean files test the core, not the whole catalog. The `refactor/guards.ts.txt` fixture exists because the case study found the skill flagging correct boundary validation.
- **Single run per model.** Recall varies a few points between runs. Run it more than once before drawing conclusions.
- **Bias risk.** The fixtures were written alongside the catalog, so they share its vocabulary. Prefer adding fixtures from real code that predates the skill.

## Add a fixture

1. Put the file under `evals/fixtures/`.
2. Add its labels to `expected.json`. Each label has a `pattern` name and a `match` list of keywords, any of which counts as a hit.
3. Use `[]` for a clean fixture. Add one whenever you add a sloppy one.
4. Re-run and update the baseline table with the model name and date.
