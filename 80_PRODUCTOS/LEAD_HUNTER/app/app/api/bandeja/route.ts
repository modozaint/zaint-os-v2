import { NextResponse } from "next/server";
import { leadsBandeja } from "@/lib/store";

/** Cola de la Bandeja: leads del cliente activo que necesitan decisión humana. */
export async function GET() {
  return NextResponse.json({ leads: leadsBandeja() });
}
