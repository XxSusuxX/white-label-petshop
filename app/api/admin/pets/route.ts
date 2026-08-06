import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    // 1. Buscar todos os pets
    const { data: pets, error: petsErr } = await adminSupabase
      .from("pets")
      .select("*")
      .order("created_at", { ascending: false });

    if (petsErr) {
      console.error("Erro ao buscar pets:", petsErr);
      return NextResponse.json({ error: petsErr.message }, { status: 500 });
    }

    // 2. Buscar perfis (tutores/clientes)
    const { data: profiles } = await adminSupabase.from("profiles").select("id, full_name, phone, role");
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
}
