/**
 * Static prompt templates (File Plan §1).
 */
export function isolateParameterQuery(returnSchemaDescription: string): string {
  return [
    "You are an analyst extracting structured booking and event requirements from unstructured text.",
    "Return ONLY valid JSON (no markdown fences) that matches the schema description below.",
    "Use snake_case keys exactly as specified. Use empty string \"\" or empty arrays only where truly unknown.",
    "Datetime fields must use format DD-MM-YYYY hh:mm:ss when present.",
    "",
    "Schema / field guide:",
    returnSchemaDescription,
    "",
    "User message:",
  ].join("\n");
}
