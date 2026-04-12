import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_EMBEDDING_MODEL } from "@/lib/constants";

/** Deterministic pseudo-embedding for local dev when no API key (not semantic). */
function fakeEmbedding(text: string, dim = 64): number[] {
  const v = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    v[i % dim] += text.charCodeAt(i) / 1000;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || texts.length === 0) {
    return texts.map((t) => fakeEmbedding(t));
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });

  const out: number[][] = [];
  for (const text of texts) {
    const res = await model.embedContent(text);
    const values = res.embedding.values;
    if (!values?.length) {
      out.push(fakeEmbedding(text));
    } else {
      out.push([...values]);
    }
  }
  return out;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}
