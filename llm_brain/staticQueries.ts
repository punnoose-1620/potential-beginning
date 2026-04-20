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

/**
 * Product shortlist for the recommender LLM: JSON array of { product_id, variation_id, title, description }.
 */
export function productRecommendationUserPrompt(candidatesJson: string): string {
  return [
    "You are selecting the best-matching products for a client’s event or venue request.",
    "Return ONLY valid JSON matching the generation schema (selected_product_ids, optional notes).",
    "You MUST only include product_id values that appear in the candidates list below.",
    "Prefer a small set of highly relevant products (order matters: most relevant first).",
    "If none of the candidates are a reasonable fit, return selected_product_ids as an empty array.",
    "",
    "Candidates (JSON array):",
    candidatesJson,
    "",
    "Client requirements:",
  ].join("\n");
}
