import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

export const GET = withTenantRoute(async () => {
  try {
    const adminSupabase = createAdminClient();

    // 1. Buscar todos os pets
    const { data: pets, error: petsErr } = await adminSupabase
      .from("pets")
      .select("*")
      .eq("pet_shop_id", getTenantId())
      .order("created_at", { ascending: false });

    if (petsErr) {
      console.error("Erro ao buscar pets:", petsErr);
      return NextResponse.json({ error: petsErr.message }, { status: 500 });
    }

    // 2. Buscar perfis (tutores/clientes)
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("pet_shop_id", getTenantId());
    const profileMap = new Map<string, { full_name: string; phone: string }>();
    if (profiles) {
      profiles.forEach((p) => {
        profileMap.set(p.id, {
          full_name: p.full_name || "Tutor Sem Nome",
          phone: p.phone || "Não informado",
        });
      });
    }

    // 3. Mapear pets enriquecidos com dados do tutor real
    const mappedPets = (pets || []).map((p) => {
      const tutor = p.client_id ? profileMap.get(p.client_id) : null;
      return {
        id: p.id,
        name: p.name,
        species: p.species || "Cachorro",
        breed: p.breed || "Vira-Lata",
        sex: p.sex || "Macho",
        weight: p.weight ? `${p.weight} kg` : "Não inf.",
        weight_raw: p.weight ?? null,
        birth_date: p.birth_date || null,
        coat: p.coat || "Curta",
        color: p.color || "Não inf.",
        is_neutered: p.is_neutered || false,
        observations: p.observations || "Sem observações",
        photo_url: p.photo_url || (p.species === "Gato"
          ? "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80"
          : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80"),
        tutor_id: p.client_id,
        tutor_name: tutor ? tutor.full_name : "Sem Tutor Vinculado",
        tutor_phone: tutor ? tutor.phone : "Não informado",
        created_at: p.created_at,
        current_status: p.current_status || "Em casa",
      };
    });

    return NextResponse.json({
      pets: mappedPets,
      totalCount: mappedPets.length,
    });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/pets:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

export const POST = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const {
      name,
      species,
      breed,
      sex,
      weight,
      coat,
      color,
      is_neutered,
      age_years,
      age_months,
      client_id,
      observations,
      photo_url,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome do pet é obrigatório." }, { status: 400 });
    }

    if (!client_id) {
      return NextResponse.json({ error: "Selecione o tutor (cliente) do pet." }, { status: 400 });
    }

    // Calcular birth_date aproximada baseada na idade (anos e meses)
    let birthDateISO: string | null = null;
    const yearsNum = parseInt(age_years || "0", 10);
    const monthsNum = parseInt(age_months || "0", 10);

    if (yearsNum > 0 || monthsNum > 0) {
      const now = new Date();
      now.setFullYear(now.getFullYear() - yearsNum);
      now.setMonth(now.getMonth() - monthsNum);
      birthDateISO = now.toISOString().split("T")[0];
    }

    const { data: newPet, error: insertErr } = await adminSupabase
      .from("pets")
      .insert({
        name: name.trim(),
        species: species || "Cachorro",
        breed: breed?.trim() || "Vira-Lata",
        sex: sex || "Macho",
        weight: weight ? parseFloat(weight) : null,
        coat: coat || "Curta",
        color: color?.trim() || null,
        is_neutered: Boolean(is_neutered),
        birth_date: birthDateISO,
        client_id: client_id,
        observations: observations?.trim() || null,
        photo_url: photo_url?.trim() || (species === "Gato"
          ? "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80"
          : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80"),
        pet_shop_id: getTenantId(),
        current_status: "Em casa",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Erro ao criar pet:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, pet: newPet });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/pets:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
