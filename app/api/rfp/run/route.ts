import { NextResponse } from "next/server";
import { runPipeline } from "@/controllers/run_pipeline";
import { serializePipelineResult } from "@/lib/serialize";

export const maxDuration = 120;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text =
    typeof body === "object" &&
    body !== null &&
    "rfpText" in body &&
    typeof (body as { rfpText: unknown }).rfpText === "string"
      ? (body as { rfpText: string }).rfpText.trim()
      : "";

  if (!text) {
    return NextResponse.json(
      { error: "Missing non-empty string field rfpText" },
      { status: 400 },
    );
  }

  try {
    const result = await runPipeline(text);
    return NextResponse.json(serializePipelineResult(result));
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Pipeline failed",
      },
      { status: 500 },
    );
  }
}
