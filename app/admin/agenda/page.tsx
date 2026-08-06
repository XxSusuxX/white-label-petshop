"use client";

import { useState, useEffect, useMemo } from "react";

interface Appointment {
  id: string;
  pet_id: string;
  pet_name: string;
  pet_breed: string;
  pet_species: string;
  pet_photo?: string | null;
  tutor_id?: string | null;
  tutor_name: string;
  tutor_phone: string;
  service_id?: string | null;
  service_type: string;
  status: "agendado" | "confirmado" | "em_atendimento" | "concluido" | "cancelado" | "bloqueio";
  professional: string;
  price: number;
  day: number;
  month: number;
  year: number;
  date_iso: string;
  time: string;
  notes?: string;
  address?: string;
}

const PROFESSIONALS = ["Ana Costa (Banhista)", "Carlos Silva (Groomer)", "Dr. Pedro (Veterinário)"];

const STATUS_LABELS: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em Atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  bloqueio: "Bloqueio",
};

interface PetOption {
  id: string;
  name: string;
  breed?: string;
  client_id?: string;
}

interface TutorOption {
  id: string;
  full_name?: string;
  phone?: string;
}

interface CatalogItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  duration_minutes?: number;
}

export default function HashikoAdminAgendaPage() {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"mes" | "semana" | "dia" | "lista">("mes");

  // Filters State (Exatamente como na tela do Hashiko)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState("Todos os profissionais");
  const [selectedType, setSelectedType] = useState("Todos os tipos");
  const [selectedStatus, setSelectedStatus] = useState("Todos os status");
  const [hideCanceled, setHideCanceled] = useState(true);

  // Data & Modal State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [petsList, setPetsList] = useState<PetOption[]>([]);
  const [tutorsList, setTutorsList] = useState<TutorOption[]>([]);
  const [catalogList, setCatalogList] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [selectedDayDrawer, setSelectedDayDrawer] = useState<number | null>(null);
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState<Appointment | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editServiceId, setEditServiceId] = useState("");
  const [editProfessional, setEditProfessional] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isSavingDetail, setIsSavingDetail] = useState(false);

  // Form State para Novo Agendamento
  const [formPetId, setFormPetId] = useState("");
  const [formServiceId, setFormServiceId] = useState("");
  const [formProfessional, setFormProfessional] = useState("Ana Costa (Banhista)");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState("09:00");
  const [formNotes, setFormNotes] = useState("");

  // 1. Carregar agendamentos e cadastros do Supabase
  const loadAgendaData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [agendaRes, servicesRes] = await Promise.all([
        fetch("/api/admin/agenda"),
        fetch("/api/admin/services"),
      ]);
      const data = await agendaRes.json();
      const servicesData = await servicesRes.json();

      if (!agendaRes.ok) {
        throw new Error(data?.error || "Não foi possível carregar a agenda.");
      }

      if (data.petsList) setPetsList(data.petsList);
      if (data.tutorsList) setTutorsList(data.tutorsList);
      setAppointments(data.appointments || []);

      const services: CatalogItem[] = (servicesData.services || []).filter(
        (s: any) => !s.category || s.category === "service"
      );
      setCatalogList(services);
      if (services.length > 0) setFormServiceId((prev) => prev || services[0].id);
    } catch (err: any) {
      console.error("Erro ao carregar dados da agenda:", err);
      setLoadError(err.message || "Erro ao carregar dados da agenda.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgendaData();
  }, []);

  // 2. Navegação de Datas (< Hoje >)
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "mes") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "semana") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "mes") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "semana") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Formatação do título de mês/ano (ex: "Agosto de 2026")
  const currentMonthYearTitle = useMemo(() => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${months[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
  }, [currentDate]);

  // 3. Filtragem Inteligente Estilo Hashiko
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Filtro de cancelados ocultos
      if (hideCanceled && app.status === "cancelado") {
        return false;
      }

      // Filtro de busca textual
      const matchesSearch =
        !searchTerm ||
        app.pet_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.tutor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.professional.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.service_type.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de profissional (comparação exata — evita falsos positivos por substring)
      const matchesProf =
        selectedProfessional === "Todos os profissionais" ||
        app.professional === selectedProfessional;

      // Filtro de tipo de serviço
      const matchesType =
        selectedType === "Todos os tipos" ||
        app.service_type.toLowerCase().includes(selectedType.toLowerCase());

      // Filtro de status
      const matchesStatus =
        selectedStatus === "Todos os status" ||
        (selectedStatus === "Agendado" && app.status === "agendado") ||
        (selectedStatus === "Em Atendimento" && app.status === "em_atendimento") ||
        (selectedStatus === "Concluído" && app.status === "concluido") ||
        (selectedStatus === "Cancelado" && app.status === "cancelado");

      return matchesSearch && matchesProf && matchesType && matchesStatus;
    });
  }, [appointments, searchTerm, selectedProfessional, selectedType, selectedStatus, hideCanceled]);

  // Map de agendamentos por dia do mês atual
  const appointmentsByDayMap = useMemo(() => {
    const map = new Map<number, Appointment[]>();
    filteredAppointments.forEach((app) => {
      if (app.month === currentDate.getMonth() + 1 && app.year === currentDate.getFullYear()) {
        const list = map.get(app.day) || [];
        list.push(app);
        map.set(app.day, list);
      }
    });
    return map;
  }, [filteredAppointments, currentDate]);

  // Grade real do mês (dias do mês anterior/atual/seguinte, sem chutar 31 dias fixos)
  const monthGridCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { day: number; inCurrentMonth: boolean }[] = [];
    for (let i = firstWeekday - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, inCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, inCurrentMonth: true });
    }
    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ day: nextDay++, inCurrentMonth: false });
    }
    return cells;
  }, [currentDate]);

  // Datas reais da semana (Seg a Dom) contendo currentDate
  const weekDates = useMemo(() => {
    const base = new Date(currentDate);
    const dow = base.getDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    base.setDate(base.getDate() + diffToMonday);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const isSameDay = (d: Date, day: number, month: number, year: number) =>
    d.getDate() === day && d.getMonth() + 1 === month && d.getFullYear() === year;

  // 4. Salvar Novo Agendamento no Supabase
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPetId) {
      alert("Por favor, selecione um pet.");
      return;
    }
    const selectedService = catalogList.find((s) => s.id === formServiceId);
    if (!selectedService) {
      alert("Por favor, selecione um serviço.");
      return;
    }

    try {
      const res = await fetch("/api/admin/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet_id: formPetId,
          service_id: selectedService.id,
          service_type: selectedService.name,
          service_date: `${formDate}T${formTime}:00.000Z`,
          professional: formProfessional,
          price: selectedService.price,
          notes: formNotes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        setFormNotes("");
        await loadAgendaData();
      } else {
        alert(data?.error || "Erro ao salvar no Supabase.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao salvar agendamento.");
    }
  };

  // 5. Atualizar status de um agendamento existente (usado na visão Lista e no Kanban)
  const handleUpdateStatus = async (id: string, newStatus: Appointment["status"]) => {
    const prevAppointments = appointments;
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    try {
      const res = await fetch("/api/admin/agenda", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Falha ao atualizar status.");
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      setAppointments(prevAppointments);
      alert("Não foi possível atualizar o status. Tente novamente.");
    }
  };

  // 6. Abrir modal de detalhes de um agendamento (preenche o form de edição)
  const openAppointmentDetail = (app: Appointment) => {
    setSelectedAppointmentDetail(app);
    setIsEditingDetail(false);
    const d = new Date(app.date_iso);
    setEditDate(d.toISOString().slice(0, 10));
    setEditTime(app.time);
    setEditServiceId(app.service_id || "");
    setEditProfessional(app.professional);
    setEditNotes(app.notes || "");
    setEditAddress(app.address || "");
  };

  // 7. Salvar edição (reagendamento) de um agendamento existente
  const handleSaveDetailEdit = async () => {
    if (!selectedAppointmentDetail) return;
    const selectedService = catalogList.find((s) => s.id === editServiceId);
    setIsSavingDetail(true);
    try {
      const res = await fetch("/api/admin/agenda", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAppointmentDetail.id,
          service_date: `${editDate}T${editTime}:00.000Z`,
          service_id: selectedService?.id || null,
          service_type: selectedService?.name || selectedAppointmentDetail.service_type,
          price: selectedService?.price ?? selectedAppointmentDetail.price,
          professional: editProfessional,
          notes: editNotes,
          address: editAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Não foi possível salvar as alterações.");
        return;
      }
      setIsEditingDetail(false);
      setSelectedAppointmentDetail(null);
      await loadAgendaData();
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao salvar alterações.");
    } finally {
      setIsSavingDetail(false);
    }
  };

  const handleCancelFromDetail = async () => {
    if (!selectedAppointmentDetail) return;
    if (!confirm("Cancelar este agendamento?")) return;
    await handleUpdateStatus(selectedAppointmentDetail.id, "cancelado");
    setSelectedAppointmentDetail(null);
  };

  // Helper de badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "em_atendimento":
        return (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Em Atendimento
          </span>
        );
      case "concluido":
        return (
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Concluído
          </span>
        );
      case "cancelado":
        return (
          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-bold uppercase">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-[10px] font-bold uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Agendado
          </span>
        );
    }
  };

  return (
    <div className="w-full min-h-screen bg-matte-canvas text-on-surface p-4 md:p-8 space-y-6">
      {/* 1. Header Bar Identica ao Hashiko */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container border border-hairline-border p-4 rounded-2xl extruded-shadow">
        {/* Date Controls (< Hoje > + Título) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-container-high border border-hairline-border rounded-xl p-1">
            <button
              onClick={handlePrev}
              title="Anterior"
              className="px-3 py-1.5 hover:bg-surface-container-highest rounded-lg text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              &lt;
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-1.5 bg-matte-canvas hover:bg-surface-container-highest rounded-lg font-bold text-xs text-on-surface transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              title="Próximo"
              className="px-3 py-1.5 hover:bg-surface-container-highest rounded-lg text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              &gt;
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
              {currentMonthYearTitle}
            </h1>
          </div>
        </div>

        {/* Right Header: View Mode Tabs + + Novo Agendamento */}
        <div className="flex items-center gap-3">
          {/* View Mode Tabs (Mês, Semana, Dia, Lista) */}
          <div className="flex bg-surface-container-high rounded-xl p-1 border border-hairline-border">
            {(["mes", "semana", "dia", "lista"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {mode === "mes" ? "Mês" : mode === "semana" ? "Semana" : mode === "dia" ? "Dia" : "Lista"}
              </button>
            ))}
          </div>

          {/* Botão + Novo Agendamento (Destacado em Laranja/Verde) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-on-primary font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 extruded-shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            + Novo Agendamento
          </button>
        </div>
      </div>

      {/* 2. Rich Filter Bar (Filtros Hashiko) */}
      <div className="bg-surface-container border border-hairline-border p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex-1 relative min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por pet, tutor ou profissional..."
            className="w-full bg-matte-canvas border border-hairline-border rounded-xl pl-10 pr-4 py-2 text-xs text-on-surface placeholder:text-outline focus:border-primary outline-none"
          />
        </div>

        {/* Dropdowns de Filtro */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Profissionais */}
          <select
            value={selectedProfessional}
            onChange={(e) => setSelectedProfessional(e.target.value)}
            className="bg-matte-canvas border border-hairline-border rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary outline-none cursor-pointer"
          >
            <option value="Todos os profissionais">Todos os profissionais</option>
            {PROFESSIONALS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Tipos */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-matte-canvas border border-hairline-border rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary outline-none cursor-pointer"
          >
            <option value="Todos os tipos">Todos os tipos</option>
            <option value="Banho">Banho</option>
            <option value="Tosa">Tosa</option>
            <option value="Banho & Tosa">Banho & Tosa</option>
            <option value="Consulta Vet">Consulta Vet</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-matte-canvas border border-hairline-border rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary outline-none cursor-pointer"
          >
            <option value="Todos os status">Todos os status</option>
            <option value="Agendado">Agendado</option>
            <option value="Em Atendimento">Em Atendimento</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          {/* Toggle Cancelados Ocultos */}
          <button
            onClick={() => setHideCanceled(!hideCanceled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              hideCanceled
                ? "bg-surface-container-high border-hairline-border text-on-surface-variant"
                : "bg-rose-500/20 border-rose-500/30 text-rose-400"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {hideCanceled ? "visibility_off" : "visibility"}
            </span>
            {hideCanceled ? "Cancelados ocultos" : "Cancelados visíveis"}
          </button>

          {/* Atalhos */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="px-3 py-2 bg-matte-canvas border border-hairline-border hover:border-primary/50 text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">keyboard</span>
            Atalhos
          </button>
        </div>
      </div>

      {/* 3. Renderização Dinâmica por Modo (Mês, Semana, Dia, Lista) */}
      {isLoading ? (
        <div className="p-12 text-center text-on-surface-variant bg-elevated-card rounded-2xl border border-hairline-border">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">sync</span>
          <p className="font-bold">Carregando agendamentos do Supabase...</p>
        </div>
      ) : loadError ? (
        <div className="p-12 text-center bg-elevated-card rounded-2xl border border-rose-500/30 space-y-3">
          <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
          <p className="font-bold text-rose-400">{loadError}</p>
          <button
            onClick={loadAgendaData}
            className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:brightness-110 cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      ) : viewMode === "mes" ? (
        /* VISÃO MÊS (GRADE DE CALENDÁRIO HASHIKO) */
        <div className="bg-elevated-card border border-hairline-border rounded-2xl overflow-hidden extruded-shadow">
          {/* Cabeçalho dos Dias (DOM, SEG, TER, QUA, QUI, SEX, SÁB) */}
          <div className="grid grid-cols-7 bg-surface-container-low border-b border-hairline-border text-center">
            {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((d) => (
              <div key={d} className="py-3 text-caption font-bold text-on-surface-variant uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Grade real do mês (dias reais + preenchimento do mês anterior/seguinte) */}
          <div className="grid grid-cols-7">
            {monthGridCells.map((cell, cellIdx) => {
              if (!cell.inCurrentMonth) {
                return (
                  <div key={`out-${cellIdx}`} className="p-3 border-r border-b border-hairline-border bg-surface/30 opacity-30 min-h-[120px]">
                    <span className="text-xs font-bold text-on-surface-variant">{cell.day}</span>
                  </div>
                );
              }

              const dayNum = cell.day;
              const now = new Date();
              const isToday = isSameDay(now, dayNum, currentDate.getMonth() + 1, currentDate.getFullYear());
              const dayAppts = appointmentsByDayMap.get(dayNum) || [];

              return (
                <div
                  key={`cur-${dayNum}`}
                  onClick={() => dayAppts.length > 0 && setSelectedDayDrawer(dayNum)}
                  className={`p-2 border-r border-b border-hairline-border min-h-[120px] transition-all cursor-pointer relative flex flex-col justify-between group ${
                    isToday ? "bg-primary/5" : "hover:bg-surface-container-highest/40"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? "bg-primary text-on-primary font-bold shadow-md" : "text-on-surface"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {dayAppts.length} agend.
                      </span>
                    )}
                  </div>

                  {/* Lista de Cartões/Chips dentro da Célula */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayAppts.slice(0, 2).map((app) => (
                      <div
                        key={app.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openAppointmentDetail(app);
                        }}
                        className="bg-surface-container border border-hairline-border p-1.5 rounded-lg text-[10px] space-y-0.5 hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-primary truncate">{app.pet_name}</span>
                          <span className="text-on-surface-variant font-mono">{app.time}</span>
                        </div>
                        <div className="text-on-surface-variant truncate">{app.service_type}</div>
                      </div>
                    ))}
                    {dayAppts.length > 2 && (
                      <div className="text-[9px] font-bold text-primary text-center">
                        + {dayAppts.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === "semana" ? (
        /* VISÃO SEMANA (CRONOGRAMA DE 7 DIAS POR HORÁRIO) */
        <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg text-primary">Visão Semanal de Agendamentos</h2>
          <div className="grid grid-cols-7 gap-3">
            {weekDates.map((wd) => {
              const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
              const label = `${dayLabels[wd.getDay()]} ${String(wd.getDate()).padStart(2, "0")}/${String(wd.getMonth() + 1).padStart(2, "0")}`;
              return (
                <div key={wd.toISOString()} className="bg-surface-container border border-hairline-border rounded-xl p-3 space-y-3">
                  <div className="font-bold text-xs text-center border-b border-hairline-border pb-2 text-on-surface">
                    {label}
                  </div>
                  <div className="space-y-2">
                    {filteredAppointments
                      .filter((a) => isSameDay(wd, a.day, a.month, a.year))
                      .map((app) => (
                        <div
                          key={app.id}
                          onClick={() => openAppointmentDetail(app)}
                          className="bg-matte-canvas p-2 rounded-lg border border-hairline-border text-xs space-y-1 cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <div className="font-bold text-primary">{app.pet_name} ({app.time})</div>
                          <div className="text-[10px] text-on-surface-variant">{app.service_type}</div>
                          <div>{renderStatusBadge(app.status)}</div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === "dia" ? (
        /* VISÃO DIA (COLUNAS POR PROFISSIONAL) */
        <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg text-primary">
            Visão por Profissional ({String(currentDate.getDate()).padStart(2, "0")}/{String(currentDate.getMonth() + 1).padStart(2, "0")})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROFESSIONALS.map((prof) => (
              <div key={prof} className="bg-surface-container border border-hairline-border rounded-xl p-4 space-y-3">
                <div className="font-bold text-sm text-center border-b border-hairline-border pb-2 text-primary flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">person</span>
                  {prof}
                </div>
                <div className="space-y-2">
                  {filteredAppointments
                    .filter((a) => a.professional === prof && isSameDay(currentDate, a.day, a.month, a.year))
                    .map((app) => (
                      <div
                        key={app.id}
                        onClick={() => setSelectedAppointmentDetail(app)}
                        className="bg-matte-canvas p-3 rounded-xl border border-hairline-border space-y-1.5 cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="flex justify-between font-bold text-xs">
                          <span className="text-on-surface">{app.pet_name}</span>
                          <span className="text-primary">{app.time}</span>
                        </div>
                        <div className="text-xs text-on-surface-variant">Tutor: {app.tutor_name}</div>
                        <div className="text-xs text-on-surface-variant font-bold">{app.service_type}</div>
                        <div>{renderStatusBadge(app.status)}</div>
                      </div>
                    ))}
                  {filteredAppointments.filter((a) => a.professional === prof && isSameDay(currentDate, a.day, a.month, a.year)).length === 0 && (
                    <p className="text-[11px] text-on-surface-variant text-center py-3">Nenhum agendamento.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Agendamentos do dia sem profissional atribuído */}
          {(() => {
            const unassigned = filteredAppointments.filter(
              (a) => !PROFESSIONALS.includes(a.professional) && isSameDay(currentDate, a.day, a.month, a.year)
            );
            if (unassigned.length === 0) return null;
            return (
              <div className="bg-surface-container border border-amber-500/30 rounded-xl p-4 space-y-3">
                <div className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">person_off</span>
                  Sem profissional atribuído ({unassigned.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {unassigned.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedAppointmentDetail(app)}
                      className="bg-matte-canvas p-3 rounded-xl border border-hairline-border space-y-1.5 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex justify-between font-bold text-xs">
                        <span className="text-on-surface">{app.pet_name}</span>
                        <span className="text-primary">{app.time}</span>
                      </div>
                      <div className="text-xs text-on-surface-variant">Tutor: {app.tutor_name}</div>
                      <div className="text-xs text-on-surface-variant font-bold">{app.service_type}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* VISÃO LISTA (TABELA COMPLETA COM AÇÕES) */
        <div className="bg-elevated-card border border-hairline-border rounded-2xl overflow-hidden extruded-shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline-border bg-surface-container-low text-xs text-on-surface-variant uppercase font-bold">
                  <th className="p-4">Horário / Data</th>
                  <th className="p-4">Pet / Raça</th>
                  <th className="p-4">Tutor</th>
                  <th className="p-4">Serviço</th>
                  <th className="p-4">Profissional</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-border text-xs">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                      Nenhum agendamento encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-surface-container-high/30 transition-colors">
                      <td className="p-4 font-bold text-primary cursor-pointer" onClick={() => openAppointmentDetail(app)}>
                        {app.time} ({String(app.day).padStart(2, "0")}/{String(app.month).padStart(2, "0")})
                      </td>
                      <td className="p-4 font-bold text-on-surface cursor-pointer" onClick={() => openAppointmentDetail(app)}>
                        {app.pet_name} <span className="text-[10px] text-on-surface-variant font-normal">({app.pet_breed})</span>
                      </td>
                      <td className="p-4 text-on-surface-variant">{app.tutor_name}</td>
                      <td className="p-4 font-bold text-on-surface">{app.service_type}</td>
                      <td className="p-4 text-on-surface-variant">{app.professional}</td>
                      <td className="p-4 text-center">{renderStatusBadge(app.status)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={app.status}
                            onChange={(e) => handleUpdateStatus(app.id, e.target.value as Appointment["status"])}
                            className="bg-matte-canvas border border-hairline-border rounded px-2 py-1 text-[11px] text-on-surface cursor-pointer"
                          >
                            <option value="agendado">Agendado</option>
                            <option value="confirmado">Confirmado</option>
                            <option value="em_atendimento">Em Atendimento</option>
                            <option value="concluido">Concluído</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                          <button
                            onClick={() => openAppointmentDetail(app)}
                            title="Ver detalhes"
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer: Agendamentos do dia selecionado no calendário mensal */}
      {selectedDayDrawer !== null && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col p-6 space-y-4 extruded-shadow">
            <div className="flex justify-between items-center border-b border-hairline-border pb-3">
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event</span>
                Agendamentos do dia {String(selectedDayDrawer).padStart(2, "0")}/{String(currentDate.getMonth() + 1).padStart(2, "0")}
              </h3>
              <button onClick={() => setSelectedDayDrawer(null)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {(appointmentsByDayMap.get(selectedDayDrawer) || []).map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedDayDrawer(null);
                    openAppointmentDetail(app);
                  }}
                  className="bg-surface-container border border-hairline-border p-3 rounded-xl cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm text-on-surface">{app.pet_name} <span className="text-on-surface-variant font-normal text-xs">• {app.tutor_name}</span></div>
                    <div className="text-xs text-on-surface-variant">{app.service_type} — {app.professional}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-primary text-sm font-bold">{app.time}</div>
                    {renderStatusBadge(app.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes completos de um agendamento (visualizar / editar / cancelar) */}
      {selectedAppointmentDetail && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col p-6 space-y-5 extruded-shadow">
            <div className="flex justify-between items-center border-b border-hairline-border pb-3">
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_note</span>
                Detalhes do Agendamento
              </h3>
              <button
                onClick={() => {
                  setSelectedAppointmentDetail(null);
                  setIsEditingDetail(false);
                }}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-sm">
              {!isEditingDetail ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-on-surface text-base">{selectedAppointmentDetail.pet_name}</h4>
                      <p className="text-xs text-on-surface-variant">{selectedAppointmentDetail.pet_breed}</p>
                    </div>
                    {renderStatusBadge(selectedAppointmentDetail.status)}
                  </div>

                  <div className="bg-surface-container rounded-xl border border-hairline-border p-4 space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-on-surface-variant">Tutor</span><span className="font-bold text-on-surface">{selectedAppointmentDetail.tutor_name}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Telefone</span><span className="font-bold text-on-surface">{selectedAppointmentDetail.tutor_phone}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Serviço</span><span className="font-bold text-on-surface">{selectedAppointmentDetail.service_type}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Profissional</span><span className="font-bold text-on-surface">{selectedAppointmentDetail.professional}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Data</span><span className="font-bold text-on-surface">{String(selectedAppointmentDetail.day).padStart(2, "0")}/{String(selectedAppointmentDetail.month).padStart(2, "0")}/{selectedAppointmentDetail.year}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Horário</span><span className="font-bold text-on-surface">{selectedAppointmentDetail.time}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Duração estimada</span><span className="font-bold text-on-surface">{catalogList.find((s) => s.id === selectedAppointmentDetail.service_id)?.duration_minutes ? `${catalogList.find((s) => s.id === selectedAppointmentDetail.service_id)?.duration_minutes} min` : "—"}</span></div>
                    <div className="flex justify-between pt-2 border-t border-hairline-border/50"><span className="text-on-surface-variant">Valor</span><span className="font-bold text-primary">R$ {selectedAppointmentDetail.price.toFixed(2)}</span></div>
                  </div>

                  {selectedAppointmentDetail.address && (
                    <div className="bg-surface-container rounded-xl border border-hairline-border p-3 text-xs">
                      <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px] block mb-1">Endereço de Coleta</span>
                      {selectedAppointmentDetail.address}
                    </div>
                  )}

                  {selectedAppointmentDetail.notes && (
                    <div className="bg-surface-container rounded-xl border border-hairline-border p-3 text-xs">
                      <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px] block mb-1">Observações</span>
                      {selectedAppointmentDetail.notes}
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-on-surface mb-1.5 text-xs">Alterar Status</label>
                    <select
                      value={selectedAppointmentDetail.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as Appointment["status"];
                        handleUpdateStatus(selectedAppointmentDetail.id, newStatus);
                        setSelectedAppointmentDetail({ ...selectedAppointmentDetail, status: newStatus });
                      }}
                      className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-2.5 text-on-surface text-xs cursor-pointer outline-none focus:border-primary"
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-on-surface mb-1 text-xs">Data</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-2.5 text-on-surface text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface mb-1 text-xs">Horário</label>
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-2.5 text-on-surface text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface mb-1 text-xs">Serviço</label>
                    <select
                      value={editServiceId}
                      onChange={(e) => setEditServiceId(e.target.value)}
                      className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-2.5 text-on-surface text-xs outline-none cursor-pointer focus:border-primary"
                    >
                      <option value="">-- Manter serviço atual --</option>
                      {catalogList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} (R$ {s.price.toFixed(2)})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface mb-1 text-xs">Profissional</label>
                    <select
                      value={editProfessional}
                      onChange={(e) => setEditProfessional(e.target.value)}
                      className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-2.5 text-on-surface text-xs outline-none cursor-pointer focus:border-primary"
                    >
                      {PROFESSIONALS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface mb-1 text-xs">Endereço de Coleta</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-2.5 text-on-surface text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface mb-1 text-xs">Observações</label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-2.5 text-on-surface text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ações do Modal */}
            <div className="flex gap-2 pt-3 border-t border-hairline-border">
              {isEditingDetail ? (
                <>
                  <button
                    onClick={() => setIsEditingDetail(false)}
                    className="flex-1 py-2.5 bg-surface-container text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-high cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                  <button
                    onClick={handleSaveDetailEdit}
                    disabled={isSavingDetail}
                    className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:brightness-110 cursor-pointer disabled:opacity-60"
                  >
                    {isSavingDetail ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </>
              ) : (
                <>
                  {selectedAppointmentDetail.status !== "cancelado" && (
                    <button
                      onClick={handleCancelFromDetail}
                      className="flex-1 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl hover:bg-rose-500/20 cursor-pointer"
                    >
                      Cancelar Agendamento
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditingDetail(true)}
                    className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:brightness-110 cursor-pointer"
                  >
                    Editar / Reagendar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal para Novo Agendamento (Conectado ao Supabase) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-md w-full p-6 space-y-5 extruded-shadow">
            <div className="flex justify-between items-center border-b border-hairline-border pb-3">
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                + Novo Agendamento (Admin)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-4 text-xs">
              {/* Seleção do Pet do Banco */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Selecione o Pet (Cadastrado no Banco)</label>
                <select
                  required
                  value={formPetId}
                  onChange={(e) => setFormPetId(e.target.value)}
                  className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-3 text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="">-- Selecione o Pet --</option>
                  {petsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.breed || "Vira-lata"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Serviço (catálogo real cadastrado em Serviços) */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Tipo de Serviço</label>
                <select
                  required
                  value={formServiceId}
                  onChange={(e) => setFormServiceId(e.target.value)}
                  className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-3 text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="">-- Selecione o Serviço --</option>
                  {catalogList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (R$ {s.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Profissional */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Profissional Responsável</label>
                <select
                  value={formProfessional}
                  onChange={(e) => setFormProfessional(e.target.value)}
                  className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-3 text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  {PROFESSIONALS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-2.5 text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface mb-1">Horário</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-2.5 text-on-surface focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Pet nervoso com secador..."
                  className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-2.5 text-on-surface focus:border-primary outline-none"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl hover:brightness-110 extruded-shadow cursor-pointer"
                >
                  Salvar no Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal de Atalhos de Teclado */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-hairline-border pb-2">
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">keyboard</span>
                Atalhos da Agenda
              </h3>
              <button onClick={() => setIsShortcutsOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="space-y-2 text-xs text-on-surface">
              <div className="flex justify-between"><span>Novo Agendamento:</span> <kbd className="bg-matte-canvas px-2 py-0.5 rounded border border-hairline-border">N</kbd></div>
              <div className="flex justify-between"><span>Visão Mês:</span> <kbd className="bg-matte-canvas px-2 py-0.5 rounded border border-hairline-border">M</kbd></div>
              <div className="flex justify-between"><span>Visão Semana:</span> <kbd className="bg-matte-canvas px-2 py-0.5 rounded border border-hairline-border">S</kbd></div>
              <div className="flex justify-between"><span>Visão Dia:</span> <kbd className="bg-matte-canvas px-2 py-0.5 rounded border border-hairline-border">D</kbd></div>
              <div className="flex justify-between"><span>Ir para Hoje:</span> <kbd className="bg-matte-canvas px-2 py-0.5 rounded border border-hairline-border">H</kbd></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
