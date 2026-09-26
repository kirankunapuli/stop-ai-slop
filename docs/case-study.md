# Case study: three real agent pull requests

Most skills ship on claims. This is a measurement of the skill on code it did not influence: merged pull requests written by GitHub's Copilot coding agent in other people's repositories.

Repositories and authors are not named. The goal is to measure the skill, not to review anyone's work.

## Method

1. Three merged, Copilot-authored pull requests, chosen for real code rather than docs: a TypeScript type and lint cleanup, a Rust CLI change, and a C# signature-validation change.
2. Detect mode only, `claude-haiku-4-5-20251001`, with `SKILL.md` as the system prompt and the `gh pr diff` output as the user prompt.
3. Every finding read against the actual diff. A finding counts as correct only when the code shown supports it.

## Results

| Pull request | Findings, first prompt | Correct | Findings, strict prompt | Correct |
|---|--:|--:|--:|--:|
| TypeScript type and lint cleanup | 5 | 1 | 3 | 1 |
| Rust CLI map key change | 5 | 0 | 3 | 0 |
| C# signature validation | 3 | 0 | 0 (NO_SLOP) | 0 |

## What it got wrong

The failure mode is consistent: **the skill treats runtime validation of parsed data as defensive bloat.**

The TypeScript pull request added `isRecord` checks around `JSON.parse` output. The skill reported those as bloat four times. They are not. `JSON.parse` returns `any`, and the data came from a file on disk. That is a trust boundary, and the skill's own rules say to leave boundary validation alone. The model read the rule and applied the opposite.

The second failure mode: **speculative findings.** The Rust pull request produced lines like "verify the key type matches usage" and "confirm the equality and hashing behavior". These are questions, not defects. One went further and claimed the code would not compile, which the type system would have caught long before review.

The third: **the model can argue itself into a false positive and then a true negative in the same response.** On the C# pull request it produced a long internal retrace, concluded its own finding was wrong, and on the next run with a stricter prompt returned `NO_SLOP` for the whole diff. Correct output, arrived at by accident.

## What changed

Two edits, both shipped in this repo.

1. `SKILL.md` now states that runtime checks on data crossing a trust boundary are not bloat, and names the boundaries: file contents, network responses, `JSON.parse` output, environment variables, CLI arguments, request bodies.
2. The action prompt is stricter. It asks for at most five findings, forbids questions and `verify` or `confirm` phrasing, and requires a defect that can be pointed at in the diff. If there is none, it must answer `NO_SLOP`.

Result of the strict prompt: the C# pull request went from three wrong findings to `NO_SLOP`. The other two dropped from five findings to three, still mostly wrong.

## Honest conclusion

The skill is strong on the code it was built and measured against, and weak on real refactor and type-only pull requests. Two of three real pull requests produced more wrong findings than right ones.

A skill that reports wrong findings on clean-looking code gets turned off, and then the real ones stop being seen. That is the risk that matters, and this study shows it is live.

The next fixture to add is not another sloppy file. It is a real refactor pull request with zero expected findings, so the harness measures this failure directly instead of leaving it to a case study.
