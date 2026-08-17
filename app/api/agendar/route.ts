import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { triggerAutomation } from "@/lib/server/automations";
import { createNotification } from "@/lib/server/notifications";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

export const POST = withTenantRoute(async (request: Request) => {
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
      address,
    } = body;

    // O id do usuário (quando o visitante já está logado) vem da sessão
    // verificada no servidor, nunca do corpo da requisição — evita que
    // qualquer chamador force um user_id alheio e sobrescreva o perfil ou
    // mescle registros de "convidado" na conta de outra pessoa.
    const supabase = createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    const user_id = sessionUser?.id || null;

    if (!tutor_name || !tutor_phone || !pet_name || !service_name || !date || !time) {
      return NextResponse.json(
        { error: "Nome do tutor, WhatsApp, Nome do pet, Serviço, Data e Horário são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanPhone = tutor_phone.replace(/\D/g, "");

    let clientId: string | null = null;
    let isNewClient = false;

    // 1. Resolver profile: prioriza o user_id autenticado se enviado
    if (user_id) {
      clientId = user_id;
      // Garante que o profile existe com dados atualizados e role='client'
      await adminSupabase.from("profiles").upsert({
        id: user_id,
        pet_shop_id: getTenantId(),
        full_name: tutor_name,
        phone: cleanPhone,
        role: "client",
      });

      // Atualiza app_metadata role
      await adminSupabase.auth.admin.updateUserById(user_id, { app_metadata: { role: "client" } }).catch(() => {});

      // Se havia pets vinculados ao telefone sem conta vinculada
      if (cleanPhone.length >= 8) {
        const { data: guests } = await adminSupabase
          .from("profiles")
          .select("id")
          .eq("pet_shop_id", getTenantId())
          .eq("phone", cleanPhone)
          .neq("id", user_id);

        for (const guest of guests || []) {
          await adminSupabase.from("pets").update({ client_id: user_id }).eq("client_id", guest.id);
          await adminSupabase.from("client_packages").update({ client_id: user_id }).eq("client_id", guest.id);
          await adminSupabase.from("notifications").update({ client_id: user_id }).eq("client_id", guest.id);
        }
      }
    } else {
      let matchedProfile: { id: string; phone: string | null } | null = null;

      if (cleanPhone.length >= 8) {
        const { data: byPhone } = await adminSupabase
          .from("profiles")
          .select("id, phone")
          .eq("pet_shop_id", getTenantId())
          .eq("phone", cleanPhone)
          .limit(1);

        matchedProfile = byPhone?.[0] || null;

        if (!matchedProfile) {
          const { data: legacyMatch } = await adminSupabase
            .from("profiles")
            .select("id, phone")
            .eq("pet_shop_id", getTenantId())
            .ilike("phone", `%${cleanPhone.slice(-8)}%`)
            .limit(1);
          matchedProfile = legacyMatch?.[0] || null;
        }
      }

      if (matchedProfile) {
        clientId = matchedProfile.id;
        if (matchedProfile.phone !== cleanPhone) {
          await adminSupabase
            .from("profiles")
            .update({ phone: cleanPhone })
            .eq("id", matchedProfile.id)
            .then(() => {}, () => {});
        }
      } else {
        isNewClient = true;
        const { data: newProfile, error: profileErr } = await adminSupabase
          .from("profiles")
          .insert({
            pet_shop_id: getTenantId(),
            full_name: tutor_name,
            phone: cleanPhone,
            role: "client",
          })
          .select()
          .single();

        if (profileErr || !newProfile) {
          console.error("Erro ao auto-cadastrar cliente em /api/agendar:", profileErr);
          return NextResponse.json(
            { error: "Não foi possível identificar ou cadastrar o tutor para este agendamento." },
            { status: 400 }
          );
        }
        clientId = newProfile.id;
      }
    }

    // 2. Verificar ou criar cadastro do pet (sempre vinculado ao tutor)
    let petId: string | null = null;
    const { data: existingPets } = await adminSupabase
      .from("pets")
      .select("id")
      .eq("pet_shop_id", getTenantId())
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
          pet_shop_id: getTenantId(),
          name: pet_name,
          breed: pet_breed || "Não informada",
          species: "Cachorro",
        })
        .select()
        .single();

      if (petErr || !newPet) {
        console.error("Erro ao cadastrar pet em /api/agendar:", petErr);
        return NextResponse.json(
          { error: "Não foi possível registrar o pet para o agendamento." },
          { status: 500 }
        );
      }
      petId = newPet.id;
    }

    // 3. Resolver serviço e preço a partir do catálogo (sem valor default hardcoded)
    const { data: serviceMatch } = await adminSupabase
      .from("services")
      .select("id, price")
      .eq("pet_shop_id", getTenantId())
      .eq("is_active", true)
      .ilike("name", service_name.trim())
      .maybeSingle();

    const resolvedServiceId = serviceMatch?.id || null;
    const resolvedPrice =
      serviceMatch?.price ?? (service_price !== undefined && service_price !== "" ? Number(service_price) : 0);

    // 4. Montar data/hora do agendamento (ISO) e criar de forma ATÔMICA via RPC
    //    (checagem de conflito + insert; evita reservar horário já tomado).
    const scheduledAt = `${date}T${time}:00`;

    const { data: appointment, error: apptErr } = await adminSupabase.rpc("book_appointment", {
      p_pet_id: petId,
      p_pet_shop_id: getTenantId(),
      p_service_id: resolvedServiceId,
      p_service_type: service_name,
      p_scheduled_at: scheduledAt,
      p_professional: professional || "Não atribuído",
      p_price: resolvedPrice,
      p_notes: `Status: agendado | [STEP:0] | Agendamento via Link Público por ${tutor_name} (${tutor_phone})`,
      p_address: address || "",
      p_package_id: null,
      p_recurring_booking_id: null,
      p_exclude_appointment_id: null,
      p_force: false,
    });

    if (apptErr) {
      const msg = apptErr.message || "";
      if (msg.includes("horario_ocupado")) {
        return NextResponse.json(
          { error: "Esse horário acabou de ser reservado. Escolha outro horário." },
          { status: 409 }
        );
      }
      console.error("Erro ao criar agendamento público:", apptErr);
      return NextResponse.json({ error: msg }, { status: 500 });
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
});
