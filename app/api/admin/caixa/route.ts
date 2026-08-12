import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

async function getCurrentUserName(): Promise<{ id: string | null; name: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: null, name: "Admin" };
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    return { id: user.id, name: profile?.full_name || "Admin" };
  } catch {
    return { id: null, name: "Admin" };
  }
}

function summarize(movements: any[], openingAmount: number) {
  const byMethod: Record<string, number> = {};
  let totalEntradas = 0;
  let totalSaidas = 0;
  for (const m of movements) {
    const amount = Number(m.amount) || 0;
    if (m.type === "entrada") {
      totalEntradas += amount;
      const key = m.payment_method || "outro";
      byMethod[key] = (byMethod[key] || 0) + amount;
    } else {
      totalSaidas += amount;
    }
  }
  return {
    totalEntradas,
    totalSaidas,
    byMethod,
    expected: openingAmount + totalEntradas - totalSaidas,
  };
}

// GET: Sessão de caixa aberta no momento (se houver), com suas movimentações e totais
export const GET = withTenantRoute(async () => {
  try {
    const adminSupabase = createAdminClient();

    const { data: session, error: sessionErr } = await adminSupabase
      .from("cash_sessions")
      .select("*")
      .eq("pet_shop_id", getTenantId())
      .eq("status", "aberto")
      .order("opened_at", { ascending: false })
      .maybeSingle();

    if (sessionErr) {
      console.error("Erro ao buscar sessão de caixa:", sessionErr);
      return NextResponse.json({ error: sessionErr.message }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ session: null, movements: [], summary: null });
    }

    const { data: movements, error: movErr } = await adminSupabase
      .from("cash_movements")
      .select("*")
      .eq("cash_session_id", session.id)
      .order("created_at", { ascending: false });

    if (movErr) {
      return NextResponse.json({ error: movErr.message }, { status: 500 });
    }

    const summary = summarize(movements || [], Number(session.opening_amount) || 0);

    return NextResponse.json({ session, movements: movements || [], summary });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/caixa:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// POST: Abrir um novo caixa
export const POST = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();
    const { opening_amount } = body;

    const { data: existing } = await adminSupabase
      .from("cash_sessions")
      .select("id")
      .eq("pet_shop_id", getTenantId())
      .eq("status", "aberto")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Já existe um caixa aberto." }, { status: 409 });
    }

    const { id, name } = await getCurrentUserName();

    const { data: session, error } = await adminSupabase
      .from("cash_sessions")
      .insert({
        pet_shop_id: getTenantId(),
        opened_by: id,
        opened_by_name: name,
        opening_amount: opening_amount || 0,
        status: "aberto",
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao abrir caixa:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/caixa:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// PATCH: Registrar movimentação manual (entrada/saída) OU fechar o caixa (action: "close")
export const PATCH = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();
    const { action } = body;

    const { data: session, error: sessionErr } = await adminSupabase
      .from("cash_sessions")
      .select("*")
      .eq("pet_shop_id", getTenantId())
      .eq("status", "aberto")
      .maybeSingle();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Nenhum caixa aberto no momento." }, { status: 400 });
    }

    if (action === "close") {
      const { counted_amount, notes } = body;
      if (counted_amount === undefined || counted_amount === null) {
        return NextResponse.json({ error: "Informe o valor contado no fechamento." }, { status: 400 });
      }

      const { data: movements } = await adminSupabase
        .from("cash_movements")
        .select("*")
        .eq("cash_session_id", session.id);

      const summary = summarize(movements || [], Number(session.opening_amount) || 0);
      const difference = Number(counted_amount) - summary.expected;
      const { id, name } = await getCurrentUserName();

      const { data: closed, error } = await adminSupabase
        .from("cash_sessions")
        .update({
          status: "fechado",
          closed_at: new Date().toISOString(),
          closed_by: id,
          closed_by_name: name,
          expected_amount: summary.expected,
          counted_amount: Number(counted_amount),
          difference_amount: difference,
          notes: notes || "",
        })
        .eq("id", session.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, session: closed, summary, difference });
    }

    // Movimentação manual (entrada/saída — ex.: sangria, reforço de troco)
    const { type, amount, payment_method, description } = body;
    if (!type || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "type e amount (positivo) são obrigatórios" }, { status: 400 });
    }
    if (type !== "entrada" && type !== "saida") {
      return NextResponse.json({ error: "type deve ser 'entrada' ou 'saida'" }, { status: 400 });
    }

    const { id: userId } = await getCurrentUserName();

    const { data: movement, error } = await adminSupabase
      .from("cash_movements")
      .insert({
        cash_session_id: session.id,
        type,
        amount: Number(amount),
        payment_method: payment_method || "dinheiro",
        description: description || "",
        created_by: userId,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, movement });
  } catch (err: any) {
    console.error("Erro em PATCH /api/admin/caixa:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
