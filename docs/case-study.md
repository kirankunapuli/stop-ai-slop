# Case study: three real agent pull requests

Most skills ship on claims. This is a measurement of the skill on code it did not influence: merged pull requests written by GitHub's Copilot coding agent in other people's repositories.

Repositories and authors are not named. The goal is to measure the skill, not to review anyone's work.

## Method

1. Three merged, Copilot-authored pull requests, chosen for real code rather than docs: a TypeScript type and lint cleanup, a Rust CLI change, and a C# signature-validation change.
2. Detect mode only, `claude-haiku-4-5-20251001`, with `SKILL.md` as the system prompt and the `gh pr diff` output as the user prompt.
3. Every finding read against the actual diff. A finding counts as correct only when the code shown supports it.

## Results

| Pull request | First pass | After the fix |
|---|--:|--:|
| TypeScript type and lint cleanup | 5 findings, 1 correct | 3 findings, 1 correct |
| Rust CLI map key change | 5 findings, 0 correct | `NO_SLOP` |
| C# signature validation | 3 findings, 0 correct | `NO_SLOP` |
| **Total wrong findings** | **12** | **2** |

## What it got wrong

The failure mode is consistent: **the skill treats runtime validation of parsed data as defensive bloat.**

The TypeScript pull request added `isRecord` checks around `JSON.parse` output. The skill reported those as bloat four times. They are not. `JSON.parse` returns `any`, and the data came from a file on disk. That is a trust boundary, and the skill's own rules say to leave boundary validation alone. The model read the rule and applied the opposite.

The second failure mode: **speculative findings.** The Rust pull request produced lines like "verify the key type matches usage" and "confirm the equality and hashing behavior". These are questions, not defects. One went further and claimed the code would not compile, which the type system would have caught long before review.

## What was changed

Four changes, all in this repo.

1. **The diff was sent with no statement of intent.** The action now passes the pull request title and body, from the event payload, so the model knows what the change was for. Reviewing a diff without the requirement is guessing.
2. **A second pass filters the findings.** After detection, the same model runs once more with a narrow instruction: remove findings that are questions, guesses about code not shown, or complaints about runtime checks on data crossing a trust boundary. Nothing else is allowed to be dropped. Verifier output is then reduced to finding-shaped lines, so reasoning text never reaches the pull request comment.
3. **`SKILL.md` names the boundaries.** Runtime checks on file contents, network responses, `JSON.parse` output, environment variables, CLI arguments, and request bodies are stated as correct code, and the prompt repeats it.
4. **The eval and the action now share one prompt.** They had drifted apart, which is why a 1.00 recall number described a prompt the action did not use. `scripts/prompt.mjs` is the single source for both.

A new fixture guards the failure: `evals/fixtures/refactor/guards.ts` is correct boundary-validation code with an expected finding count of zero.

## Result after the fix

Same three pull requests, same model, same detect-only behaviour.

| Metric | Before | After |
|---|--:|--:|
| Wrong findings on the three PRs | 12 | 2 |
| Pull requests correctly returned clean | 0 of 3 | 2 of 3 |
| Eval recall on labeled fixtures | 1.00 (14/14) | 0.86 (12/14) |
| Eval precision | 0.82 | 0.92 |
| Findings on the clean fixtures | 0 | 0 |

Recall moved down because the second pass removes some legitimate complaints about comments and naming. That is a deliberate trade: on real code the skill was wrong more often than right, and a reviewer who gets wrong findings turns the tool off.

## Honest conclusion

The skill is now usable on real agent pull requests instead of only on the code it was built against. It is not precise yet. Two wrong findings out of three on a type-and-lint cleanup is still too many for a review gate that fails the build.

The next fixture to add is another real refactor pull request with zero expected findings. Every time a wrong finding appears on real code, it becomes a fixture, and the harness keeps it from coming back.
