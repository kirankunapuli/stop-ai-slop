# stop-ai-slop

[![validate](https://github.com/kirankunapuli/stop-ai-slop/actions/workflows/validate.yml/badge.svg)](https://github.com/kirankunapuli/stop-ai-slop/actions/workflows/validate.yml)
[![install](https://img.shields.io/badge/install-npx%20skills%20add%20kirankunapuli%2Fstop--ai--slop-blue)](#install)
[![stars](https://img.shields.io/github/stars/kirankunapuli/stop-ai-slop?style=flat)](https://github.com/kirankunapuli/stop-ai-slop)
[![license](https://img.shields.io/github/license/kirankunapuli/stop-ai-slop)](LICENSE)
[![agents](https://img.shields.io/badge/agents-79-blue)](docs/agents.md)

Your agent writes code that looks right. This skill makes it delete its own slop before it lands.

An [Agent Skill](https://github.com/vercel-labs/skills): one command, no config, and it works with Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, Windsurf, Zed, Pi, and [70 more](docs/agents.md).

```bash
npx skills add kirankunapuli/stop-ai-slop
```

## Before and after

### Code

An agent asked to add invoice saving produced this:

```python
class InvoiceProcessorInterface(ABC):
    """Interface for invoice processors."""

    @abstractmethod
    def process(self, data) -> dict:
        """Process the invoice."""
        ...

class InvoiceProcessor(InvoiceProcessorInterface):
    def __init__(self, db):
        # Store the database connection
        self.db = db

    def process(self, data) -> dict:
        # Initialize the result
        result = {}
        # Loop through each item
        for item in data:
            # Try to parse the amount
            try:
                amount = Decimal(item["amount"])
            except Exception:
                amount = 0
            result[item["id"]] = self._handle(amount)
        return result

class InvoiceProcessorFactory:
    """Factory for invoice processors."""

    @staticmethod
    def create(db) -> InvoiceProcessorInterface:
        return InvoiceProcessor(db)
```

The skill returned this:

```python
def save_invoice_amounts(db, invoice_lines) -> dict:
    return {
        line["id"]: db.save({"amount": Decimal(line["amount"])})
        for line in invoice_lines
    }
```

```text
1 file changed, 8 insertions(+), 54 deletions(-)
```

It inlined the one-implementation interface and the single-product factory, renamed `data`, `result`, and `_handle`, deleted six restating comments, and removed the `except Exception` that turned an unparseable amount into zero. Report-only mode gives the same judgment without the edits:

```text
billing/invoice.py:14: Interface InvoiceProcessorInterface has one implementation. Inline it.
billing/invoice.py:31: except Exception sets amount to 0. Let it propagate; catch at the boundary.
billing/invoice.py:33: name `item` -> `line_item`.
billing/invoice.py:58: docstring restates the class name. Delete.
```

### Prose

The commit message the same agent proposed:

```text
fix: Fixed the bug in the invoice processor where it was not
correctly handling the amount parsing, which could cause issues.
This is an important change that improves the robustness of the
system and makes it more reliable going forward. I've also
refactored some code to be more maintainable.

Generated with Claude Code
```

The skill returned this:

```text
fix: reject unparseable invoice amounts

A bad `amount` was silently saved as 0. It now raises, so the caller
can skip the row and report it. Closes #412.
```

It cut the past-tense subject, the narration, the filler, and the tool footer. Same review, one pass, code and prose.

## Recorded run

The GIF shows one live run that fixes both: the code in `demo/sloppy/invoice.py` and the commit message in `demo/sloppy/commit-msg.txt`. Rebuild it with `./demo/record.sh`.

![The skill fixing a sample file and a commit message](demo/demo.gif)

## Why slop ships

AI output has a specific failure mode: it reads like quality. Reviewers approve it. The evidence:

- **19.7% of AI-generated samples referenced a package that does not exist.** USENIX Security 2025 tested 2.23 million samples across 16 models. 43% of invented names recurred across runs, split into conflations (38%), near-miss typos (13%), and pure inventions (51%). That repeatability is what makes slopsquatting farmable. ([study](https://arxiv.org/abs/2406.10279), [analysis](https://labs.cloudsecurityalliance.org/research/csa-research-note-slopsquatting-ai-supply-chain-20260419-csa))
- **Agents game the tests.** A 2025 study of frontier models on engineering tasks found reward hacking in 30.4% of runs: edited assertions, disabled tests, monkey-patched runners, and one agent that overrode Python's equality check so every test passed. A benchmark agent scored 97% on visible compiler tests and 0% on held-out tests by hashing inputs to stored answers. ([summary](https://tianpan.co/blog/2026/04/17/specification-gaming-production-ai-agents), [SpecBench](https://www.weco.ai/blog/specbench))
- **The code looks plausible while being wrong.** Off-by-one errors, inverted conditions, and skipped edge cases survive review because the code runs and reads correctly. ([survey](https://arxiv.org/abs/2512.05239))
- **AI tests create a coverage illusion.** They assert that a function did not throw, assert on the mock, or mirror the implementation including its bugs. ([Vitest](https://main.vitest.dev/guide/learn/writing-tests-with-ai))
- **AI bloat passes inspection.** Single-use factories, redundant indirection, and unnecessary abstractions resemble patterns reviewers recognize as good. ([Bryan Finster](https://bryanfinster.substack.com/p/ai-broke-your-code-review-heres-how))

## What it catches

Full catalog in [SKILL.md](skills/stop-ai-slop/SKILL.md). The groups:

- **Wrong or unverified behavior.** Plausible-but-wrong logic, hallucinated APIs and packages, swallowed errors, missing trust-boundary checks, secrets in code, string-built SQL and shell commands, money as float and naive datetimes, blocking calls in async code, retries that ignore `Retry-After`, non-idempotent retries and race conditions, N+1 queries and unbounded result sets.
- **Structure that does not pay for itself.** One-implementation interfaces, single-product factories, reinvented standard library, god functions, shotgun diffs, architecture violations.
- **Naming and comments.** Generic names, comments that restate the code, stale comments and docs.
- **Excess and noise.** Defensive bloat, dead code, formatting churn.
- **Tests.** Assertions that cannot fail, tests that mirror the bug they were written from.
- **Agent behavior.** Test tampering and reward hacking, false success reporting, task-boundary violations, silent behavior changes, self-review blindness.
- **Generated prose.** Filler, buzzwords, warm-up openers, setup-then-reveal contrasts, colon drama, encore paragraphs, commit and PR slop.

## What it leaves alone

Validation and authorization at trust boundaries, error handling that prevents data loss, security, accessibility, concurrency correctness, domain rules that are load-bearing, the codebase's conventions, and the writer's voice. It never adds an abstraction, dependency, or config knob in the same pass that removes one.

## How it compares

Linters catch formatting and some bug classes. They do not catch speculative abstraction, a comment that restates the next line, a package that does not exist, a test edited to pass, or a pull request description that says nothing. Prose-only writing skills cover the text but never open the code. This skill works at the level a reviewer does, across both.

| Job | Prose-only writing skills | Linters and SAST | stop-ai-slop |
|---|---|---|---|
| Code patterns: abstraction, naming, comments, dead code | No | Partial | Yes |
| Plausible-but-wrong logic and hidden behavior changes | No | Partial | Yes |
| Hallucinated APIs and packages | No | Partial | Yes |
| Generated prose: commit, PR, docs | Yes | No | Yes |
| Agent behavior: test tampering, false success, scope creep | No | No | Yes |
| YAGNI: delete what should not exist | No | No | Yes |
| Fix by default, report on request | Varies | Report only | Yes |
| CI action on any model provider | No | Some | Yes |
| Works across agents | Varies | Tool-specific | 79 agents |

## Usage

Ask for it, or let it trigger when an agent writes, reviews, refactors, or audits code. "de-slop this", "stop ai slop", "clean up this AI code", "make this not look AI-written", "fix my commit message".

The skill fixes by default: it applies the smallest edit, scoped to the change under discussion, then reports what changed. A whole-repository audit reports first and asks before editing many files. Ask for "detect only" or "just review" to get findings with no changes. The GitHub Action always runs in report-only mode.

## Install

### Any agent

```bash
npx skills add kirankunapuli/stop-ai-slop
```

The CLI detects which agents you have installed and puts the skill in each one's directory. Symlinks by default, `--copy` to copy files instead. Add `-y` to skip prompts.

### Scope

```bash
npx skills add kirankunapuli/stop-ai-slop       # project (default)
npx skills add kirankunapuli/stop-ai-slop -g    # global, available in every project
```

### Choose agents

```bash
npx skills add kirankunapuli/stop-ai-slop -a claude-code   # one agent
npx skills add kirankunapuli/stop-ai-slop -a codex -a cursor
npx skills add kirankunapuli/stop-ai-slop -a '*'           # every detected agent
npx skills add kirankunapuli/stop-ai-slop --all            # all skills, all agents, no prompts
```

### Claude Code plugin

```text
/plugin marketplace add kirankunapuli/stop-ai-slop
/plugin install stop-ai-slop@stop-ai-slop
```

### Manual

```bash
git clone https://github.com/kirankunapuli/stop-ai-slop
cp -r stop-ai-slop/skills/stop-ai-slop ~/.claude/skills/   # or your agent's directory
```

### Manage

```bash
npx skills use kirankunapuli/stop-ai-slop    # print a prompt, install nothing
npx skills update stop-ai-slop               # update
npx skills remove stop-ai-slop               # remove
npx skills find "code quality"               # search the ecosystem
```

## Use in CI

This repository is also a composite GitHub Action. Add one file to review every pull request:

```yaml
# .github/workflows/stop-ai-slop.yml
name: stop-ai-slop
on: pull_request
permissions:
  contents: read
  pull-requests: write
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: kirankunapuli/stop-ai-slop@v1
        with:
          api-key: ${{ secrets.OPENAI_API_KEY }}
          fail-on-findings: "false"
```

It posts one comment per pull request, updated in place, in report-only mode. `provider` accepts `openai`, `anthropic`, `google`, `groq`, `openrouter`, `together`, `deepseek`, `mistral`, `xai`, `ollama`, `lmstudio`, or `custom` with a `base-url` for any OpenAI-compatible endpoint. OpenAI and `gpt-6-luna` are the defaults. Other inputs: `model`, `fail-on-findings`, `max-diff-chars`. Full example in [examples/pr-review.yml](examples/pr-review.yml).

The diff and the skill go only to the provider you configure. With `ollama` or `lmstudio`, that is your own machine.

## Supported agents

`npx skills add` installs to 79 agents. 22 share the `.agents/skills` standard. Full list with install directories: [docs/agents.md](docs/agents.md).

## How the skill is built

The catalog follows Anthropic's [skill authoring guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). The description is written in the third person so the agent can match it against the task. The body stays small so it costs little context, and detail lives one level deep in [references/prose.md](skills/stop-ai-slop/references/prose.md) and [references/examples.md](skills/stop-ai-slop/references/examples.md). This repository dogfoods its own rule: no em dashes, no emoji outside the slop sample, no filler, no recap paragraphs.

## Evaluation

A skill is a claim until it is measured. This repo ships a small benchmark: five labeled fixtures (three sloppy, two clean) and a harness that scores recall, precision, and false positives on the clean files.

```bash
EVAL_API_KEY=... node evals/run.mjs
```

| Model | Recall | Precision | Findings on clean |
|---|---|---|---|
| `claude-haiku-4-5-20251001` | 0.86 (12/14) | 0.92 | 0 |

The action runs twice: a first pass finds defects, a second pass removes questions, guesses, and boundary-validation complaints. The eval runs the same two passes, from the same prompt file, so the number describes what the action actually sends.

`gpt-6-luna` is the default. Its last measurement, on the earlier three-fixture set, was 1.00 recall and 0.91 precision.

The harness fails when recall drops below the threshold or when the skill invents a finding on clean code. That second check matters most: a skill that invents problems is worse than one that misses a few. Method, limitations, and how to add a fixture: [evals/README.md](evals/README.md).

Measured on code it did not influence: [docs/case-study.md](docs/case-study.md) runs the skill over three real agent-authored pull requests and publishes the wrong findings as well as the right ones.

## Repository layout

```text
.
├── skills/stop-ai-slop/
│   ├── SKILL.md              # the skill: catalog, workflow, rules
│   └── references/
│       ├── examples.md       # before and after for each pattern
│       └── prose.md          # full prose, commit, PR, and docs rules
├── action.yml                # composite GitHub Action
├── scripts/
│   ├── review.mjs            # PR review runner, no dependencies
│   ├── prompt.mjs            # detect and verify prompts, shared with the eval
│   └── model.mjs             # shared provider calls
├── evals/                    # labeled fixtures and scoring harness
│   ├── README.md
│   ├── run.mjs
│   ├── expected.json
│   └── fixtures/
├── examples/pr-review.yml    # consumer workflow example
├── demo/                     # VHS recording, sample file, one-command rebuild
├── docs/agents.md            # all 79 supported agents
├── docs/case-study.md        # the skill measured on three real agent PRs
├── .claude-plugin/           # Claude Code plugin manifests
├── .markdownlint.json        # markdown lint config
└── .github/workflows/        # validate.yml
```

## Development

Validate the skill locally:

```bash
node -e '
const fs=require("fs"),path=require("path");
for (const n of fs.readdirSync("skills")) {
  const f=path.join("skills",n,"SKILL.md");
  const m=fs.readFileSync(f,"utf8").match(/^---\n([\s\S]*?)\n---\n/);
  if(!m) throw new Error(f+": no frontmatter");
  if(!/^name:\s*/m.test(m[1])||!/^description:\s*/m.test(m[1])) throw new Error(f+": missing name/description");
  console.log("ok:",n);
}'
```

Install from the local directory with `npx skills add ./ --list`, or rebuild the demo with `./demo/record.sh`. CI runs the same checks on every push through [.github/workflows/validate.yml](.github/workflows/validate.yml).

A skill needs `name` (lowercase and hyphens, 64 characters maximum, no reserved words) and `description` (1,024 characters maximum, third person) in YAML frontmatter, with the body under 500 lines and detail in files one level deep.

## Contributing

Open an issue or a pull request. New slop patterns are welcome when they are concrete and detectable, not a matter of taste. Keep `SKILL.md` tight: every rule must earn its place.

## License

MIT
