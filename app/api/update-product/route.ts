import { NextResponse } from "next/server";
import { updateExistingProduct } from "@/server_connect/proposalesConnector";

export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const res = await updateExistingProduct(body);
  return NextResponse.json(res);
}
