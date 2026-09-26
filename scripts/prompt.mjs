// Prompt builders shared by the GitHub Action and the evaluation harness, so
// the eval measures what the action actually sends.

export function buildDetectPrompt({ diff, title = "", body = "" }) {
  const intent = [];
  if (title) intent.push(`TITLE: ${title}`);
  if (body) intent.push(`BODY: ${body.slice(0, 2000)}`);
  if (intent.length === 0) intent.push("TITLE: (not provided)");

  return [
    "Review the pull request diff below. Detect only. Do not rewrite or apply fixes.",
    "Report only defects visible in this patch.",
    "Rules that need the whole repository, and rules about the writer's process, do not apply here. Skip them.",
    "Report only defects you can point at in the diff and defend from the code shown.",
    "One line each, ordered by severity, at most 5: `path:line: problem. fix.`",
    "No questions. No `verify` or `confirm` speculation. No style opinions, no type-guard nitpicks, no request for a comment or an assert.",
    "Runtime checks on data crossing a trust boundary (file, network, JSON.parse, env, CLI args, request body) are correct code. Never report them.",
    "If the diff has no concrete defect, reply with exactly: NO_SLOP",
    "",
    intent,
    "",
    "DIFF:",
    diff,
  ].join("\n");
}

// Keep only lines that look like findings: `path:line: problem. fix.` or
// `"quoted phrase": problem. fix.`. Drops commentary and verdict prose.
export function extractFindings(text) {
  return String(text)
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s+/, "").replace(/[*`]/g, "").trim())
    .filter((line) => /:\d+(?:-\d+)?:/.test(line) || /^"[^"]+":/.test(line));
}

export function buildVerifyPrompt({ diff, findings }) {
  return [
    "You are filtering a list of candidate findings. Remove a finding only when it is one of these:",
    "1. A question, or a request to verify or confirm something the input does not show.",
    "2. A guess about code that is not present in the input.",
    "3. A complaint that code validates input at a trust boundary, such as type guards around a parsed file or request. Only that. Security findings are not this and must be kept: SQL injection, command injection, float money, naive datetimes, secrets, missing timeouts.",
    "Keep every other finding unchanged, with the same wording, one line each, ordered by severity.",
    "Findings about comments, naming, dead code, and prose are valid. Keep them.",
    "If none survive, reply with exactly: NO_SLOP",
    "",
    "CANDIDATE FINDINGS:",
    findings,
    "",
    "INPUT:",
    diff,
  ].join("\n");
}
