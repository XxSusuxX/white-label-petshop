import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

// GET ?client_id=xxx — Pacotes de um tutor específico (usado no admin: agenda e ficha do cliente)
export const GET = withTenantRoute(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");

    if (!clientId) {
      return NextResponse.json({ error: "client_id é obrigatório" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data: packages, error } = await adminSupabase
      .from("client_packages")
      .select("*")
      .eq("pet_shop_id", getTenantId())
      .eq("client_id", clientId)
      .order("purchased_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar pacotes do cliente:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const now = new Date();
    const mapped = (packages || []).map((p) => {
      const isExpired = p.expires_at && new Date(p.expires_at) < now && p.status === "ativo";
      return { ...p, status: isExpired ? "expirado" : p.status };
    });

    return NextResponse.json({ packages: mapped });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/client-packages:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
