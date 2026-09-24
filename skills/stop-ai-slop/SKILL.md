---
name: stop-ai-slop
description: Detects and removes AI-generated slop from code and from the prose coding agents write, including commit messages, pull request descriptions, docs, changelogs, review comments, and replies. Finds speculative abstractions, redundant and stale comments, defensive bloat, generic naming, reinvented standard library code, dead code, hallucinated APIs and packages, plausible-but-wrong logic, weak tests, and filler prose. Preserves the codebase's existing conventions and the writer's voice. Use when writing, reviewing, refactoring, or auditing code, when the user says "de-slop", "stop ai slop", "clean up this AI code", or "make this not look AI-written", or when the user asks to tighten a commit message, pull request description, doc, or review.
---

# Stop AI Slop

Remove the patterns AI agents leave behind. Applies to code you write or review, and to text they generate: commit messages, pull request descriptions, docs, changelogs, review comments, and replies.

## Core test

Ask the YAGNI gate first: does this need to exist? If a feature, abstraction, flag, or line is not required, delete it. Cleaning up code that should not exist is wasted work.

Then: does every line earn its place? If deleting it changes nothing a user can observe and nothing a maintainer needs to know, delete it.

Slop is anything that exists to look thorough: padding, ceremony, and hedging that add surface area without behavior. It ships because it looks like quality.

Portability test: if a function, comment, or sentence could move unchanged into an unrelated project, it carries no information about this one. `processData`, `// Initialize the service`, and `Handles the request.` pass between any two repos.

Preserve the codebase's voice. Slop is also style mismatch: reformatted files, invented naming, a new error-handling religion, dependencies the project does not use. Match the surrounding code. Do not improve code you were not asked to touch.

## How it runs

Default: fix. Apply the minimum edit that removes the slop, scoped to the change under discussion, then report what changed. When auditing a whole repository or a large diff, report first and ask before editing many files.

Report only when asked, or in CI. If the user says "detect only", "just review", or "do not edit", list findings and change nothing. Findings are one line each, ordered by severity:

```text
path/to/file.py:42: <problem>. <fix>.
```

## Code slop

### Wrong or unverified behavior

Highest severity. Read these before style.

**Plausible but wrong logic.** Off-by-one errors, inverted conditions, wrong boundary (`>=` where `>` belongs), missing edge cases, handlers that look finished and return the wrong result. Fix: trace the actual inputs and boundaries. Run it. Compare against the requirement, not against what the code does.

**Hallucinated APIs and packages.** Methods, options, or parameters absent from the installed version. Imports from packages not in the manifest. Package names that look plausible but are wrong. USENIX Security 2025 found 19.7% of 2.23 million AI samples referenced a nonexistent package, and 43% of invented names recurred across runs: conflations (38%), near-miss typos (13%), pure inventions (51%). Fix: open the installed source and check the exact version. Confirm every dependency exists. If you cannot verify it, say so.

**Swallowed errors and silent fallbacks.** `try/except` that returns `None`, `{}`, or a default. Log-and-rethrow. Error strings that restate the exception. Fix: let errors propagate, or translate once at the boundary into a message that names what failed and what to do.

**Missing or weak trust-boundary checks.** No authorization on a new endpoint, validation only on the client, input trusted because it came from another internal service. Fix: validate and authorize once, at the boundary. Never remove these while de-slopping.

**Secrets and sensitive data.** Hardcoded keys, tokens, or passwords. Secrets written to logs or errors. Fix: read from the environment or a secret store, and redact before logging.

**Unguarded network behavior.** Retries that ignore `Retry-After` or run forever, hardcoded timeouts that miss the service SLA, calls with no timeout, missing rate-limit handling. Fix: bounded retries with backoff, a timeout, and explicit handling of the failure response.

**Non-idempotent retries and race conditions.** A retry that charges the card twice, a job that runs concurrently with itself, state read then written without a guard. Fix: make it idempotent, use an idempotency key, or take a lock. Check what happens when the same call runs twice.

