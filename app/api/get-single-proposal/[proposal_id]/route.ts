import { NextResponse } from "next/server";
import { getSingleProposal } from "@/server_connect/proposalesConnector";

type Ctx = { params: Promise<{ proposal_id: string }> };

export async function GET(_req: Request, context: Ctx) {
  const { proposal_id } = await context.params;
  if (!proposal_id) {
    return NextResponse.json({ error: "Missing proposal_id" }, { status: 400 });
  }
  const res = await getSingleProposal(proposal_id);
  return NextResponse.json(res);
}
