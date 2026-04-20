/**
 * Deterministic keyword extraction from user text (no ML).
 * Normalizes, tokenizes, removes stopwords, optional bigrams when adjacent tokens survive filtering.
 */

const STOPWORDS = new Set(
  [
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "as",
    "by",
    "with",
    "from",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "shall",
    "can",
    "this",
    "that",
    "these",
    "those",
    "it",
    "its",
    "we",
    "you",
    "they",
    "them",
    "their",
    "our",
    "your",
    "my",
    "i",
    "me",
    "he",
    "she",
    "his",
    "her",
    "not",
    "no",
    "yes",
    "any",
    "all",
    "each",
    "every",
    "both",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "than",
    "too",
    "very",
    "just",
    "also",
    "only",
    "even",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "under",
    "again",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "what",
    "which",
    "who",
    "whom",
    "if",
    "then",
    "else",
    "because",
    "until",
    "while",
    "although",
    "though",
    "need",
    "needs",
    "want",
    "wants",
    "like",
    "please",
    "thank",
    "thanks",
  ].map((w) => w.toLowerCase()),
);

const MIN_TOKEN_LEN = 2;

export type ExtractKeywordsResult = {
  /** Distinct content tokens / bigrams used for matching */
  keywords: string[];
  /** Raw tokens after stopword removal (debug) */
  tokens: string[];
  /** Adjacent-pair phrases from surviving tokens (lowercased) */
  bigrams: string[];
};

function normalizeRaw(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(normalized: string): string[] {
  return normalized
    .split(/\s+/)
    .map((t) => t.replace(/^['-]+|['-]+$/g, ""))
    .filter((t) => t.length >= MIN_TOKEN_LEN);
}

export function extractKeywordsDeterministic(userText: string): ExtractKeywordsResult {
  const normalized = normalizeRaw(userText);
  const rawTokens = tokenize(normalized);
  const tokens = rawTokens
    .map((t) => t.toLowerCase())
    .filter((t) => !STOPWORDS.has(t) && t.length >= MIN_TOKEN_LEN);

  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }

  const keywordSet = new Set<string>([...tokens, ...bigrams]);
  const keywords = Array.from(keywordSet);

  return { keywords, tokens, bigrams };
}
