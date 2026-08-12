import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["aluguel", "salarios", "fornecedores", "marketing", "manutencao", "outros"];

// POST: Registra uma despesa manual (aluguel, salários, fornecedores, marketing, manutenção, outros)
export const POST = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();
    const { description, category, amount, expense_date, notes } = body;

    if (!description || !description.trim()) {
      return NextResponse.json({ error: "Descrição é obrigatória." }, { status: 400 });
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Valor deve ser maior que zero." }, { status: 400 });
    }
    const finalCategory = VALID_CATEGORIES.includes(category) ? category : "outros";

    const { data, error } = await adminSupabase
      .from("financial_expenses")
      .insert({
        pet_shop_id: getTenantId(),
        description: description.trim(),
        category: finalCategory,
        amount: Number(amount),
        expense_date: expense_date || new Date().toISOString().slice(0, 10),
        notes: notes || "",
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar despesa:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, expense: data });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/financeiro/expenses:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// DELETE: Remove uma despesa (?id=)
export const DELETE = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    const { error } = await adminSupabase
      .from("financial_expenses")
      .delete()
      .eq("pet_shop_id", getTenantId())
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em DELETE /api/admin/financeiro/expenses:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
