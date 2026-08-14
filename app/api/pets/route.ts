import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const GET = withTenantRoute(async () => {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ pets: [] });
    }

    const adminSupabase = createAdminClient();

    // Buscar pets do usuário autenticado no servidor
    const { data: pets, error } = await adminSupabase
      .from("pets")
      .select("*")
      .eq("pet_shop_id", getTenantId())
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar pets:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ pets: pets || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

export const POST = withTenantRoute(async (request: Request) => {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const adminSupabase = createAdminClient();

    // 1. Garantir perfil do usuário em profiles sem bloqueio de RLS
    await adminSupabase.from("profiles").upsert({
      id: user.id,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Tutor",
      role: "client",
      pet_shop_id: getTenantId(),
    });

    // 2. Garantir o tenant atual cadastrado
    await adminSupabase.from("pet_shops").upsert({
      id: getTenantId(),
      name: "PetNexus",
    });

    // 3. Checagem de deduplicação para evitar cadastros duplicados por cliques múltiplos
    const recentCutoff = new Date(Date.now() - 15 * 1000).toISOString();
    const { data: existingRecent } = await adminSupabase
      .from("pets")
      .select("*")
      .eq("pet_shop_id", getTenantId())
      .eq("client_id", user.id)
      .ilike("name", body.name.trim())
      .gte("created_at", recentCutoff)
      .limit(1);

    if (existingRecent && existingRecent.length > 0) {
      return NextResponse.json({ success: true, pet: existingRecent[0], deduplicated: true });
    }

    // Calcular birth_date aproximada baseada na idade (anos e meses)
    let birthDateISO: string | null = null;
    const yearsNum = parseInt(body.age_years || "0", 10);
    const monthsNum = parseInt(body.age_months || "0", 10);

    if (yearsNum > 0 || monthsNum > 0) {
      const now = new Date();
      now.setFullYear(now.getFullYear() - yearsNum);
      now.setMonth(now.getMonth() - monthsNum);
      birthDateISO = now.toISOString().split("T")[0];
    }

    // 4. Inserir o pet com segurança no backend
    const { data: pet, error } = await adminSupabase
      .from("pets")
      .insert({
        pet_shop_id: getTenantId(),
        client_id: user.id,
        name: body.name,
        species: body.species || "Cachorro",
        breed: body.breed || "Vira-lata",
        sex: body.sex || "Macho",
        weight: body.weight ? parseFloat(body.weight) : null,
        coat: body.coat || "curta",
        color: body.color || "Caramelo",
        birth_date: birthDateISO,
        photo_url: body.photo_url || null,
        observations: body.observations ? String(body.observations).trim() : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar pet via API:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, pet });
  } catch (err: any) {
    console.error("Erro de API /api/pets:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
