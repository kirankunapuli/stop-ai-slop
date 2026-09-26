// Prompt builders shared by the GitHub Action and the evaluation harness, so
// the eval measures what the action actually sends.

export function buildDetectPrompt({ diff, title = "", body = "", mode = "strict" }) {
  const intent = [];
  if (title) intent.push(`TITLE: ${title}`);
  if (body) intent.push(`BODY: ${body.slice(0, 2000)}`);
  if (intent.length === 0) intent.push("TITLE: (not provided)");

  const sweep = mode === "sweep";

  return [
    "Review the pull request diff below. Detect only. Do not rewrite or apply fixes.",
    "Report only defects visible in this patch, that you can point at and defend from the code shown.",
    "Rules that need the whole repository, and rules about the writer's process, do not apply here. Skip them.",
    sweep
      ? "Work through the group 1 rules one by one. Do not stop after the first few findings."
      : "Precision beats coverage. Report a finding only when the code shown is wrong.",
    `One line each, ordered by severity, at most ${sweep ? 10 : 5}: \`path:line: problem. fix.\``,
    "No questions. No `verify` or `confirm` speculation. No style opinions, no type-guard nitpicks, no request for a comment or an assert.",
    "Runtime checks on data crossing a trust boundary (file, network, JSON.parse, env, CLI args, request body) are correct code. Never report them.",
    "A comment that records a non-obvious why is correct code: a workaround, a spec quirk, a footgun, or where a precondition is enforced. Never report those.",
    "If nothing violates a group 1 rule, reply with exactly: NO_SLOP. Do not invent a finding to look useful.",
    "",
    intent.join("\n"),
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
    "4. A complaint about a comment that records a non-obvious why: a workaround, a spec quirk, a footgun, or where a precondition is enforced.",
    "Keep every other finding unchanged, with the same wording, one line each, ordered by severity.",
    "When in doubt, keep the finding. Dropping a real defect is worse than keeping a weak one.",
    "Do not add findings that were not in the candidate list.",
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
