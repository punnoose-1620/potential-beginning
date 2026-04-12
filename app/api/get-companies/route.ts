import { NextResponse } from "next/server";
import { listCompanies } from "@/server_connect/proposalesConnector";

export async function GET() {
  const res = await listCompanies();
  return NextResponse.json(res);
}
