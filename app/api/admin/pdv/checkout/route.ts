import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

// POST: Finaliza uma venda do PDV, persistindo o cabeçalho (sales), os itens (sale_items)
// e a movimentação de entrada no caixa aberto (exige um caixa aberto para vender).
export async function POST(request: Request) {
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

    const { data: openSession } = await adminSupabase
      .from("cash_sessions")
      .select("id")
      .eq("pet_shop_id", PET_SHOP_ID)
      .eq("status", "aberto")
      .maybeSingle();

    if (!openSession) {
      return NextResponse.json(
        { error: "Nenhum caixa aberto. Abra o caixa antes de realizar vendas." },
        { status: 400 }
      );
    }

    const { data: sale, error: saleErr } = await adminSupabase
      .from("sales")
      .insert({
        pet_shop_id: "00000000-0000-0000-0000-000000000001",
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

    const itemsPayload = items
      .filter((item) => !item.id.startsWith("def-"))
      .map((item) => ({
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

    return NextResponse.json({ success: true, sale });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/pdv/checkout:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
