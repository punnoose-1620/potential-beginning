import { NextResponse } from "next/server";
import { searchProposals } from "@/server_connect/proposalesConnector";

type Ctx = { params: Promise<{ search_string: string }> };

export async function GET(_req: Request, context: Ctx) {
  const { search_string: raw } = await context.params;
  if (raw === undefined || raw === "") {
    return NextResponse.json({ error: "Missing search_string" }, { status: 400 });
  }
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const res = await searchProposals(decoded);
  return NextResponse.json(res);
}
