import type { ExtractedRequirements } from "@/models/rfp";
import type { ContentProduct } from "@/models/content";
import type { ProposalBlockPlan } from "@/models/proposal";
import { GeneratedBlock } from "@/models/proposal";
import { getGeminiModel } from "@/llm_brain/client";

function productLines(products: ContentProduct[]): string {
  return products
    .map(
      (p) =>
        `- ${p.id}: ${p.title}\n  ${(p.description ?? "").slice(0, 500)}`,
    )
    .join("\n");
}

export async function generateBlock(
  extracted: ExtractedRequirements,
  block: ProposalBlockPlan,
  citedProducts: ContentProduct[],
): Promise<GeneratedBlock> {
  const model = getGeminiModel();
  const prompt = `Write one section of a professional hotel proposal in Markdown.

RFP context: ${extracted.summary}
Section title: ${block.title}
Intent: ${block.intent}

Only use facts grounded in these products:
${productLines(citedProducts)}

Output ONLY the section body Markdown (no front matter). Tone: concise, professional.`;

  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const body = res.response.text().trim();
  return new GeneratedBlock(block.id, block.title, body, citedProducts);
}

export function generateBlockFallback(
  block: ProposalBlockPlan,
  citedProducts: ContentProduct[],
): GeneratedBlock {
  const lines = citedProducts.length
    ? citedProducts.map((p) => `- **${p.title}** — ${(p.description ?? "").slice(0, 200)}`)
    : ["- *No matched products; expand your content library.*"];
  const body = [`### ${block.title}`, "", block.intent, "", ...lines].join("\n");
  return new GeneratedBlock(block.id, block.title, body, citedProducts);
}
