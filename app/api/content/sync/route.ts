import { NextResponse } from "next/server";
import { syncContentIndex } from "@/controllers/sync_content_index";

export async function POST() {
  try {
    const result = await syncContentIndex();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 },
    );
  }
}
