import { NextResponse } from "next/server";
import { createNewProduct } from "@/server_connect/proposalesConnector";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const withLang = { ...body };
  if (withLang.language === undefined || withLang.language === null || withLang.language === "") {
    withLang.language = "en";
  }
  const res = await createNewProduct(withLang);
  return NextResponse.json(res);
}
