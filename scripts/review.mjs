#!/usr/bin/env node
// Review a pull request diff for AI slop using the stop-ai-slop skill.
// No dependencies. Reads its config from INPUT_* env vars set by action.yml.

import { execFileSync } from "node:child_process";
import { readFileSync, appendFileSync } from "node:fs";
import { callModel } from "./model.mjs";

const MARKER = "<!-- stop-ai-slop -->";

const input = (name, fallback = "") => process.env[name] ?? fallback;

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function tryRun(cmd, args) {
  try {
    return run(cmd, args);
  } catch {
    return null;
  }
}

function fail(message) {
  console.error(`stop-ai-slop: ${message}`);
  process.exit(1);
}

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<EOF_${name}\n${value}\nEOF_${name}\n`);
}

function getDiff(maxChars) {
  let event;
  try {
    event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  } catch (error) {
    fail(`could not read the GitHub event at ${process.env.GITHUB_EVENT_PATH}: ${error.message}`);
  }
  const ZERO = "0".repeat(40);

  if (event.pull_request) {
    const base = event.pull_request.base.sha;
    const head = event.pull_request.head.sha;
    tryRun("git", ["fetch", "--no-tags", "origin", base, head]);
    const diff = tryRun("git", ["diff", "--unified=3", `${base}...${head}`]);
    if (diff === null) fail("could not diff the pull request. Check out the repository with fetch-depth: 0.");
    return { diff: truncate(diff, maxChars), number: event.pull_request.number };
  }

  if (event.after) {
    const before = event.before && event.before !== ZERO ? event.before : null;
    const diff = before
      ? tryRun("git", ["diff", "--unified=3", `${before}...${event.after}`])
      : tryRun("git", ["diff", "--unified=3", "4b825dc642cb6eb9a060e54bf8d69288fbee4904", event.after]);
    if (diff === null) fail("could not diff the push. Check out the repository with fetch-depth: 0.");
    return { diff: truncate(diff, maxChars), number: null };
  }

  fail("only pull_request and push events are supported");
}

function truncate(text, maxChars) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[stop-ai-slop: diff truncated at ${maxChars} characters]`;
}

async function review(providerName, baseUrlOverride, apiKey, model, diff) {
  const skill = readFileSync(process.env.SKILL_PATH, "utf8");
  const prompt = [
    "Review the pull request diff below. Detect only. Do not rewrite or apply fixes.",
    "Report only defects you can point at in the diff and defend from the code shown.",
    "One line each, ordered by severity, at most 5: `path:line: problem. fix.`",
    "No questions. No `verify` or `confirm` speculation. No style opinions, no type-guard nitpicks, no request for a comment or an assert.",
    "If the diff has no concrete defect, reply with exactly: NO_SLOP",
    "",
    "DIFF:",
    diff,
  ].join("\n");

  try {
    return await callModel({ provider: providerName, baseUrl: baseUrlOverride, apiKey, model, system: skill, prompt });
  } catch (error) {
    fail(String(error?.message ?? error));
  }
}

async function comment(repo, token, number, body) {
  const headers = { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "stop-ai-slop" };
  const api = `https://api.github.com/repos/${repo}/issues/${number}/comments`;

  const existing = await fetch(api, { headers });
  if (!existing.ok) fail(`github list comments ${existing.status}: ${await existing.text()}`);
  const comments = await existing.json();
  const mine = comments.find((c) => c.body?.startsWith(MARKER));
  if (mine) {
    const patched = await fetch(`${api}/${mine.id}`, { method: "PATCH", headers, body: JSON.stringify({ body }) });
    if (!patched.ok) fail(`github update comment ${patched.status}: ${await patched.text()}`);
    return;
  }
  const created = await fetch(api, { method: "POST", headers, body: JSON.stringify({ body }) });
  if (!created.ok) fail(`github create comment ${created.status}: ${await created.text()}`);
}

const apiKey = input("INPUT_API_KEY");
if (!apiKey) fail("api-key is required");
const provider = input("INPUT_PROVIDER", "openai");
const model = input("INPUT_MODEL", "gpt-6-luna");
const baseUrl = input("INPUT_BASE_URL");
const maxChars = Number(input("INPUT_MAX_DIFF_CHARS", "40000"));

const { diff, number } = getDiff(maxChars);
if (!diff.trim()) {
  console.log("stop-ai-slop: empty diff, nothing to review");
  setOutput("findings", "false");
  setOutput("result", "NO_SLOP");
  process.exit(0);
}

const result = await review(provider, baseUrl, apiKey, model, diff);
const hasFindings = result !== "NO_SLOP" && result.length > 0;

setOutput("findings", String(hasFindings));
setOutput("result", result);

if (number) {
  const body = hasFindings
    ? `${MARKER}\n### stop-ai-slop\n\n${result}\n\n<sub>Detect-only. Fix locally, or ask your agent to de-slop.</sub>`
    : `${MARKER}\nNo slop found in this diff.`;
  await comment(process.env.GITHUB_REPOSITORY, input("INPUT_GITHUB_TOKEN"), number, body);
}

console.log(result);

if (hasFindings && input("INPUT_FAIL_ON_FINDINGS") === "true") {
  fail("slop found");
}
