"use client";

import { useState, useEffect, useMemo } from "react";

interface Appointment {
  id: string;
  pet_id: string;
  pet_name: string;
  pet_breed: string;
  pet_species: string;
  pet_photo?: string | null;
  tutor_name: string;
  tutor_phone: string;
  service_type: string;
  status: "agendado" | "em_atendimento" | "concluido" | "cancelado";
  professional: string;
  price: number;
  day: number;
  month: number;
  year: number;
  date_iso: string;
  time: string;
  notes?: string;
}

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

export default function HashikoAdminAgendaPage() {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 3)); // 03 de Agosto de 2026
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
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [selectedDayDrawer, setSelectedDayDrawer] = useState<number | null>(null);

  // Form State para Novo Agendamento
  const [formPetId, setFormPetId] = useState("");
  const [formServiceType, setFormServiceType] = useState("Banho & Tosa");
  const [formProfessional, setFormProfessional] = useState("Ana Costa (Banhista)");
  const [formDate, setFormDate] = useState("2026-08-03");
  const [formTime, setFormTime] = useState("09:00");
  const [formNotes, setFormNotes] = useState("");

  // 1. Carregar agendamentos e cadastros do Supabase
  const loadAgendaData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/agenda");
      const data = await res.json();
      if (res.ok) {
        if (data.petsList) setPetsList(data.petsList);
        if (data.tutorsList) setTutorsList(data.tutorsList);

        // Agendamentos iniciais com fallbacks ricos se o banco estiver limpo
        const dbAppts: Appointment[] = data.appointments || [];

        // Exemplo de agendamentos reais e demonstrativos formatados como no Hashiko
        const defaultDemoAppts: Appointment[] = [
          {
            id: "demo-1",
            pet_id: "p1",
            pet_name: "Titi",
            pet_breed: "Gato Vira-Lata",
            pet_species: "Gato",
            tutor_name: "dev.suenaga@gmail.com",
            tutor_phone: "(11) 99999-0001",
            service_type: "Banho & Tosa",
            status: "agendado",
            professional: "Ana Costa (Banhista)",
            price: 90.0,
            day: 3,
            month: 8,
            year: 2026,
            date_iso: "2026-08-03T09:00:00.000Z",
            time: "09:00",
            notes: "Cuidado com Mancha Caramelo",
          },
          {
            id: "demo-2",
            pet_id: "p2",
            pet_name: "Rex",
            pet_breed: "Golden Retriever",
            pet_species: "Cachorro",
            tutor_name: "Gabriel H",
            tutor_phone: "(11) 98888-0002",
            service_type: "Consulta Vet",
            status: "em_atendimento",
            professional: "Dr. Pedro (Veterinário)",
            price: 150.0,
            day: 3,
            month: 8,
            year: 2026,
            date_iso: "2026-08-03T11:30:00.000Z",
            time: "11:30",
            notes: "Check-up de rotina",
          },
          {
            id: "demo-3",
            pet_id: "p3",
            pet_name: "Thor",
            pet_breed: "Bulldog",
            pet_species: "Cachorro",
            tutor_name: "Carlos Silva",
            tutor_phone: "(11) 97777-0003",
            service_type: "Tosa Higiênica",
            status: "concluido",
            professional: "Carlos Silva (Groomer)",
            price: 75.0,
            day: 5,
            month: 8,
            year: 2026,
            date_iso: "2026-08-05T14:00:00.000Z",
            time: "14:00",
            notes: "Concluído com sucesso",
          },
          {
            id: "demo-4",
            pet_id: "p4",
            pet_name: "Bella",
            pet_breed: "Poodle",
            pet_species: "Cachorro",
            tutor_name: "Mariana Costa",
            tutor_phone: "(11) 96666-0004",
            service_type: "Banho",
            status: "cancelado",
            professional: "Ana Costa (Banhista)",
            price: 60.0,
            day: 7,
            month: 8,
            year: 2026,
            date_iso: "2026-08-07T10:00:00.000Z",
            time: "10:00",
            notes: "Cancelado pelo tutor",
          },
        ];

        setAppointments(dbAppts.length > 0 ? [...dbAppts, ...defaultDemoAppts] : defaultDemoAppts);
      }
    } catch (err) {
      console.error("Erro ao carregar dados da agenda:", err);
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
    setCurrentDate(new Date(2026, 7, 3));
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

      // Filtro de profissional
      const matchesProf =
        selectedProfessional === "Todos os profissionais" ||
        app.professional.includes(selectedProfessional.split(" ")[0]);

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

  // 4. Salvar Novo Agendamento no Supabase
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPetId) {
      alert("Por favor, selecione um pet.");
      return;
    }

    const selectedPet = petsList.find((p) => p.id === formPetId);
    const selectedTutor = tutorsList.find((t) => t.id === selectedPet?.client_id);

    const [year, month, day] = formDate.split("-").map(Number);

    try {
      const res = await fetch("/api/admin/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet_id: formPetId,
          service_type: formServiceType,
          service_date: `${formDate}T${formTime}:00.000Z`,
          professional: formProfessional,
          notes: formNotes,
        }),
      });

      if (res.ok) {
        // Inserção local instantânea
        const newApp: Appointment = {
          id: `new-${Date.now()}`,
          pet_id: formPetId,
          pet_name: selectedPet ? selectedPet.name : "Pet Cadastrado",
          pet_breed: selectedPet?.breed || "Cachorro",
          pet_species: "Cachorro",
          tutor_name: selectedTutor?.full_name || "Tutor Cadastrado",
          tutor_phone: selectedTutor?.phone || "Não informado",
          service_type: formServiceType,
          status: "agendado",
          professional: formProfessional,
          price: 90.0,
          day: day,
          month: month,
          year: year,
          date_iso: `${formDate}T${formTime}:00.000Z`,
          time: formTime,
          notes: formNotes,
        };

        setAppointments((prev) => [newApp, ...prev]);
        setIsModalOpen(false);
        alert("Agendamento criado com sucesso no banco de dados!");
      } else {
        alert("Erro ao salvar no Supabase.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao salvar agendamento.");
    }
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
            <option value="Ana Costa">Ana Costa (Banhista)</option>
            <option value="Carlos Silva">Carlos Silva (Groomer)</option>
            <option value="Dr. Pedro">Dr. Pedro (Veterinário)</option>
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

          {/* Grade de 35 Células de Julho/Agosto */}
          <div className="grid grid-cols-7">
            {/* Dias anteriores do mês passado (26 a 31) */}
            {[26, 27, 28, 29, 30, 31].map((d) => (
              <div key={`prev-${d}`} className="p-3 border-r border-b border-hairline-border bg-surface/30 opacity-30 min-h-[120px]">
                <span className="text-xs font-bold text-on-surface-variant">{d}</span>
              </div>
            ))}

            {/* Dias do Mês Atual (1 a 31) */}
            {Array.from({ length: 31 }, (_, idx) => {
              const dayNum = idx + 1;
              const isToday = dayNum === 3; // Dia 3 de Agosto
              const dayAppts = appointmentsByDayMap.get(dayNum) || [];

              return (
                <div
                  key={dayNum}
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
                        className="bg-surface-container border border-hairline-border p-1.5 rounded-lg text-[10px] space-y-0.5 hover:border-primary/50 transition-colors"
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
            {["Seg 03/08", "Ter 04/08", "Qua 05/08", "Qui 06/08", "Sex 07/08", "Sáb 08/08", "Dom 09/08"].map((dayName, idx) => (
              <div key={dayName} className="bg-surface-container border border-hairline-border rounded-xl p-3 space-y-3">
                <div className="font-bold text-xs text-center border-b border-hairline-border pb-2 text-on-surface">
                  {dayName}
                </div>
                <div className="space-y-2">
                  {filteredAppointments
                    .filter((a) => a.day === idx + 3)
                    .map((app) => (
                      <div key={app.id} className="bg-matte-canvas p-2 rounded-lg border border-hairline-border text-xs space-y-1">
                        <div className="font-bold text-primary">{app.pet_name} ({app.time})</div>
                        <div className="text-[10px] text-on-surface-variant">{app.service_type}</div>
                        <div>{renderStatusBadge(app.status)}</div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === "dia" ? (
        /* VISÃO DIA (COLUNAS POR PROFISSIONAL) */
        <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg text-primary">Visão por Profissional (Dia 03 de Agosto)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Ana Costa (Banhista)", "Carlos Silva (Groomer)", "Dr. Pedro (Veterinário)"].map((prof) => (
              <div key={prof} className="bg-surface-container border border-hairline-border rounded-xl p-4 space-y-3">
                <div className="font-bold text-sm text-center border-b border-hairline-border pb-2 text-primary flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">person</span>
                  {prof}
                </div>
                <div className="space-y-2">
                  {filteredAppointments
                    .filter((a) => a.professional.includes(prof.split(" ")[0]))
                    .map((app) => (
                      <div key={app.id} className="bg-matte-canvas p-3 rounded-xl border border-hairline-border space-y-1.5">
                        <div className="flex justify-between font-bold text-xs">
                          <span className="text-on-surface">{app.pet_name}</span>
                          <span className="text-primary">{app.time}</span>
                        </div>
                        <div className="text-xs text-on-surface-variant">Tutor: {app.tutor_name}</div>
                        <div className="text-xs text-on-surface-variant font-bold">{app.service_type}</div>
                        <div>{renderStatusBadge(app.status)}</div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
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
                      <td className="p-4 font-bold text-primary">{app.time} ({app.day}/08)</td>
                      <td className="p-4 font-bold text-on-surface">
                        {app.pet_name} <span className="text-[10px] text-on-surface-variant font-normal">({app.pet_breed})</span>
                      </td>
                      <td className="p-4 text-on-surface-variant">{app.tutor_name}</td>
                      <td className="p-4 font-bold text-on-surface">{app.service_type}</td>
                      <td className="p-4 text-on-surface-variant">{app.professional}</td>
                      <td className="p-4 text-center">{renderStatusBadge(app.status)}</td>
                      <td className="p-4 text-right">
                        <select
                          value={app.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as any;
                            setAppointments((prev) =>
                              prev.map((item) => (item.id === app.id ? { ...item, status: newStatus } : item))
                            );
                          }}
                          className="bg-matte-canvas border border-hairline-border rounded px-2 py-1 text-[11px] text-on-surface cursor-pointer"
                        >
                          <option value="agendado">Agendado</option>
                          <option value="em_atendimento">Em Atendimento</option>
                          <option value="concluido">Concluído</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

              {/* Tipo de Serviço */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Tipo de Serviço</label>
                <select
                  value={formServiceType}
                  onChange={(e) => setFormServiceType(e.target.value)}
                  className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-3 text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Banho & Tosa">Banho & Tosa</option>
                  <option value="Banho Completo">Banho Completo</option>
                  <option value="Tosa Higiênica">Tosa Higiênica</option>
                  <option value="Consulta Vet">Consulta Vet</option>
                  <option value="Táxi Dog">Táxi Dog</option>
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
                  <option value="Ana Costa (Banhista)">Ana Costa (Banhista)</option>
                  <option value="Carlos Silva (Groomer)">Carlos Silva (Groomer)</option>
                  <option value="Dr. Pedro (Veterinário)">Dr. Pedro (Veterinário)</option>
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
