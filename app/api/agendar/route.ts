import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { triggerAutomation } from "@/lib/server/automations";
import { createNotification } from "@/lib/server/notifications";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const {
      tutor_name,
      tutor_phone,
      pet_name,
      pet_breed,
      service_name,
      service_price,
      date,
      time,
      professional,
    } = body;

    if (!tutor_name || !tutor_phone || !pet_name || !service_name || !date || !time) {
      return NextResponse.json(
        { error: "Nome do tutor, WhatsApp, Nome do pet, Serviço, Data e Horário são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanPhone = tutor_phone.replace(/\D/g, "");

    // 1. Verificar se o tutor já possui cadastro na tabela profiles pelo número de telefone
    let clientId: string | null = null;
    let isNewClient = false;

    const { data: existingProfiles } = await adminSupabase
      .from("profiles")
      .select("id, full_name, phone")
      .ilike("phone", `%${cleanPhone.slice(-8)}%`)
      .limit(1);

    if (existingProfiles && existingProfiles.length > 0) {
      clientId = existingProfiles[0].id;
    } else {
      // Criar cadastro básico automático para o novo cliente na tabela profiles
      isNewClient = true;
      const { data: newProfile, error: profileErr } = await adminSupabase
        .from("profiles")
        .insert({
          pet_shop_id: PET_SHOP_ID,
          full_name: tutor_name,
          phone: tutor_phone,
          role: "tutor",
        })
        .select()
        .single();

      if (profileErr) {
        console.error("Erro ao auto-cadastrar cliente em /api/agendar:", profileErr);
        // Fallback: se houver erro ao criar profile, prosseguir com ID gerado temporário
      } else if (newProfile) {
        clientId = newProfile.id;
      }
    }

    // 2. Verificar ou criar cadastro do pet
    let petId: string | null = null;
    if (clientId) {
      const { data: existingPets } = await adminSupabase
        .from("pets")
        .select("id")
        .eq("client_id", clientId)
        .ilike("name", pet_name.trim())
        .limit(1);

      if (existingPets && existingPets.length > 0) {
        petId = existingPets[0].id;
      } else {
        const { data: newPet, error: petErr } = await adminSupabase
          .from("pets")
          .insert({
            client_id: clientId,
            pet_shop_id: PET_SHOP_ID,
            name: pet_name,
            breed: pet_breed || "Não informada",
            species: "Cachorro",
          })
          .select()
          .single();

        if (!petErr && newPet) {
          petId = newPet.id;
        }
      }
    }

    // Se por alguma razão o petId ainda for null, tentar buscar um pet genérico ou criar sem client_id
    if (!petId) {
      const { data: fallbackPet } = await adminSupabase
        .from("pets")
        .insert({
          pet_shop_id: PET_SHOP_ID,
          name: pet_name,
          breed: pet_breed || "Não informada",
          species: "Cachorro",
        })
        .select()
        .single();

      if (fallbackPet) petId = fallbackPet.id;
    }

    if (!petId) {
      return NextResponse.json(
        { error: "Não foi possível registrar o pet para o agendamento." },
        { status: 500 }
      );
    }

    // 3. Montar data/hora do agendamento (ISO)
    const scheduledAt = `${date}T${time}:00`;

    // 4. Inserir o agendamento na tabela appointments
    const { data: appointment, error: apptErr } = await adminSupabase
      .from("appointments")
      .insert({
        pet_id: petId,
        pet_shop_id: PET_SHOP_ID,
        service_type: service_name,
        scheduled_at: scheduledAt,
        status: "agendado",
        price: service_price ? Number(service_price) : 85.0,
        professional: professional || "Qualquer Profissional Disponível",
        notes: `Status: agendado | [STEP:0] | Agendamento via Link Público por ${tutor_name} (${tutor_phone})`,
      })
      .select()
      .single();

    if (apptErr) {
      console.error("Erro ao criar agendamento público:", apptErr);
      return NextResponse.json({ error: apptErr.message }, { status: 500 });
    }

    // 5. Se for um novo cliente, enviar mensagem automática de boas-vindas com link de agendamento
    const hostHeader = request.headers.get("host") || "localhost:3000";
    const protocol = hostHeader.includes("localhost") ? "http" : "https";
    const bookingUrl = `${protocol}://${hostHeader}/agendar`;

    if (isNewClient) {
      await triggerAutomation("boas_vindas_novo_cliente", tutor_phone, {
        tutor_name: tutor_name,
        booking_url: bookingUrl,
      });
    }

    // 6. Disparar notificação e mensagem de agendamento realizado
    const dateFormatted = new Date(scheduledAt).toLocaleDateString("pt-BR");

    await triggerAutomation("agendamento_realizado", tutor_phone, {
      tutor_name,
      pet_name,
      service_name,
      date: dateFormatted,
      time,
    });

    if (clientId) {
      await createNotification({
        clientId,
        appointmentId: appointment.id,
        type: "agendamento_criado",
        title: "Novo agendamento recebido!",
        body: `Agendamento de ${service_name} para ${pet_name} em ${dateFormatted} às ${time}.`,
      });
    }

    return NextResponse.json({
      success: true,
      appointment,
      client_id: clientId,
      is_new_client: isNewClient,
    });
  } catch (err: any) {
    console.error("Erro no POST /api/agendar:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
