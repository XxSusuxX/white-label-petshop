import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

interface CheckoutItem {
  id: string;
  name: string;
  category: "product" | "service" | "package";
  price: number;
  qty: number;
}

// POST: Finaliza uma venda do PDV, persistindo o cabeçalho (sales), os itens (sale_items),
// a movimentação de entrada no caixa aberto, a baixa de estoque de produtos e a
// criação de pacotes/créditos para o tutor (quando o carrinho tiver itens de pacote).
export const POST = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();
    const { client_id, payment_method, items, subtotal, discount, total } = body as {
      client_id: string | null;
      payment_method: string;
      items: CheckoutItem[];
      subtotal: number;
      discount: number;
      total: number;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "O carrinho está vazio." }, { status: 400 });
    }

    const realItems = items.filter((item) => !item.id.startsWith("def-"));
    const packageItems = realItems.filter((item) => item.category === "package");

    if (packageItems.length > 0 && !client_id) {
      return NextResponse.json(
        { error: "Selecione um cliente cadastrado para vender um pacote (não é possível vincular a um tutor avulso)." },
        { status: 400 }
      );
    }

    const { data: openSession } = await adminSupabase
      .from("cash_sessions")
      .select("id")
      .eq("pet_shop_id", getTenantId())
      .eq("status", "aberto")
      .maybeSingle();

    if (!openSession) {
      return NextResponse.json(
        { error: "Nenhum caixa aberto. Abra o caixa antes de realizar vendas." },
        { status: 400 }
      );
    }

    // 1. Baixa de estoque atômica para produtos (antes de criar a venda — se faltar
    // estoque de algum item, a venda inteira é abortada sem deixar registro parcial).
    const productItems = realItems.filter((item) => item.category === "product");
    const decrementedSoFar: { id: string; qty: number }[] = [];

    for (const item of productItems) {
      const { data: ok, error } = await adminSupabase.rpc("decrement_stock", {
        item_id: item.id,
        qty: item.qty,
      });

      if (error || !ok) {
        // Reverte as baixas já aplicadas nesta mesma tentativa de venda
        for (const done of decrementedSoFar) {
          await adminSupabase.rpc("decrement_stock", { item_id: done.id, qty: -done.qty });
        }
        return NextResponse.json(
          { error: `Estoque insuficiente para "${item.name}".` },
          { status: 409 }
        );
      }
      decrementedSoFar.push({ id: item.id, qty: item.qty });
    }

    // 2. Cabeçalho da venda
    const { data: sale, error: saleErr } = await adminSupabase
      .from("sales")
      .insert({
        pet_shop_id: getTenantId(),
        client_id: client_id || null,
        payment_method,
        subtotal,
        discount,
        total,
      })
      .select()
      .single();

    if (saleErr) {
      console.error("Erro ao criar venda:", saleErr);
      return NextResponse.json({ error: saleErr.message }, { status: 500 });
    }

    // 3. Itens da venda
    const itemsPayload = realItems.map((item) => ({
      sale_id: sale.id,
      service_id: item.id,
      name: item.name,
      quantity: item.qty,
      unit_price: item.price,
    }));

    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await adminSupabase.from("sale_items").insert(itemsPayload);
      if (itemsErr) {
        console.error("Erro ao salvar itens da venda:", itemsErr);
        return NextResponse.json({ error: itemsErr.message }, { status: 500 });
      }
    }

    // 4. Movimentação de caixa
    const { error: movementErr } = await adminSupabase.from("cash_movements").insert({
      cash_session_id: openSession.id,
      type: "entrada",
      amount: total,
      payment_method,
      description: `Venda PDV #${sale.id.slice(0, 8).toUpperCase()}`,
      sale_id: sale.id,
    });
    if (movementErr) {
      console.error("Erro ao registrar movimentação de caixa da venda:", movementErr);
    }

    // 5. Pacotes comprados: criar client_packages com os créditos definidos no catálogo
    if (packageItems.length > 0 && client_id) {
      const { data: packageServices } = await adminSupabase
        .from("services")
        .select("id, package_credits, package_validity_days")
        .in("id", packageItems.map((i) => i.id));

      const serviceMap = new Map((packageServices || []).map((s) => [s.id, s]));

      for (const item of packageItems) {
        const svc = serviceMap.get(item.id);
        const credits = (svc?.package_credits || 1) * item.qty;
        const validityDays = svc?.package_validity_days;
        const expiresAt = validityDays
          ? new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString()
          : null;

        const { error: pkgErr } = await adminSupabase.from("client_packages").insert({
          pet_shop_id: getTenantId(),
          client_id,
          service_id: item.id,
          package_name: item.name,
          total_credits: credits,
          used_credits: 0,
          price_paid: item.price * item.qty,
          expires_at: expiresAt,
          status: "ativo",
          sale_id: sale.id,
        });
        if (pkgErr) {
          console.error("Erro ao criar pacote do cliente:", pkgErr);
        }
      }
    }

    return NextResponse.json({ success: true, sale });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/pdv/checkout:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