**N+1 queries and unbounded result sets.** A loop querying once per item. A list endpoint with no pagination. A query that loads the whole table. Fix: eager-load, batch, add a limit, or stream. Test with a realistic row count.

### Structure that does not pay for itself

**Speculative abstraction.** An interface or abstract base with one implementation. A factory that builds one product. Config that never varies. A layer that only forwards calls. Fix: inline it and call the concrete thing. Add the seam when a second caller appears.

**Reinvented wheels.** A hand-rolled clone, parser, formatter, debounce, or UUID check. A new dependency for what the standard library or an installed package does. A helper that already exists a few files over. Fix: standard library, then native feature, then installed dependency, then an existing local helper. New code last.

**God functions and shotgun diffs.** One function that parses, validates, transforms, persists, and logs. A trivial change requiring edits in five files. A long `if/elif` ladder where every branch does the same shape of work. Fix: extract along real seams, or replace the ladder with a lookup table.

**Architecture and layer boundaries.** Data access in a view, a domain rule in the transport layer. The code works and ignores how this codebase is organised. Fix: move it to the layer that owns the responsibility, or match how neighbouring code does it.

### Naming and comments

**Generic naming.** `data`, `result`, `value`, `temp`, `output`, `info`, `obj`, `item`, `handle`, `process`, `manage`. Names that describe the type instead of the role. Fix: name the role and the unit. `pending_invoices`, not `data`.

**Redundant comments.** `// increment counter` above `counter++`. A docstring that restates the signature. `# ===== Imports =====` banners. Step comments narrating readable code. Fix: delete. Keep a comment only for a non-obvious why: a workaround, a spec quirk, a footgun, a link.

**Stale comments and docs.** A comment or doc that describes what the code used to do. Fix: update or delete. Wrong documentation is worse than none.

### Excess and noise

**Defensive bloat.** Null checks on values that cannot be null. Validation repeated at every internal layer. Fallbacks for states the type system rules out. `if not x: return` guards copied everywhere. Fix: validate once at the boundary. Let programming errors crash loudly.

**Dead weight.** Commented-out code, `TODO` graveyards, unused imports, params, and helpers, compatibility shims for callers that do not exist, feature flags stuck on. Fix: delete. Version control remembers it.

**Formatting noise.** Reformatting untouched code. Emoji in code, comments, or logs. Style that disagrees with the file. Blank-line padding no tool enforces. Fix: match the file, keep the diff reviewable.

### Tests

**Test slop.** No assertion, or only that a call did not throw. Assertions on a mock instead of behavior. Tautologies. Tests that mirror the implementation including its bugs, because they were written from the code rather than the requirement. Copy-pasted bodies. Fix: assert the required behavior at the edges. One assertion that would fail if the logic broke.

## Agent behavior

Slop in the agent's own work. Most damaging, because it makes the rest of the review unreliable.

**Task boundary violations.** Editing files outside the task, deleting code nobody asked to remove, reformatting unrelated modules. Fix: every changed file must serve the request. Flag anything else and revert it.

**Test tampering and reward hacking.** Editing an assertion, deleting or skipping a failing test, monkey-patching the runner, or hardcoding output so the suite goes green. A 2025 study of frontier models found reward hacking in 30.4% of engineering-task runs, including an agent that overrode an equality method so every check passed. Fix: never change a test to make it pass. If the requirement changed, update the test and say so. Keep test edits visible.

**False success reporting.** Saying tests pass when the run errored, claiming an edit landed where it did not, reporting success from an exit code without reading the output. Fix: quote the real output. If a step failed or did not run, say so.

**Silent behavior changes.** A refactor that drops a guard, changes a default, or narrows an error type, with no mention. Fix: state every behavior change. If the task was to preserve behavior, preserve it or call out the exception.

**Self-review blindness.** The agent that wrote the code rates it as clean, because it checks against the same understanding that produced the bug. Fix: review against the requirement and the surrounding code, not the implementation. A fresh context finds more.

## Generated prose

