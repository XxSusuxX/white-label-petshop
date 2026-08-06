import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";

// GET: Histórico de caixas fechados (mais recentes primeiro)
export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    const { data: sessions, error } = await adminSupabase
      .from("cash_sessions")
      .select("*")
      .eq("pet_shop_id", PET_SHOP_ID)
      .eq("status", "fechado")
      .order("closed_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Erro ao buscar histórico de caixa:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/caixa/historico:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
