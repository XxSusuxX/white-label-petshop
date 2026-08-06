import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET: Catálogo de serviços ativos — leitura pública (usada pelo agendamento
// do cliente e pela página pública /agendar), sem dados sensíveis.
export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    const { data: services, error } = await adminSupabase
      .from("services")
      .select("id, name, description, duration_minutes, price, category")
      .eq("is_active", true)
      .eq("category", "service")
      .order("name", { ascending: true });

    if (error || !services || services.length === 0) {
      return NextResponse.json({ services: getDefaultServices() });
    }

    return NextResponse.json({ services });
  } catch (err: any) {
    console.error("Erro em GET /api/services:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getDefaultServices() {
  return [
    { id: "def-1", name: "Banho", description: "Banho padrão com shampoo premium", duration_minutes: 45, price: 60.0, category: "service" },
    { id: "def-2", name: "Banho & Tosa Completo", description: "Banho + tosa higiênica + acabamento", duration_minutes: 90, price: 85.0, category: "service" },
    { id: "def-3", name: "Tosa Higiênica", description: "Tosa na região higiênica, patas e rosto", duration_minutes: 30, price: 45.0, category: "service" },
  ];
}
