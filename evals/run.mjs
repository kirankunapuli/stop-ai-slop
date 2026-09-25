#!/usr/bin/env node
// Evaluation harness: measure what the skill detects and what it invents.
//
//   EVAL_API_KEY=... node evals/run.mjs
//   EVAL_PROVIDER=anthropic EVAL_MODEL=claude-haiku-4-5-20251001 EVAL_API_KEY=... node evals/run.mjs
//   node evals/run.mjs --dry          # show fixtures, make no calls
//
// Scores recall against a labeled fixture set and counts findings on a clean
// fixture as false positives. Keyword scoring, so treat it as a floor, not a
// precise grade. See evals/README.md.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { callModel } from "../scripts/model.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");

const args = new Set(process.argv.slice(2));
const dry = args.has("--dry");

const provider = process.env.EVAL_PROVIDER || "openai";
const model = process.env.EVAL_MODEL || "gpt-6-luna";
const baseUrl = process.env.EVAL_BASE_URL || "";
const apiKey = process.env.EVAL_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || "";
const minRecall = Number(process.env.EVAL_MIN_RECALL || "0.75");

const expected = JSON.parse(readFileSync(join(here, "expected.json"), "utf8"));
const skill = readFileSync(join(repoRoot, "skills", "stop-ai-slop", "SKILL.md"), "utf8");

const plan = Object.entries(expected);

if (dry) {
  for (const [file, patterns] of plan) {
    console.log(`${file}: ${patterns.length} expected finding(s)`);
    for (const p of patterns) console.log(`  - ${p.pattern}`);
  }
  process.exit(0);
}

if (!apiKey) {
  console.error("Set EVAL_API_KEY (or ANTHROPIC_API_KEY / OPENAI_API_KEY), or run with --dry.");
  process.exit(2);
}

console.log(`stop-ai-slop eval | provider=${provider} model=${model} fixtures=${plan.length}\n`);
process.exit(await run(plan));

async function run(plan) {
  let totalExpected = 0;
  let totalHits = 0;
  let totalFalsePositives = 0;
  let cleanFindings = 0;

  for (const [file, patterns] of plan) {
    const path = join(here, "fixtures", file);
    const content = readFileSync(path, "utf8");
    const prompt = [
      "Detect all slop in the file below. Detect only, do not rewrite.",
      "List every finding as one line: `path:line: problem. fix.`",
      "If there is no slop, reply with exactly: NO_SLOP",
      "",
      `FILE: ${file}`,
      "```",
      content,
      "```",
    ].join("\n");

    const answer = await callModel({ provider, baseUrl, apiKey, model, system: skill, prompt });
    const findings = parseFindings(answer);
    const matched = patterns.filter((p) => findings.some((f) => includesAny(f, p.match)));
    const falsePositives = findings.filter((f) => !patterns.some((p) => includesAny(f, p.match)));

    totalExpected += patterns.length;
    totalHits += matched.length;
    totalFalsePositives += patterns.length === 0 ? 0 : falsePositives.length;
    if (patterns.length === 0) cleanFindings = findings.length;

    const recall = patterns.length ? (matched.length / patterns.length).toFixed(2) : "n/a";
    console.log(`${file}`);
    console.log(`  expected ${patterns.length}, found ${matched.length} (recall ${recall}), extra ${falsePositives.length}`);
    for (const p of patterns) {
      const ok = matched.includes(p);
      console.log(`  ${ok ? "hit " : "MISS"} ${p.pattern}`);
    }
    for (const f of falsePositives) console.log(`  extra ${f}`);
    console.log("");
  }

  const recall = totalExpected ? totalHits / totalExpected : 1;
  const precision = totalHits + totalFalsePositives ? totalHits / (totalHits + totalFalsePositives) : 1;
  console.log(`summary: recall ${recall.toFixed(2)} (${totalHits}/${totalExpected}), precision ${precision.toFixed(2)}, extra findings ${totalFalsePositives}`);
  console.log(`clean fixture findings: ${cleanFindings}`);

  let failed = false;
  if (recall < minRecall) {
    console.error(`FAIL: recall ${recall.toFixed(2)} below ${minRecall}`);
    failed = true;
  }
  if (cleanFindings > 0) {
    console.error(`FAIL: ${cleanFindings} finding(s) on the clean fixture`);
    failed = true;
  }
  return failed ? 1 : 0;
}

function parseFindings(answer) {
  return answer
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s+/, "").trim())
    .filter((line) => line && line !== "NO_SLOP" && !/^[`~]{1,}$/.test(line) && !/^```/.test(line))
    .map((line) => line.replace(/^`|`$/g, "").trim())
    .filter(Boolean);
}

function includesAny(line, keys) {
  const lower = line.toLowerCase();
  return keys.some((key) => new RegExp(`\\b${escapeRegex(key.toLowerCase())}\\b`).test(lower));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
