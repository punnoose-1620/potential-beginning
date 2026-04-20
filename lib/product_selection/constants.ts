/** Max products passed to the LLM after deterministic filtering */
export const MAX_PRODUCT_CANDIDATES = 40;
/** Max product ids the LLM may return (validated server-side) */
export const MAX_SELECTED_PRODUCTS = 10;

/** Score multiplier when a keyword matches in title vs description text */
export const TITLE_HIT_WEIGHT = 3;
export const DESC_HIT_WEIGHT = 1;
