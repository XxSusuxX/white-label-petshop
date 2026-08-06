"use client";

import { useEffect, useMemo, useState } from "react";

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
  prescription: string;
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

  // Form States
  const [vetName, setVetName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [newVaccine, setNewVaccine] = useState("V10 Múltipla");
  const [vaccineDate, setVaccineDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [nextVaccineDate, setNextVaccineDate] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [prescriptionText, setPrescriptionText] = useState("");
  const [isSavingConsulta, setIsSavingConsulta] = useState(false);
  const [isSavingVacina, setIsSavingVacina] = useState(false);
  const [isSavingPeso, setIsSavingPeso] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleAddConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim() || !selectedPetId) return;
    setIsSavingConsulta(true);
    try {
      const res = await fetch("/api/admin/prontuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "consulta",
          pet_id: selectedPetId,
          vet_name: vetName || "Equipe Veterinária",
          diagnosis,
          treatment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar consulta.");
      setDiagnosis("");
      setTreatment("");
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
    const msg = encodeURIComponent(`Receita veterinária para ${selectedPet.name}:\n\n${prescriptionText}`);
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
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
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container border border-hairline-border p-6 rounded-2xl extruded-shadow">
          <div>
            <div className="flex items-center gap-2 text-primary font-label-bold text-xs uppercase tracking-widest mb-1">
              <span className="material-symbols-outlined text-sm">stethoscope</span>
              Módulo Veterinário
            </div>
            <h1 className="text-headline-md font-headline-md font-bold text-on-surface">Prontuário Eletrônico do Pet</h1>
          </div>

          {/* Pet Picker */}
          <div className="flex items-center gap-2 w-full md:w-80">
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
        </header>

        {isLoadingPets ? (
          <div className="p-12 text-center text-on-surface-variant bg-elevated-card rounded-2xl border border-hairline-border">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">sync</span>
            <p className="font-bold">Carregando pets...</p>
          </div>
        ) : petsError ? (
          <div className="p-12 text-center bg-elevated-card rounded-2xl border border-rose-500/30 space-y-3">
            <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
            <p className="font-bold text-rose-400">{petsError}</p>
            <button onClick={loadPets} className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:brightness-110 cursor-pointer">
              Tentar novamente
            </button>
          </div>
        ) : !selectedPet ? (
          <div className="p-12 text-center bg-elevated-card rounded-2xl border border-hairline-border">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">pets</span>
            <p className="font-bold text-on-surface-variant">Selecione um pet para ver o prontuário.</p>
          </div>
        ) : (
        <>
        {/* Selected Pet Banner Card */}
        <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 extruded-shadow">
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

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline-border gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: "consultas", label: "Consultas & Histórico", icon: "assignment" },
            { id: "vacinas", label: "Carteira de Vacinas", icon: "vaccines" },
            { id: "peso", label: "Evolução de Peso", icon: "monitoring" },
            { id: "receita", label: "Nova Prescrição", icon: "edit_note" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-label-bold text-body-sm transition-all border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-surface-container text-primary border-primary"
                  : "text-on-surface-variant hover:text-on-surface border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {isLoadingRecord ? (
          <div className="p-12 text-center text-on-surface-variant bg-elevated-card rounded-2xl border border-hairline-border">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">sync</span>
            <p className="font-bold">Carregando prontuário...</p>
          </div>
        ) : recordError ? (
          <div className="p-12 text-center bg-elevated-card rounded-2xl border border-rose-500/30 space-y-3">
            <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
            <p className="font-bold text-rose-400">{recordError}</p>
            <button onClick={() => loadRecord(selectedPetId)} className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:brightness-110 cursor-pointer">
              Tentar novamente
            </button>
          </div>
        ) : (
        <>
        {/* Tab Content */}
        {activeTab === "consultas" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form to add consultation */}
            <form onSubmit={handleAddConsultation} className="lg:col-span-5 bg-surface-container border border-hairline-border rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="font-label-bold text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_notes</span>
                Nova Consulta / Anamnese
              </h3>

              <div>
                <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Veterinário Responsável</label>
                <input
                  type="text"
                  placeholder="Ex: Dr. Carlos Eduardo (CRMV 48192)"
                  value={vetName}
                  onChange={(e) => setVetName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Diagnóstico / Motivo</label>
                <input
                  type="text"
                  placeholder="Ex: Otite externa leve no ouvido direito"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                  className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Conduta & Tratamento</label>
                <textarea
                  rows={4}
                  placeholder="Descreva a prescrição, medicação recomendada e retornos..."
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSavingConsulta}
                className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined">save</span>
                {isSavingConsulta ? "Salvando..." : "Salvar no Prontuário"}
              </button>
            </form>

            {/* History List */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-label-bold text-headline-sm text-on-surface">Histórico Clínico Registrado</h3>

              {medicalHistory.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Nenhuma consulta registrada ainda.</p>
              ) : (
                medicalHistory.map((item) => (
                  <div key={item.id} className="bg-elevated-card border border-hairline-border rounded-2xl p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-label-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        {new Date(item.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                      <span className="text-caption text-on-surface-variant">{item.vet_name}</span>
                    </div>

                    <h4 className="font-label-bold text-on-surface text-body-base">{item.diagnosis}</h4>
                    <p className="text-body-sm text-on-surface-variant leading-relaxed">{item.treatment || "Sem observações adicionais."}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "vacinas" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form onSubmit={handleAddVaccine} className="lg:col-span-5 bg-surface-container border border-hairline-border rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="font-label-bold text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">vaccines</span>
                Registrar Vacina
              </h3>

              <div>
                <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Vacina / Imunizante</label>
                <select
                  value={newVaccine}
                  onChange={(e) => setNewVaccine(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary"
                >
                  <option value="V10 Múltipla">V10 Múltipla</option>
                  <option value="Antirrábica">Antirrábica</option>
                  <option value="Giardíase">Giardíase</option>
                  <option value="Tosse dos Canis (Gripe)">Tosse dos Canis (Gripe)</option>
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
                className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
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

        {activeTab === "peso" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form onSubmit={handleAddWeight} className="lg:col-span-5 bg-surface-container border border-hairline-border rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="font-label-bold text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">scale</span>
                Registrar Novo Peso
              </h3>

              <div>
                <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Peso (kg)</label>
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
                className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSavingPeso ? "Salvando..." : "Atualizar Peso"}
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

        {activeTab === "receita" && (
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-6 space-y-4 max-w-3xl">
            <h3 className="font-label-bold text-headline-sm text-on-surface">Emitir Receita Digital</h3>
            <textarea
              rows={6}
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              placeholder={`USO VETERINÁRIO - PRESCRIÇÃO\n----------------------------------------\n1. Medicamento - dose e frequência.\n\nVeterinário responsável`}
              className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl p-4 text-on-surface font-mono text-body-sm outline-none resize-none"
            ></textarea>
            <button
              onClick={handleSendPrescription}
              className="bg-primary text-on-primary font-label-bold px-6 py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined">send</span>
              Enviar Receita por WhatsApp para {selectedPet.tutor_name}
            </button>
          </div>
        )}
        </>
        )}
        </>
        )}
      </main>
  );
}
