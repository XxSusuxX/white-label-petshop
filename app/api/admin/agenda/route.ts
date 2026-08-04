import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    // 1. Buscar todos os pets
    const { data: pets } = await adminSupabase.from("pets").select("*");
    const petMap = new Map<string, any>();
    if (pets) {
      pets.forEach((p) => petMap.set(p.id, p));
    }

    // 2. Buscar todos os tutores/profiles
    const { data: profiles } = await adminSupabase.from("profiles").select("*");
    const profileMap = new Map<string, any>();
    if (profiles) {
      profiles.forEach((pr) => profileMap.set(pr.id, pr));
    }

    // 3. Buscar agendamentos na tabela service_history
    const { data: history, error: hErr } = await adminSupabase
      .from("service_history")
      .select("*")
      .order("created_at", { ascending: false });

    // Mapear itens da tabela
    const appointmentsList = (history || []).map((h) => {
      const pet = petMap.get(h.pet_id);
      const tutor = pet ? profileMap.get(pet.client_id) : null;

      const dateObj = new Date(h.service_date || h.created_at);
      const day = dateObj.getDate();
      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;

      return {
        id: h.id,
        pet_id: h.pet_id,
        pet_name: pet ? pet.name : "Pet Desconhecido",
        pet_breed: pet ? `${pet.breed || pet.species}` : "Vira-Lata",
        pet_species: pet ? pet.species : "Cachorro",
        pet_photo: pet?.photo_url || null,
        tutor_name: tutor ? tutor.full_name : "Tutor Não Identificado",
        tutor_phone: tutor ? tutor.phone : "Não informado",
        service_type: h.service_type || "Banho & Tosa",
        status: h.notes?.includes("cancelado")
          ? "cancelado"
          : h.notes?.includes("concluido")
          ? "concluido"
          : h.notes?.includes("atendimento")
          ? "em_atendimento"
          : "agendado",
        professional: "Ana Costa (Banhista)",
        price: 85.0,
        day: day,
        month: month,
        year: year,
        date_iso: h.service_date || h.created_at,
        time: timeStr,
        notes: h.notes || "Sem observações adicionais",
      };
    });

    return NextResponse.json({
      appointments: appointmentsList,
      petsList: pets || [],
      tutorsList: profiles || [],
    });
  } catch (err: any) {
    console.error("Erro no GET /api/admin/agenda:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const { pet_id, service_type, service_date, notes, professional } = body;

    if (!pet_id || !service_type) {
      return NextResponse.json(
        { error: "pet_id e service_type são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: newRow, error: insertErr } = await adminSupabase
      .from("service_history")
      .insert({
        pet_id: pet_id,
        pet_shop_id: "00000000-0000-0000-0000-000000000001",
        service_type: service_type,
        service_date: service_date || new Date().toISOString(),
        notes: notes || `Profissional: ${professional || "Groomer"}`,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Erro ao inserir em service_history:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ appointment: newRow, success: true });
  } catch (err: any) {
    console.error("Erro no POST /api/admin/agenda:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
