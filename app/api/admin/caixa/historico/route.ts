import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

// GET: Histórico de caixas fechados (mais recentes primeiro)
export const GET = withTenantRoute(async () => {
  try {
    const adminSupabase = createAdminClient();

    const { data: sessions, error } = await adminSupabase
      .from("cash_sessions")
      .select("*")
      .eq("pet_shop_id", getTenantId())
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
});
