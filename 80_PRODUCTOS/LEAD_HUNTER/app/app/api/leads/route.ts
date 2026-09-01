import { NextResponse } from "next/server";
import { listarLeads } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ leads: listarLeads() });
}
