import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: List all catalog items
export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    const { data: services, error } = await adminSupabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      // If table doesn't exist or empty, return sensible defaults
      console.warn("Tabela 'services' não encontrada ou erro:", error.message);
      return NextResponse.json({
        services: getDefaultCatalog(),
        isDefault: true,
      });
    }

    if (!services || services.length === 0) {
      return NextResponse.json({
        services: getDefaultCatalog(),
        isDefault: true,
      });
    }

    return NextResponse.json({ services, isDefault: false });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/services:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new catalog item
export async function POST(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const { name, description, duration_minutes, price, category, is_active } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: item, error } = await adminSupabase
      .from("services")
      .insert({
        name,
        description: description || "",
        duration_minutes: duration_minutes || 30,
        price: parseFloat(price),
        category: category || "service",
        is_active: is_active !== false,
        pet_shop_id: "00000000-0000-0000-0000-000000000001",
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao inserir serviço:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/services:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getDefaultCatalog() {
  return [
    { id: "def-1", name: "Banho", description: "Banho padrão com shampoo premium", duration_minutes: 45, price: 60.0, category: "service", is_active: true },
    { id: "def-2", name: "Banho & Tosa Completo", description: "Banho + tosa higiênica + acabamento", duration_minutes: 90, price: 85.0, category: "service", is_active: true },
    { id: "def-3", name: "Tosa Higiênica", description: "Tosa na região higiênica, patas e rosto", duration_minutes: 30, price: 45.0, category: "service", is_active: true },
    { id: "def-4", name: "Hidratação de Pelo", description: "Tratamento capilar profundo para pets", duration_minutes: 40, price: 55.0, category: "service", is_active: true },
    { id: "def-5", name: "Consulta Veterinária Geral", description: "Check-up clínico completo", duration_minutes: 30, price: 150.0, category: "service", is_active: true },
    { id: "def-6", name: "Higienização Auricular & Unhas", description: "Limpeza de ouvido e corte de unhas", duration_minutes: 20, price: 35.0, category: "service", is_active: true },
    { id: "def-7", name: "Ração Premium Cães Adultos 15kg", description: "Ração super premium para cães adultos", duration_minutes: 0, price: 189.9, category: "product", is_active: true },
    { id: "def-8", name: "Shampoo Hipoalergênico Pet 500ml", description: "Shampoo para peles sensíveis", duration_minutes: 0, price: 42.0, category: "product", is_active: true },
    { id: "def-9", name: "Brinquedo Mordedor Resistente", description: "Mordedor de borracha natural para cães", duration_minutes: 0, price: 28.5, category: "product", is_active: true },
    { id: "def-10", name: "Pacote Banho Mensal 4x", description: "4 banhos por mês com desconto", duration_minutes: 45, price: 199.9, category: "package", is_active: true },
    { id: "def-11", name: "Plano Premium Anual", description: "Estética + consulta veterinária mensal", duration_minutes: 0, price: 299.9, category: "package", is_active: true },
  ];
}
