"use client";

import { useEffect, useMemo, useState, useRef } from "react";

interface PetOption {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  weight_raw: number | null;
  birth_date: string | null;
  photo_url: string;
  tutor_name: string;
  tutor_phone: string;
}

interface MedicalRecord {
  id: string;
  vet_name: string;
  diagnosis: string;
  treatment: string;
  prescription?: string;
  created_at: string;
}

interface VaccineRecord {
  id: string;
  vaccine_name: string;
  applied_at: string | null;
  next_due_at: string | null;
}

interface WeightLog {
  id: string;
  weight: number;
  recorded_at: string;
}

const formatAge = (birthDate: string | null) => {
  if (!birthDate) return "Idade não informada";
  const birth = new Date(birthDate);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths} meses`;
  if (remMonths === 0) return `${years} ano${years > 1 ? "s" : ""}`;
  return `${years} ano${years > 1 ? "s" : ""} e ${remMonths} meses`;
};

export default function ProntuarioAdminPage() {
  const [petsList, setPetsList] = useState<PetOption[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState<string | null>(null);
  const [petSearch, setPetSearch] = useState("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");

  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"consultas" | "vacinas" | "peso" | "receita">("consultas");

  // Form States para Consulta SOAP Completa
  const [vetName, setVetName] = useState("Dr. Carlos Eduardo (CRMV-SP 48192)");
  const [anamnese, setAnamnese] = useState("");
  const [temp, setTemp] = useState("38.5");
  const [heartRate, setHeartRate] = useState("110");
  const [respRate, setRespRate] = useState("24");
  const [tpc, setTpc] = useState("< 2s");
  const [mucosas, setMucosas] = useState("Normocoradas");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [exams, setExams] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // Vacinas & Peso
  const [newVaccine, setNewVaccine] = useState("V10 Múltipla");
  const [vaccineDate, setVaccineDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [nextVaccineDate, setNextVaccineDate] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [prescriptionText, setPrescriptionText] = useState("");

  const [isSavingConsulta, setIsSavingConsulta] = useState(false);
  const [isSavingVacina, setIsSavingVacina] = useState(false);
  const [isSavingPeso, setIsSavingPeso] = useState(false);

  // PDF Preview & Print State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfSingleRecord, setPdfSingleRecord] = useState<MedicalRecord | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const loadPets = async () => {
    setIsLoadingPets(true);
    setPetsError(null);
    try {
      const res = await fetch("/api/admin/pets");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar os pets.");
      setPetsList(data.pets || []);
      if (!selectedPetId && data.pets?.length > 0) {
        setSelectedPetId(data.pets[0].id);
      }
    } catch (err: any) {
      console.error("Erro ao carregar pets:", err);
      setPetsError(err.message || "Erro ao carregar pets.");
    } finally {
      setIsLoadingPets(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  const selectedPet = petsList.find((p) => p.id === selectedPetId);

  const loadRecord = async (petId: string) => {
    setIsLoadingRecord(true);
    setRecordError(null);
    try {
      const res = await fetch(`/api/admin/prontuario?pet_id=${petId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar o prontuário.");
      setMedicalHistory(data.medicalRecords || []);
      setVaccines(data.vaccines || []);
      setWeightLogs(data.weightLogs || []);
    } catch (err: any) {
      console.error("Erro ao carregar prontuário:", err);
      setRecordError(err.message || "Erro ao carregar prontuário.");
    } finally {
      setIsLoadingRecord(false);
    }
  };

  useEffect(() => {
    if (selectedPetId) loadRecord(selectedPetId);
  }, [selectedPetId]);

  useEffect(() => {
    if (selectedPet?.weight_raw) setNewWeight(String(selectedPet.weight_raw));
  }, [selectedPet?.id]);

  const filteredPets = useMemo(
    () => petsList.filter((p) => p.name.toLowerCase().includes(petSearch.toLowerCase())),
    [petsList, petSearch]
  );

  // Cadastrar Consulta com Sinais Vitais + SOAP
  const handleAddConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim() || !selectedPetId) return;
    setIsSavingConsulta(true);

    // Formatar observações completas no campo treatment
    const structuredNotes = `
📋 SINAIS VITAIS:
• Temp: ${temp} °C | FC: ${heartRate} bpm | FR: ${respRate} mpm
• TPC: ${tpc} | Mucosas: ${mucosas}

💬 ANAMNESE / QUEIXA:
${anamnese || "Sem queixas específicas relatadas."}

💊 CONDUTA & TRATAMENTO:
${treatment || "Acompanhamento clínico."}

🧪 EXAMES SOLICITADOS:
${exams || "Nenhum exame solicitado."}

📅 RETORNO PREVISTO:
${returnDate ? new Date(returnDate).toLocaleDateString("pt-BR") : "A critério do tutor."}
`.trim();

    try {
      const res = await fetch("/api/admin/prontuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "consulta",
          pet_id: selectedPetId,
          vet_name: vetName || "Dr. Veterinário (CRMV)",
          diagnosis: diagnosis.trim(),
          treatment: structuredNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar consulta.");

      setAnamnese("");
      setDiagnosis("");
      setTreatment("");
      setExams("");
      setReturnDate("");
      await loadRecord(selectedPetId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Não foi possível salvar a consulta.");
    } finally {
      setIsSavingConsulta(false);
    }
  };

  const handleAddVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId) return;
    setIsSavingVacina(true);
    try {
      const res = await fetch("/api/admin/prontuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "vacina",
          pet_id: selectedPetId,
          vaccine_name: newVaccine,
          applied_at: vaccineDate || null,
          next_due_at: nextVaccineDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao registrar vacina.");
      await loadRecord(selectedPetId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Não foi possível registrar a vacina.");
    } finally {
      setIsSavingVacina(false);
    }
  };

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId || !newWeight) return;
    setIsSavingPeso(true);
    try {
      const res = await fetch("/api/admin/prontuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "peso", pet_id: selectedPetId, weight: parseFloat(newWeight) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao atualizar peso.");
      await Promise.all([loadRecord(selectedPetId), loadPets()]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Não foi possível atualizar o peso.");
    } finally {
      setIsSavingPeso(false);
    }
  };

  const handleSendPrescription = () => {
    if (!selectedPet) return;
    if (!prescriptionText.trim()) {
      alert("Escreva a prescrição antes de enviar.");
      return;
    }
    const phone = (selectedPet.tutor_phone || "").replace(/\D/g, "");
    if (!phone) {
      alert("Este pet não possui um telefone de tutor cadastrado.");
      return;
    }
    const msg = encodeURIComponent(`RECEITA VETERINÁRIA - ${selectedPet.name}\n\n${prescriptionText}`);
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
  };

  // Disparar Impressão / Salvar como PDF
  const handleTriggerPrint = () => {
    window.print();
  };

  const currentWeightLabel = selectedPet?.weight_raw ? `${selectedPet.weight_raw} kg` : "Não informado";
  const vaccineStatus = (dueDate: string | null) => {
    if (!dueDate) return { label: "Sem data", color: "text-on-surface-variant" };
    const due = new Date(dueDate);
    const now = new Date();
    const daysLeft = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: "Vencida", color: "text-rose-400" };
    if (daysLeft <= 30) return { label: "A vencer", color: "text-amber-400" };
    return { label: "Em dia", color: "text-emerald-400" };
  };

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Principal */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container border border-hairline-border p-6 rounded-2xl extruded-shadow print:hidden">
        <div>
          <div className="flex items-center gap-2 text-primary font-label-bold text-xs uppercase tracking-widest mb-1">
            <span className="material-symbols-outlined text-sm">stethoscope</span>
            Módulo Médico Veterinário
          </div>
          <h1 className="text-headline-md font-headline-md font-bold text-on-surface">Prontuário Eletrônico & Receituário</h1>
        </div>

        {/* Pet Picker + Botão Exportar PDF */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input
                type="text"
                value={petSearch}
                onChange={(e) => setPetSearch(e.target.value)}
                placeholder="Buscar pet..."
                className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>
            <select
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              className="bg-surface-container-lowest border border-hairline-border rounded-xl px-3 py-2.5 text-xs text-on-surface outline-none cursor-pointer max-w-[160px]"
            >
              <option value="">Selecione...</option>
              {filteredPets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPet && (
            <button
              onClick={() => {
                setPdfSingleRecord(null);
                setIsPdfModalOpen(true);
              }}
              className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Gerar PDF do Prontuário
            </button>
          )}
        </div>
      </header>

      {isLoadingPets ? (
        <div className="p-12 text-center text-on-surface-variant bg-elevated-card rounded-2xl border border-hairline-border print:hidden">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">sync</span>
          <p className="font-bold">Carregando pets do sistema...</p>
        </div>
      ) : petsError ? (
        <div className="p-12 text-center bg-elevated-card rounded-2xl border border-rose-500/30 space-y-3 print:hidden">
          <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
          <p className="font-bold text-rose-400">{petsError}</p>
          <button onClick={loadPets} className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:brightness-110 cursor-pointer">
            Tentar novamente
          </button>
        </div>
      ) : !selectedPet ? (
        <div className="p-12 text-center bg-elevated-card rounded-2xl border border-hairline-border print:hidden">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">pets</span>
          <p className="font-bold text-on-surface-variant">Selecione um pet acima para visualizar ou editar o prontuário.</p>
        </div>
      ) : (
        <>
          {/* Card em Destaque do Pet Selecionado */}
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 extruded-shadow print:hidden">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/30 overflow-hidden flex-shrink-0">
                <img src={selectedPet.photo_url} alt={selectedPet.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-headline-md font-bold text-on-surface">{selectedPet.name}</h2>
                  <span className="text-xs font-label-bold bg-primary/20 text-primary px-2.5 py-0.5 rounded-full border border-primary/30">
                    {selectedPet.sex}
                  </span>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  {selectedPet.species} • {selectedPet.breed} • {formatAge(selectedPet.birth_date)}
                </p>
                <p className="text-caption text-outline mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">person</span>
                  Tutor: <strong className="text-on-surface">{selectedPet.tutor_name}</strong> ({selectedPet.tutor_phone})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
              <div className="bg-surface-container p-3 rounded-xl border border-hairline-border text-center flex-1 md:w-28">
                <span className="text-caption text-on-surface-variant block">Peso Atual</span>
                <strong className="text-primary text-headline-sm font-bold">{currentWeightLabel}</strong>
              </div>
              <div className="bg-surface-container p-3 rounded-xl border border-hairline-border text-center flex-1 md:w-28">
                <span className="text-caption text-on-surface-variant block">Vacinas</span>
                <strong className="text-emerald-400 text-headline-sm font-bold">
                  {vaccines.length === 0 ? "Nenhuma" : vaccineStatus(vaccines[0]?.next_due_at).label}
                </strong>
              </div>
            </div>
          </div>

          {/* Abas de Navegação com Scroll Horizontal Fluido no Mobile */}
          <div className="flex border-b border-hairline-border gap-2 overflow-x-auto whitespace-nowrap pb-1 print:hidden touch-pan-x" style={{ WebkitOverflowScrolling: "touch" }}>
            {[
              { id: "consultas", label: "Consultas & Exames", icon: "assignment" },
              { id: "vacinas", label: "Carteira de Vacinas", icon: "vaccines" },
              { id: "peso", label: "Evolução de Peso", icon: "monitoring" },
              { id: "receita", label: "Emitir Receituário", icon: "edit_note" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-label-bold text-xs md:text-body-sm transition-all border-b-2 cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-surface-container text-primary border-primary font-bold"
                    : "text-on-surface-variant hover:text-on-surface border-transparent"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {isLoadingRecord ? (
            <div className="p-12 text-center text-on-surface-variant bg-elevated-card rounded-2xl border border-hairline-border print:hidden">
              <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">sync</span>
              <p className="font-bold">Carregando dados do prontuário...</p>
            </div>
          ) : recordError ? (
            <div className="p-12 text-center bg-elevated-card rounded-2xl border border-rose-500/30 space-y-3 print:hidden">
              <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
              <p className="font-bold text-rose-400">{recordError}</p>
              <button onClick={() => loadRecord(selectedPetId)} className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:brightness-110 cursor-pointer">
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* Conteúdo Aba Consultas & Exame Físico */}
              {activeTab === "consultas" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
                  {/* Formulário SOAP Completo */}
                  <form onSubmit={handleAddConsultation} className="lg:col-span-6 bg-surface-container border border-hairline-border rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="font-label-bold text-headline-sm text-on-surface flex items-center gap-2 border-b border-hairline-border pb-3">
                      <span className="material-symbols-outlined text-primary">add_notes</span>
                      Nova Consulta Clínica / Prontuário SOAP
                    </h3>

                    <div>
                      <label className="block text-caption font-label-bold text-on-surface-variant mb-1">Médico Veterinário Responsável</label>
                      <input
                        type="text"
                        placeholder="Ex: Dr. Carlos Eduardo (CRMV-SP 48192)"
                        value={vetName}
                        onChange={(e) => setVetName(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-2.5 text-on-surface text-body-sm outline-none focus:border-primary"
                      />
                    </div>

                    {/* Sinais Vitais (Grid 3 colunas) */}
                    <div className="space-y-1.5">
                      <span className="text-caption font-label-bold text-primary uppercase tracking-wider block">Sinais Vitais & Exame Físico</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-on-surface-variant block">Temp (°C)</label>
                          <input
                            type="text"
                            value={temp}
                            onChange={(e) => setTemp(e.target.value)}
                            placeholder="38.5"
                            className="w-full bg-surface-container-lowest border border-hairline-border rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-on-surface-variant block">FC (bpm)</label>
                          <input
                            type="text"
                            value={heartRate}
                            onChange={(e) => setHeartRate(e.target.value)}
                            placeholder="110"
                            className="w-full bg-surface-container-lowest border border-hairline-border rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-on-surface-variant block">FR (mpm)</label>
                          <input
                            type="text"
                            value={respRate}
                            onChange={(e) => setRespRate(e.target.value)}
                            placeholder="24"
                            className="w-full bg-surface-container-lowest border border-hairline-border rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-caption font-label-bold text-on-surface-variant mb-1">Anamnese / Queixa Principal</label>
                      <textarea
                        rows={2}
                        placeholder="Relato do tutor, sintomas, apetite, fezes, urina..."
                        value={anamnese}
                        onChange={(e) => setAnamnese(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl p-3 text-on-surface text-body-sm outline-none focus:border-primary resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-caption font-label-bold text-on-surface-variant mb-1">Diagnóstico / Hipótese Diagnóstica</label>
                      <input
                        type="text"
                        placeholder="Ex: Dermatite Atópica Canina / Otite Externa Leve"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        required
                        className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-2.5 text-on-surface text-body-sm outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-caption font-label-bold text-on-surface-variant mb-1">Conduta, Prescrição & Tratamento</label>
                      <textarea
                        rows={3}
                        placeholder="Medicamentos recomendados, dosagem, frequência e orientações..."
                        value={treatment}
                        onChange={(e) => setTreatment(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl p-3 text-on-surface text-body-sm outline-none focus:border-primary resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-caption font-label-bold text-on-surface-variant mb-1">Exames Solicitados</label>
                        <input
                          type="text"
                          placeholder="Hemograma, Ultrassom..."
                          value={exams}
                          onChange={(e) => setExams(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-3 py-2 text-xs text-on-surface outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-caption font-label-bold text-on-surface-variant mb-1">Data de Retorno</label>
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-3 py-2 text-xs text-on-surface outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingConsulta}
                      className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 shadow-md"
                    >
                      <span className="material-symbols-outlined">save</span>
                      {isSavingConsulta ? "Salvando Prontuário..." : "Salvar Prontuário Clínico"}
                    </button>
                  </form>

                  {/* Histórico Registrado */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-label-bold text-headline-sm text-on-surface">Histórico Clínico Registrado</h3>
                    </div>

                    {medicalHistory.length === 0 ? (
                      <p className="text-body-sm text-on-surface-variant">Nenhuma consulta registrada ainda para este pet.</p>
                    ) : (
                      medicalHistory.map((item) => (
                        <div key={item.id} className="bg-elevated-card border border-hairline-border rounded-2xl p-5 space-y-3 extruded-shadow">
                          <div className="flex items-center justify-between border-b border-hairline-border pb-3">
                            <span className="text-caption font-label-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                              {new Date(item.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                            <span className="text-caption font-bold text-on-surface-variant">{item.vet_name}</span>
                          </div>

                          <h4 className="font-bold text-on-surface text-base">{item.diagnosis}</h4>
                          <pre className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap font-sans bg-surface-container p-3 rounded-xl border border-hairline-border/50">
                            {item.treatment || "Sem observações adicionais."}
                          </pre>

                          <button
                            onClick={() => {
                              setPdfSingleRecord(item);
                              setIsPdfModalOpen(true);
                            }}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">print</span>
                            Gerar PDF / Imprimir esta consulta
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Aba Vacinas */}
              {activeTab === "vacinas" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
                  <form onSubmit={handleAddVaccine} className="lg:col-span-5 bg-surface-container border border-hairline-border rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="font-label-bold text-headline-sm text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">vaccines</span>
                      Registrar Nova Vacina
                    </h3>

                    <div>
                      <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Vacina / Imunizante</label>
                      <select
                        value={newVaccine}
                        onChange={(e) => setNewVaccine(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary"
                      >
                        <option value="V10 Múltipla Canina">V10 Múltipla Canina</option>
                        <option value="V8 Múltipla Canina">V8 Múltipla Canina</option>
                        <option value="Antirrábica">Antirrábica</option>
                        <option value="Giardíase">Giardíase</option>
                        <option value="Tosse dos Canis (Gripe)">Tosse dos Canis (Gripe)</option>
                        <option value="Leishmaniose">Leishmaniose</option>
                        <option value="Feline V5 Felina">Feline V5 Felina</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Data da Aplicação</label>
                      <input
                        type="date"
                        value={vaccineDate}
                        onChange={(e) => setVaccineDate(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Data da Próxima Dose</label>
                      <input
                        type="date"
                        value={nextVaccineDate}
                        onChange={(e) => setNextVaccineDate(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingVacina}
                      className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 shadow-md"
                    >
                      <span className="material-symbols-outlined">add_circle</span>
                      {isSavingVacina ? "Salvando..." : "Registrar Vacina"}
                    </button>
                  </form>

                  <div className="lg:col-span-7 bg-elevated-card border border-hairline-border rounded-2xl p-6 space-y-4">
                    <h3 className="font-label-bold text-headline-sm text-on-surface">Carteira de Vacinação</h3>

                    {vaccines.length === 0 ? (
                      <p className="text-body-sm text-on-surface-variant">Nenhuma vacina registrada ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        {vaccines.map((v) => {
                          const status = vaccineStatus(v.next_due_at);
                          return (
                            <div key={v.id} className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-hairline-border">
                              <div>
                                <h4 className="font-label-bold text-on-surface text-body-sm">{v.vaccine_name}</h4>
                                <p className="text-caption text-on-surface-variant">
                                  Aplicada em: {v.applied_at ? new Date(v.applied_at).toLocaleDateString("pt-BR") : "—"}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`text-caption font-label-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20 block ${status.color}`}>
                                  {v.next_due_at ? new Date(v.next_due_at).toLocaleDateString("pt-BR") : "Sem próxima dose"} ({status.label})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aba Peso */}
              {activeTab === "peso" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
                  <form onSubmit={handleAddWeight} className="lg:col-span-5 bg-surface-container border border-hairline-border rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="font-label-bold text-headline-sm text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">scale</span>
                      Registrar Novo Peso
                    </h3>

                    <div>
                      <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Peso Atual (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingPeso}
                      className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-md"
                    >
                      {isSavingPeso ? "Salvando..." : "Atualizar Peso do Pet"}
                    </button>
                  </form>

                  <div className="lg:col-span-7 bg-elevated-card border border-hairline-border rounded-2xl p-6 space-y-4">
                    <h3 className="font-label-bold text-headline-sm text-on-surface">Histórico de Ponderação</h3>
                    {weightLogs.length === 0 ? (
                      <p className="text-body-sm text-on-surface-variant">Nenhum peso registrado ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        {weightLogs.map((w) => (
                          <div key={w.id} className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-hairline-border">
                            <span className="text-body-sm text-on-surface-variant">
                              {new Date(w.recorded_at).toLocaleDateString("pt-BR")}
                            </span>
                            <span className="text-headline-sm font-bold text-primary">{w.weight} kg</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aba Receita */}
              {activeTab === "receita" && (
                <div className="bg-surface-container border border-hairline-border rounded-2xl p-6 space-y-4 max-w-3xl print:hidden">
                  <h3 className="font-label-bold text-headline-sm text-on-surface">Emitir Receituário Veterinário Digital</h3>
                  <textarea
                    rows={8}
                    value={prescriptionText}
                    onChange={(e) => setPrescriptionText(e.target.value)}
                    placeholder={`USO VETERINÁRIO - PRESCRIÇÃO\n----------------------------------------\n1. Medicamento X - 1 comprimido VO a cada 12 horas por 7 dias.\n2. Pomada Y - Aplicar na região afetada 2x ao dia.\n\nOrientações gerais: Retorno em 10 dias.`}
                    className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl p-4 text-on-surface font-mono text-body-sm outline-none resize-none focus:border-primary"
                  ></textarea>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleSendPrescription}
                      className="bg-primary text-on-primary font-label-bold px-6 py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span className="material-symbols-outlined">send</span>
                      Enviar por WhatsApp para {selectedPet.tutor_name}
                    </button>
                    <button
                      onClick={() => {
                        setPdfSingleRecord(null);
                        setIsPdfModalOpen(true);
                      }}
                      className="border border-hairline-border hover:bg-surface-container-high text-on-surface font-label-bold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">print</span>
                      Imprimir / Gerar PDF da Receita
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* MODAL DE PREVIEW E IMPRESSÃO EM PDF DO PRONTUÁRIO */}
      {isPdfModalOpen && selectedPet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container border border-hairline-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header do Modal */}
            <div className="p-4 bg-surface-container-high border-b border-hairline-border flex items-center justify-between print:hidden">
              <h3 className="font-bold text-on-surface text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                Visualização do Documento PDF
              </h3>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTriggerPrint}
                  className="bg-primary text-on-primary font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-2 text-on-surface-variant hover:text-on-surface rounded-xl cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* DOCUMENTO IMPRESSO (LAYOUT CLINICO EM PAPEL BRANCO) */}
            <div className="p-6 md:p-10 overflow-y-auto bg-slate-100 text-slate-900 font-sans" ref={printAreaRef}>
              <div className="bg-white p-8 sm:p-12 shadow-md rounded-lg max-w-3xl mx-auto space-y-6 border border-slate-300">
                {/* Cabeçalho da Clínica */}
                <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-emerald-800 tracking-tight">CLÍNICA VETERINÁRIA</h1>
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Prontuário Médico Veterinário & Receituário</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="font-bold text-slate-800">{vetName}</p>
                    <p>Atendimento Clínico Veterinário</p>
                    <p>Data: {new Date().toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>

                {/* Dados do Paciente e Tutor */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">Paciente / Pet</span>
                    <strong className="text-slate-900 text-sm">{selectedPet.name}</strong>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">Espécie & Raça</span>
                    <strong className="text-slate-900">{selectedPet.species} • {selectedPet.breed}</strong>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">Sexo & Idade</span>
                    <strong className="text-slate-900">{selectedPet.sex} • {formatAge(selectedPet.birth_date)}</strong>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">Tutor / Responsável</span>
                    <strong className="text-slate-900">{selectedPet.tutor_name} ({selectedPet.tutor_phone})</strong>
                  </div>
                </div>

                {/* Se for uma receita digital específica */}
                {prescriptionText && activeTab === "receita" && (
                  <div className="border border-emerald-300 bg-emerald-50/40 rounded-lg p-5 space-y-3">
                    <h3 className="font-bold text-emerald-900 text-sm border-b border-emerald-200 pb-1 uppercase tracking-wider">
                      📋 RECEITUÁRIO MÉDICO VETERINÁRIO
                    </h3>
                    <pre className="text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                      {prescriptionText}
                    </pre>
                  </div>
                )}

                {/* Histórico ou Consulta Específica */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm border-b border-slate-300 pb-1 uppercase tracking-wider">
                    {pdfSingleRecord ? "CONSULTA CLÍNICA SELECIONADA" : "HISTÓRICO DE CONSULTAS REGISTRADAS"}
                  </h3>

                  {(pdfSingleRecord ? [pdfSingleRecord] : medicalHistory).map((record) => (
                    <div key={record.id} className="border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-slate-700 border-b border-slate-100 pb-1">
                        <span>Diagnóstico: {record.diagnosis}</span>
                        <span>{new Date(record.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <pre className="text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                        {record.treatment}
                      </pre>
                    </div>
                  ))}
                </div>

                {/* Vacinas Aplicadas */}
                {vaccines.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm border-b border-slate-300 pb-1 uppercase tracking-wider">
                      💉 CARTEIRA DE VACINAÇÃO
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {vaccines.map((v) => (
                        <div key={v.id} className="border border-slate-200 p-2 rounded bg-slate-50 flex justify-between">
                          <span className="font-bold text-slate-800">{v.vaccine_name}</span>
                          <span className="text-slate-600">{v.applied_at ? new Date(v.applied_at).toLocaleDateString("pt-BR") : "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Campo de Assinatura */}
                <div className="pt-12 text-center space-y-1">
                  <div className="w-64 border-t border-slate-400 mx-auto"></div>
                  <p className="font-bold text-xs text-slate-800">{vetName}</p>
                  <p className="text-[10px] text-slate-500">Médico Veterinário — Assinatura & Carimbo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
