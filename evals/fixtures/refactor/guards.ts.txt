// Clean fixture. Boundary validation: the input is a string from disk, parsed
// with JSON.parse inside a guard, and every field is checked before use. This is
// correct code and the expected finding count is zero.
type Manifest = {
  name: string;
  dependencies?: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readManifest(raw: string): Manifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`manifest is not valid JSON: ${(error as Error).message}`);
  }

  if (!isRecord(parsed) || typeof parsed.name !== "string") {
    throw new Error("manifest must be an object with a string name");
  }

  const dependencies = isRecord(parsed.dependencies)
    ? (parsed.dependencies as Record<string, string>)
    : undefined;

  return { name: parsed.name, dependencies };
}
