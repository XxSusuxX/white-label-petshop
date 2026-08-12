import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findSchedulingConflict } from "@/lib/server/booking";
import { createNotification, getClientIdForPet } from "@/lib/server/notifications";
import { triggerAutomation, getBookingContactInfo } from "@/lib/server/automations";
import { createRecurringBooking, scheduleNextRecurrence } from "@/lib/server/recurring";
import { checkStaffShiftCapacity } from "@/lib/server/staff";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

export const GET = withTenantRoute(async () => {
  try {
    const adminSupabase = createAdminClient();

    // 1. Buscar todos os pets
    const { data: pets } = await adminSupabase
      .from("pets")
      .select("*")
      .eq("pet_shop_id", getTenantId());
    const petMap = new Map<string, any>();
    if (pets) {
      pets.forEach((p) => petMap.set(p.id, p));
    }

    // 2. Buscar todos os tutores/profiles
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("pet_shop_id", getTenantId());
    const profileMap = new Map<string, any>();
    if (profiles) {
      profiles.forEach((pr) => profileMap.set(pr.id, pr));
    }

    // 3. Buscar agendamentos da tabela appointments
    let appointmentsList: any[] = [];

    const { data: appointments, error: apptErr } = await adminSupabase
      .from("appointments")
      .select("*")
      .eq("pet_shop_id", getTenantId())
      .order("scheduled_at", { ascending: false });

    if (!apptErr) {
      appointmentsList = (appointments || []).map((a) => {
        const pet = petMap.get(a.pet_id);
        const tutor = pet ? profileMap.get(pet.client_id) : null;

        const dateObj = new Date(a.scheduled_at);
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");

        // Parse de status com resiliência total a restrições de banco (priorizando a tag mais recente no notes)
        let effectiveStatus = a.status || "agendado";
        const statusMatch = a.notes?.match(/Status:\s*(\w+)/i);
        if (statusMatch && statusMatch[1]) {
          const parsed = statusMatch[1].toLowerCase();
          if (["agendado", "confirmado", "em_atendimento", "pronto", "em_rota", "concluido", "cancelado"].includes(parsed)) {
            effectiveStatus = parsed;
          }
        } else if (a.notes?.includes("Status: concluido") || a.notes?.includes("concluido")) {
          effectiveStatus = "concluido";
        } else if (a.notes?.includes("Status: em_rota") || a.notes?.includes("em_rota")) {
          effectiveStatus = "em_rota";
        } else if (a.notes?.includes("Status: pronto") || a.notes?.includes("pronto")) {
          effectiveStatus = "pronto";
        } else if (a.notes?.includes("Status: em_atendimento") || a.notes?.includes("em_atendimento")) {
          effectiveStatus = "em_atendimento";
        }

        return {
          id: a.id,
          pet_id: a.pet_id,
          pet_name: pet ? pet.name : "Pet Desconhecido",
          pet_breed: pet ? `${pet.breed || pet.species}` : "Vira-Lata",
          pet_species: pet ? pet.species : "Cachorro",
          pet_photo: pet?.photo_url || null,
          tutor_id: pet?.client_id || null,
          tutor_name: tutor ? tutor.full_name : "Tutor Não Identificado",
          tutor_phone: tutor ? tutor.phone : "Não informado",
          service_id: a.service_id || null,
          service_type: a.service_type || "Banho & Tosa",
          status: effectiveStatus,
          professional: a.professional || "Não atribuído",
          price: a.price ?? 85.0,
          day,
          month,
          year,
          date_iso: a.scheduled_at,
          time: `${hours}:${minutes}`,
          notes: a.notes || "",
          address: a.address || "",
          created_at: a.created_at,
          updated_at: a.updated_at,
        };
      });
    } else {
      console.warn("Falha ao consultar appointments, usando service_history como fallback:", apptErr.message);
      const { data: history } = await adminSupabase
        .from("service_history")
        .select("*")
        .eq("pet_shop_id", getTenantId())
        .order("created_at", { ascending: false });

      appointmentsList = (history || []).map((h) => {
        const pet = petMap.get(h.pet_id);
        const tutor = pet ? profileMap.get(pet.client_id) : null;

        const dateObj = new Date(h.service_date || h.created_at);
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");

        const statusMatch = h.notes?.match(/Status:\s*(\w+)/i);
        let parsedStatus = "agendado";
        if (statusMatch && statusMatch[1]) {
          parsedStatus = statusMatch[1].toLowerCase();
        } else if (h.notes?.includes("cancelado")) {
          parsedStatus = "cancelado";
        } else if (h.notes?.includes("concluido") || h.notes?.includes("Status: concluido")) {
          parsedStatus = "concluido";
        } else if (h.notes?.includes("em_rota") || h.notes?.includes("Status: em_rota")) {
          parsedStatus = "em_rota";
        } else if (h.notes?.includes("pronto") || h.notes?.includes("Status: pronto")) {
          parsedStatus = "pronto";
        } else if (h.notes?.includes("em_atendimento") || h.notes?.includes("atendimento")) {
          parsedStatus = "em_atendimento";
        }

        return {
          id: h.id,
          pet_id: h.pet_id,
          pet_name: pet ? pet.name : "Pet Desconhecido",
          pet_breed: pet ? `${pet.breed || pet.species}` : "Vira-Lata",
          pet_species: pet ? pet.species : "Cachorro",
          pet_photo: pet?.photo_url || null,
          tutor_id: pet?.client_id || null,
          tutor_name: tutor ? tutor.full_name : "Tutor Não Identificado",
          tutor_phone: tutor ? tutor.phone : "Não informado",
          service_id: null,
          service_type: h.service_type || "Banho & Tosa",
          status: parsedStatus,
          professional: "Não atribuído",
          price: 85.0,
          day,
          month,
          year,
          date_iso: h.service_date || h.created_at,
          time: `${hours}:${minutes}`,
          notes: h.notes || "",
          created_at: h.created_at,
          updated_at: h.created_at,
        };
      });
    }

    return NextResponse.json({
      appointments: appointmentsList,
      petsList: pets || [],
      tutorsList: profiles || [],
    });
  } catch (err: any) {
    console.error("Erro no GET /api/admin/agenda:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// POST: Criar novo agendamento na tabela appointments (feito pelo admin)
export const POST = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const { pet_id, service_id, service_type, service_date, notes, address, professional, price, force, use_package_id, recurring_interval_days, client_id } = body;

    if (!pet_id || !service_type || !service_date) {
      return NextResponse.json(
        { error: "pet_id, service_type e service_date são obrigatórios" },
        { status: 400 }
      );
    }

    if (client_id) {
      const { data: pet, error: petErr } = await adminSupabase
        .from("pets")
        .select("client_id")
        .eq("id", pet_id)
        .maybeSingle();

      if (petErr || !pet || pet.client_id !== client_id) {
        return NextResponse.json(
          { error: "O pet selecionado não pertence ao cliente informado." },
          { status: 400 }
        );
      }
    }

    if (!force) {
      const conflict = await findSchedulingConflict({
        scheduledAt: service_date,
        serviceId: service_id || null,
        professional: professional || "Não atribuído",
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Já existe um agendamento nesse horário.", conflict },
          { status: 409 }
        );
      }

      const capacity = await checkStaffShiftCapacity(professional, service_date);
      if (!capacity.ok) {
        return NextResponse.json({ error: capacity.reason, capacityWarning: true }, { status: 409 });
      }
    }

    // Se o admin optou por debitar de um pacote do tutor, valida antes (mensagem
    // amigável). O CONSUMO do crédito + INSERT são feitos de forma ATÔMICA pela
    // RPC book_appointment() — se o insert falhar, o crédito não se perde.
    let finalPrice = price ?? 85.0;
    if (use_package_id) {
      const { data: pkg } = await adminSupabase
        .from("client_packages")
        .select("id, service_id, status, used_credits, total_credits")
        .eq("id", use_package_id)
        .eq("pet_shop_id", getTenantId())
        .maybeSingle();

      if (!pkg || pkg.service_id !== service_id || pkg.status !== "ativo" || pkg.used_credits >= pkg.total_credits) {
        return NextResponse.json({ error: "Pacote inválido ou sem créditos disponíveis." }, { status: 400 });
      }
      finalPrice = 0;
    }

    // Se o admin marcou recorrência, cria o "molde" antes do primeiro agendamento
    // para que ele já nasça vinculado (recurring_booking_id).
    let recurringBookingId: string | null = null;
    if (recurring_interval_days && Number(recurring_interval_days) > 0) {
      recurringBookingId = await createRecurringBooking({
        petId: pet_id,
        serviceId: service_id || null,
        serviceType: service_type,
        professional: professional || "Não atribuído",
        price: finalPrice,
        address: address || "",
        intervalDays: Number(recurring_interval_days),
      });
    }

    const { data: newRow, error: insertErr } = await adminSupabase.rpc("book_appointment", {
      p_pet_id: pet_id,
      p_pet_shop_id: getTenantId(),
      p_service_id: service_id || null,
      p_service_type: service_type,
      p_scheduled_at: service_date,
      p_professional: professional || "Não atribuído",
      p_price: finalPrice,
      p_notes: notes || "Status: agendado | [STEP:0]",
      p_address: address || "",
      p_package_id: use_package_id || null,
      p_recurring_booking_id: recurringBookingId,
      p_exclude_appointment_id: null,
      p_force: !!force,
    });

    if (insertErr) {
      // Se o agendamento não pôde ser criado, desfaz a recorrência criada acima
      // (o crédito do pacote já é revertido automaticamente pela RPC).
      if (recurringBookingId) {
        await adminSupabase
          .from("recurring_bookings")
          .delete()
          .eq("id", recurringBookingId)
          .then(() => {}, () => {});
      }

      const msg = insertErr.message || "";
      if (msg.includes("horario_ocupado")) {
        return NextResponse.json({ error: "Já existe um agendamento nesse horário." }, { status: 409 });
      }
      if (msg.includes("pacote_sem_credito")) {
        return NextResponse.json({ error: "Pacote inválido ou sem créditos disponíveis." }, { status: 409 });
      }
      console.error("Erro ao criar agendamento (admin):", insertErr);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const clientId = await getClientIdForPet(pet_id);
    if (clientId) {
      const dateLabel = new Date(service_date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
      await createNotification({
        clientId,
        appointmentId: newRow.id,
        type: "agendamento_confirmado",
        title: "Agendamento realizado",
        body: `Seu agendamento de ${service_type} para ${dateLabel} foi registrado com sucesso.`,
      });
    }

    return NextResponse.json({ appointment: newRow, success: true });
  } catch (err: any) {
    console.error("Erro no POST /api/admin/agenda:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// PATCH: Alterar status e/ou reagendar (data, serviço, profissional, pet, observações)
export const PATCH = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const { id, status, notes, address, service_date, service_id, service_type, professional, price, force } = body;

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = await adminSupabase
      .from("appointments")
      .select("*")
      .eq("pet_shop_id", getTenantId())
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const isReschedule = service_date !== undefined && service_date !== existing.scheduled_at;
    if (isReschedule && !force) {
      const conflict = await findSchedulingConflict({
        scheduledAt: service_date,
        serviceId: service_id ?? existing.service_id,
        professional: professional ?? existing.professional,
        excludeAppointmentId: id,
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Já existe um agendamento nesse horário.", conflict },
          { status: 409 }
        );
      }
    }

    if ((isReschedule || professional !== undefined) && !force) {
      const capacity = await checkStaffShiftCapacity(
        professional ?? existing.professional,
        service_date ?? existing.scheduled_at
      );
      if (!capacity.ok) {
        return NextResponse.json({ error: capacity.reason, capacityWarning: true }, { status: 409 });
      }
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (address !== undefined) updateData.address = address;
    if (service_date !== undefined) updateData.scheduled_at = service_date;
    if (service_id !== undefined) updateData.service_id = service_id;
    if (service_type !== undefined) updateData.service_type = service_type;
    if (professional !== undefined) updateData.professional = professional;
    if (price !== undefined) updateData.price = price;

    // Se um novo status for informado, injetar tag de status limpa na frente das notes
    if (status) {
      const baseNotes = updateData.notes !== undefined ? updateData.notes : existing.notes || "";
      const cleanedNotes = baseNotes
        .replace(/Status:\s*\w+\s*\|?/gi, "")
        .replace(/\[STATUS:\w+\]\s*\|?/gi, "")
        .trim();
      updateData.notes = cleanedNotes ? `Status: ${status} | ${cleanedNotes}` : `Status: ${status}`;
    }

    let { data, error } = await adminSupabase
      .from("appointments")
      .update(updateData)
      .eq("pet_shop_id", getTenantId())
      .eq("id", id)
      .select()
      .single();

    // Se o Postgres recusar por restricao appointments_status_check ('pronto' ou 'em_rota' nao permitidos na CHECK constraint do banco)
    if (error && (error.code === "23514" || error.message.includes("appointments_status_check") || error.message.includes("check constraint"))) {
      console.warn("Restrição appointments_status_check acionada no Supabase. Usando status 'confirmado' com tag no notes:", error.message);
      const fallbackData = { ...updateData, status: "confirmado" };
      const retryRes = await adminSupabase
        .from("appointments")
        .update(fallbackData)
        .eq("pet_shop_id", getTenantId())
        .eq("id", id)
        .select()
        .single();

      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      console.error("Erro ao atualizar agendamento:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const clientId = await getClientIdForPet(data.pet_id);
    if (clientId) {
      if (status !== undefined && status !== existing.status) {
        const STATUS_MESSAGES: Record<string, { title: string; body: string; type: any }> = {
          confirmado: { title: "Agendamento confirmado", body: `Seu agendamento de ${data.service_type} foi confirmado.`, type: "agendamento_confirmado" },
          em_atendimento: { title: "Atendimento iniciado ✂️", body: `O atendimento de ${data.service_type} do seu pet começou agora.`, type: "agendamento_alterado" },
          pronto: { title: "Pet pronto para busca 🐾", body: `Seu pet está pronto para ser buscado no petshop!`, type: "agendamento_alterado" },
          em_rota: { title: "Pet em rota de entrega 🚚", body: `Seu pet saiu para entrega e está a caminho do seu endereço!`, type: "agendamento_alterado" },
          concluido: { title: "Atendimento concluído 🎉", body: `O atendimento de ${data.service_type} foi finalizado com sucesso.`, type: "agendamento_alterado" },
          cancelado: { title: "Agendamento cancelado", body: `Seu agendamento de ${data.service_type} foi cancelado.`, type: "agendamento_cancelado" },
        };
        const msg = STATUS_MESSAGES[status];
        if (msg) await createNotification({ clientId, appointmentId: id, ...msg });

        // Dispara automações reais de WhatsApp para qualquer mudança de status (best-effort)
        const info = await getBookingContactInfo(data.pet_id);
        if (info?.tutorPhone) {
          const RULE_KEYS: Record<string, string> = {
            confirmado: "agendamento_confirmado",
            em_atendimento: "atendimento_iniciado",
            pronto: "pet_pronto",
            concluido: "atendimento_concluido",
            cancelado: "agendamento_cancelado",
          };
          const ruleKey = RULE_KEYS[status];
          if (ruleKey) {
            const dateStr = data.scheduled_at
              ? new Date(data.scheduled_at).toLocaleDateString("pt-BR")
              : "";
            const timeStr = data.scheduled_at
              ? new Date(data.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              : "";

            await triggerAutomation(ruleKey, info.tutorPhone, {
              tutor_name: info.tutorName,
              pet_name: info.petName,
              service_name: data.service_type || "Serviço",
              date: dateStr,
              time: timeStr,
            });
          }

          if (status === "concluido") {
            await triggerAutomation("pedido_avaliacao", info.tutorPhone, {
              tutor_name: info.tutorName,
              pet_name: info.petName,
              service_name: data.service_type || "",
            });
          }
        }

        // Se este agendamento pertence a uma recorrência ativa, cria automaticamente a próxima ocorrência
        if (status === "concluido") {
          await scheduleNextRecurrence({
            pet_id: data.pet_id,
            service_id: data.service_id,
            service_type: data.service_type,
            professional: data.professional,
            price: data.price,
            address: data.address,
            scheduled_at: data.scheduled_at,
            recurring_booking_id: data.recurring_booking_id,
          });
        }
      } else if (isReschedule) {
        const dateLabel = new Date(data.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
        await createNotification({
          clientId,
          appointmentId: id,
          type: "agendamento_alterado",
          title: "Agendamento alterado",
          body: `Seu agendamento de ${data.service_type} foi remarcado para ${dateLabel}.`,
        });
      }
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (err: any) {
    console.error("Erro no PATCH /api/admin/agenda:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// DELETE: Excluir agendamento por ID fisicamente no Supabase
export const DELETE = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    const { error: err1 } = await adminSupabase
      .from("appointments")
      .delete()
      .eq("pet_shop_id", getTenantId())
      .eq("id", id);

    const { error: err2 } = await adminSupabase
      .from("service_history")
      .delete()
      .eq("pet_shop_id", getTenantId())
      .eq("id", id);

    if (err1 && err2) {
      console.error("Erro ao excluir agendamento do Supabase:", err1?.message, err2?.message);
      return NextResponse.json({ error: err1.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro no DELETE /api/admin/agenda:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
