import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET: Pacotes ativos do próprio tutor autenticado
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: packages, error } = await adminSupabase
      .from("client_packages")
      .select("*")
      .eq("client_id", user.id)
      .order("purchased_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar pacotes do cliente:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Marca como expirado quem passou da validade mas ainda está 'ativo' (sem precisar de cron)
    const now = new Date();
    const mapped = (packages || []).map((p) => {
      const isExpired = p.expires_at && new Date(p.expires_at) < now && p.status === "ativo";
      return { ...p, status: isExpired ? "expirado" : p.status };
    });

    return NextResponse.json({ packages: mapped });
  } catch (err: any) {
    console.error("Erro em GET /api/client-packages:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