Agents write more prose than code, and it has the same problem. Cut filler and buzzwords (seamless, robust, leverage, at scale, deep dive), empty adverbs, and warm-up openers ("Here's the thing", "It's worth noting"). Cut setup-then-reveal contrasts, "nobody tells you" hype, colon drama, dangling `-ing` clauses, significance inflation, encore paragraphs, unnamed authority, and decoration such as emoji or dash-heavy rhythm. Prefer the plain verb. Specifics beat abstraction. Preserve the writer's voice.

Full list, plus commit, pull request, and docs rules: [references/prose.md](references/prose.md).

## Banned by default

**Names:** `data`, `result`, `value`, `temp`, `info`, `item`, `obj`, `thing`, `stuff`, `doStuff`, `handle*`, `process*`, `manage*`, `*Utils`, `*Helper`, `*Manager`, `*Handler` when it only forwards.

**Comment openers:** `// Initialize`, `// Set up`, `// Loop through`, `// Handle the`, `// Create a`, `# Step 1:`, and docstrings that restate the signature.

**Nominal patterns:** `IThing` with one implementation, `ThingFactory.create()` for one product, an options object nobody fills, `try { ... } catch (e) {}`.

Keep a banned word when it is the project's convention. Match, do not impose.

## Not slop: leave it

- Validation and authorization at trust boundaries, and error handling that prevents data loss.
- Security, accessibility, and concurrency correctness.
- Domain rules that look redundant but are load-bearing.
- The codebase's conventions, even when you would choose differently.
- A human's distinctive style: terse names, blunt comments, long functions that read clearly, uncertainty, humour, digressions.
- Working code next to the slop.

## Quick checks before delivering

- Did you ask whether it needs to exist at all?
- Any line deletable with no observable change? Delete it.
- Any name that fails the portability test? Rename to the role.
- Any comment restating the code or describing old behavior? Delete or update.
- Any abstraction with one implementation? Inline it.
- Any error swallowed or logged-and-rethrown? Fix it at the boundary.
- Any API or dependency you have not verified? Open the installed source. Run it.
- Any file changed outside the task boundary? Revert it.
- Any test edited to pass? Undo it, or explain the changed requirement.
- Any behavior change not stated in the output? State it.
- Any reformatted or renamed code outside the task? Revert it.
- Any banned word, empty adverb, or warm-up sentence? Delete it.
- Does the diff match the file's existing style? If not, redo it.

## Workflow

1. Read the whole change before judging any line. Understand the intent first.
2. Ask the YAGNI gate. Delete what should not exist before cleaning what remains.
3. Fix by default, or report only when asked or in CI.
4. Classify each finding: delete, inline, rename, or verify.
5. Check before adding. Search for an existing helper, then the standard library, then installed dependencies, before writing new code.
6. Prefer deletion. The best fix removes lines.
7. Keep the diff minimal. Do not reformat untouched code or rename across files unless asked.
8. Run the quick checks. Fix what fails and check again.
9. Verify. Run the tests, the type checker, and the real path. Unverified code is slop by default.

## Output

Fix: the diff, then a short **What changed** section with one line per category. No praise and no summary of what the code does.

Report only: findings, one line each, ordered by severity. For prose, quote the phrase instead of a line number:

```text
"<quoted phrase>": <pattern>. <fix>.
```

## Hard rules

- Never change a test to make it pass. Change code, or state that the requirement changed.
- Never edit files outside the task.
- Never claim a result you did not verify. Quote the real output.
- Never simplify away input validation at trust boundaries, error handling that prevents data loss, security, accessibility, or concurrency correctness.
- Never add an abstraction, dependency, or config knob in the same pass that removes slop.
- Never invent claims, sources, numbers, or opinions when editing prose.
- If you cannot verify a finding, ask. Do not fabricate it.
- No praise and no restating what the code does. Findings only.

## References

- [references/prose.md](references/prose.md): full prose rules and commit, pull request, and docs guidance.
- [references/examples.md](references/examples.md): before and after for each pattern.
