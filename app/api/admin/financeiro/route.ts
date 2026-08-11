import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonthIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// GET ?from=YYYY-MM-DD&to=YYYY-MM-DD — Relatório financeiro do período (padrão: mês atual)
export async function GET(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || firstDayOfMonthIso();
    const to = searchParams.get("to") || todayIso();
    const rangeStart = `${from}T00:00:00.000Z`;
    const rangeEnd = `${to}T23:59:59.999Z`;

    // ---------- 1. Vendas do PDV no período ----------
    const { data: sales, error: salesErr } = await adminSupabase
      .from("sales")
      .select("*")
      .eq("pet_shop_id", PET_SHOP_ID)
      .gte("created_at", rangeStart)
      .lte("created_at", rangeEnd);

    if (salesErr) {
      console.error("Erro ao buscar sales:", salesErr);
      return NextResponse.json({ error: salesErr.message }, { status: 500 });
    }

    const pdvTotal = (sales || []).reduce((sum, s) => sum + Number(s.total || 0), 0);
    const pdvCount = (sales || []).length;
    const avgTicket = pdvCount > 0 ? pdvTotal / pdvCount : 0;

    const byPaymentMethod: Record<string, number> = {};
    for (const s of sales || []) {
      const key = s.payment_method || "outro";
      byPaymentMethod[key] = (byPaymentMethod[key] || 0) + Number(s.total || 0);
    }

    // ---------- 2. Categoria (serviço/produto/pacote) via sale_items -> services ----------
    const saleIds = (sales || []).map((s) => s.id);
    const byCategory: Record<string, number> = { service: 0, product: 0, package: 0, outros: 0 };

    if (saleIds.length > 0) {
      const { data: items } = await adminSupabase
        .from("sale_items")
        .select("service_id, quantity, unit_price")
        .in("sale_id", saleIds);

      const serviceIds = Array.from(new Set((items || []).map((i) => i.service_id).filter(Boolean)));
      const categoryMap = new Map<string, string>();
      if (serviceIds.length > 0) {
        const { data: services } = await adminSupabase.from("services").select("id, category").in("id", serviceIds as string[]);
        (services || []).forEach((s) => categoryMap.set(s.id, s.category));
      }

      for (const item of items || []) {
        const category = (item.service_id && categoryMap.get(item.service_id)) || "outros";
        const lineTotal = Number(item.unit_price || 0) * Number(item.quantity || 0);
        byCategory[category] = (byCategory[category] || 0) + lineTotal;
      }
    }

    // ---------- 3. Serviços concluídos na Agenda fora do PDV (não vinculados a nenhuma venda) ----------
    const { data: completedAppointments } = await adminSupabase
      .from("appointments")
      .select("price, paid_via_package_id, status")
      .eq("pet_shop_id", PET_SHOP_ID)
      .eq("status", "concluido")
      .is("paid_via_package_id", null)
      .gte("scheduled_at", rangeStart)
      .lte("scheduled_at", rangeEnd);

    const completedAppointmentsRevenue = (completedAppointments || []).reduce((sum, a) => sum + Number(a.price || 0), 0);

    // ---------- 4. Despesas no período ----------
    const { data: expenses, error: expensesErr } = await adminSupabase
      .from("financial_expenses")
      .select("*")
      .eq("pet_shop_id", PET_SHOP_ID)
      .gte("expense_date", from)
      .lte("expense_date", to);

    if (expensesErr) {
      console.error("Erro ao buscar financial_expenses:", expensesErr);
      return NextResponse.json({ error: expensesErr.message }, { status: 500 });
    }

    const expensesTotal = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const expensesByCategory: Record<string, number> = {};
    for (const e of expenses || []) {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount || 0);
    }

    // ---------- 5. Top clientes (todo o histórico, não limitado ao período) ----------
    const { data: allSales } = await adminSupabase
      .from("sales")
      .select("client_id, total, created_at")
      .eq("pet_shop_id", PET_SHOP_ID)
      .not("client_id", "is", null);

    const clientStats = new Map<string, { total: number; count: number; last: string }>();
    for (const s of allSales || []) {
      if (!s.client_id) continue;
      const prev = clientStats.get(s.client_id) || { total: 0, count: 0, last: s.created_at };
      prev.total += Number(s.total || 0);
      prev.count += 1;
      if (s.created_at > prev.last) prev.last = s.created_at;
      clientStats.set(s.client_id, prev);
    }

    const topClientIds = Array.from(clientStats.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([id]) => id);

    let topClients: any[] = [];
    if (topClientIds.length > 0) {
      const { data: profiles } = await adminSupabase.from("profiles").select("id, full_name, phone").in("id", topClientIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      topClients = topClientIds.map((id) => {
        const stats = clientStats.get(id)!;
        const profile = profileMap.get(id);
        return {
          client_id: id,
          full_name: profile?.full_name || "Cliente",
          phone: profile?.phone || "",
          total_spent: stats.total,
          purchase_count: stats.count,
          avg_ticket: stats.total / stats.count,
          last_purchase_at: stats.last,
        };
      });
    }

    // ---------- 6. Receita diferida de pacotes ativos (créditos já pagos, ainda não usados) ----------
    const { data: activePackages } = await adminSupabase
      .from("client_packages")
      .select("total_credits, used_credits, price_paid")
      .eq("pet_shop_id", PET_SHOP_ID)
      .eq("status", "ativo");

    let deferredPackageValue = 0;
    for (const pkg of activePackages || []) {
      const total = Number(pkg.total_credits) || 0;
      const used = Number(pkg.used_credits) || 0;
      const paid = Number(pkg.price_paid) || 0;
      if (total <= 0) continue;
      const unitValue = paid / total;
      deferredPackageValue += unitValue * Math.max(total - used, 0);
    }

    // ---------- 7. Últimos fechamentos de caixa (contexto operacional) ----------
    const { data: recentSessions } = await adminSupabase
      .from("cash_sessions")
      .select("id, closed_at, opening_amount, expected_amount, counted_amount, difference_amount, closed_by_name")
      .eq("pet_shop_id", PET_SHOP_ID)
      .eq("status", "fechado")
      .order("closed_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      period: { from, to },
      revenue: {
        pdv_total: pdvTotal,
        pdv_count: pdvCount,
        avg_ticket: avgTicket,
        by_payment_method: byPaymentMethod,
        by_category: byCategory,
        completed_appointments_outside_pdv: completedAppointmentsRevenue,
        completed_appointments_count: (completedAppointments || []).length,
      },
      expenses: {
        total: expensesTotal,
        by_category: expensesByCategory,
        items: expenses || [],
      },
      net_result: pdvTotal + completedAppointmentsRevenue - expensesTotal,
      deferred_package_value: deferredPackageValue,
      top_clients: topClients,
      recent_cash_sessions: recentSessions || [],
    });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/financeiro:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
