import { NextResponse } from "next/server";
import { listProducts } from "@/server_connect/proposalesConnector";

export async function GET() {
  const res = await listProducts();
  return NextResponse.json(res);
}
