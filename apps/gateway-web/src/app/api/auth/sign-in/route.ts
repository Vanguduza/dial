import { NextResponse } from "next/server";

/** T0 stub — real Supabase Auth in T1. */
export async function POST() {
  return NextResponse.json(
    { ok: false, reason: "auth_not_wired", train: "T1" },
    { status: 501 },
  );
}
