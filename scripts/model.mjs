// Shared model calls for the GitHub Action and the evaluation harness.
// No dependencies.

export const PROVIDERS = {
  anthropic: { kind: "anthropic", base: "https://api.anthropic.com" },
  openai: { kind: "openai", base: "https://api.openai.com/v1" },
  groq: { kind: "openai", base: "https://api.groq.com/openai/v1" },
  openrouter: { kind: "openai", base: "https://openrouter.ai/api/v1" },
  together: { kind: "openai", base: "https://api.together.xyz/v1" },
  deepseek: { kind: "openai", base: "https://api.deepseek.com/v1" },
  mistral: { kind: "openai", base: "https://api.mistral.ai/v1" },
  xai: { kind: "openai", base: "https://api.x.ai/v1" },
  google: { kind: "openai", base: "https://generativelanguage.googleapis.com/v1beta/openai" },
  ollama: { kind: "openai", base: "http://localhost:11434/v1" },
  lmstudio: { kind: "openai", base: "http://localhost:1234/v1" },
  custom: { kind: "openai", base: "" },
};

export async function callModel({ provider, baseUrl, apiKey, model, system, prompt, maxTokens = 2048 }) {
  const preset = PROVIDERS[provider] ?? PROVIDERS.custom;
  const base = baseUrl || preset.base;
  if (!base) throw new Error(`provider "${provider}" needs a base-url (known providers: ${Object.keys(PROVIDERS).join(", ")})`);

  if (preset.kind === "anthropic") {
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.content ?? []).map((part) => part.text ?? "").join("").trim();
  }

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`${provider} ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}
