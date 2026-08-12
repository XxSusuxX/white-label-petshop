import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

// GET: Lista datas bloqueadas (feriados/fechamentos pontuais), mais recentes primeiro
export const GET = withTenantRoute(async () => {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("blocked_dates")
      .select("*")
      .eq("pet_shop_id", getTenantId())
      .order("blocked_date", { ascending: true });

    if (error) {
      console.error("Erro ao buscar blocked_dates:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ dates: data || [] });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/blocked-dates:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// POST: Bloqueia uma data (feriado, fechamento pontual)
export const POST = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();
    const { blocked_date, reason } = body;

    if (!blocked_date) {
      return NextResponse.json({ error: "blocked_date é obrigatório (YYYY-MM-DD)" }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from("blocked_dates")
      .insert({ pet_shop_id: getTenantId(), blocked_date, reason: reason || "" })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Essa data já está bloqueada." }, { status: 409 });
      }
      console.error("Erro ao criar blocked_date:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, date: data });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/blocked-dates:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// DELETE: Remove um bloqueio de data (?id=)
export const DELETE = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    const { error } = await adminSupabase
      .from("blocked_dates")
      .delete()
      .eq("pet_shop_id", getTenantId())
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em DELETE /api/admin/blocked-dates:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
