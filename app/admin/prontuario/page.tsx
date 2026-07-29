"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { AdminBottomNav } from "@/components/ui/admin-bottom-nav";

export default function ProntuarioAdminPage() {
  const [selectedPet, setSelectedPet] = useState({
    id: "p1",
    name: "Bidu",
    species: "Cão",
    breed: "SRD (Vira-lata)",
    age: "1 ano e 2 meses",
    sex: "Macho",
    weight: "12.4 kg",
    tutor: "Welington Souza",
    phone: "(11) 98888-7777",
    photo: "/assets/img-cadastro-google2-cli.png",
  });

  const [activeTab, setActiveTab] = useState<"consultas" | "vacinas" | "peso" | "receita">("consultas");

  // Form States
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [newVaccine, setNewVaccine] = useState("V10 Múltipla");
  const [vaccineDate, setVaccineDate] = useState("2026-07-28");
  const [nextVaccineDate, setNextVaccineDate] = useState("2027-07-28");
  const [newWeight, setNewWeight] = useState("12.4");

  // Records
  const [medicalHistory, setMedicalHistory] = useState([
    {
      id: "m1",
      date: "28/07/2026 14:30",
      vet: "Dr. Carlos Eduardo (CRMV 48192)",
      title: "Consulta Geral de Rotina",
      notes: "Pet ativo, mucosas coradas, ausculta cardíaca e pulmonar normais. Mantida dieta atual.",
    },
    {
      id: "m2",
      date: "15/03/2026 10:15",
      vet: "Dra. Juliana Mendes (CRMV 52019)",
      title: "Aplicação de Desverminante",
      notes: "Vermifugação preventiva realizada com Drontal Plus. Sem reações adversas.",
    },
  ]);

  const [vaccines, setVaccines] = useState([
    { id: "v1", name: "Vacina V10 Múltipla", appliedAt: "28/07/2026", nextDueAt: "28/07/2027", status: "Em dia" },
    { id: "v2", name: "Antirrábica Imunológica", appliedAt: "10/01/2026", nextDueAt: "10/01/2027", status: "Em dia" },
    { id: "v3", name: "Giardíase Dose 1", appliedAt: "05/11/2025", nextDueAt: "05/11/2026", status: "A vencer" },
  ]);

  const [weightLogs, setWeightLogs] = useState([
    { date: "28/07/2026", weight: 12.4 },
    { date: "15/03/2026", weight: 11.8 },
    { date: "10/01/2026", weight: 10.5 },
  ]);

  const handleAddConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) return;

    setMedicalHistory([
      {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        vet: "Dr. Carlos Eduardo (CRMV 48192)",
        title: diagnosis,
        notes: treatment || "Sem observações adicionais.",
      },
      ...medicalHistory,
    ]);

    setDiagnosis("");
    setTreatment("");
    alert("Prontuário salvo com sucesso!");
  };

  const handleAddVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    setVaccines([
      {
        id: Date.now().toString(),
        name: newVaccine,
        appliedAt: new Date(vaccineDate).toLocaleDateString("pt-BR"),
        nextDueAt: new Date(nextVaccineDate).toLocaleDateString("pt-BR"),
        status: "Em dia",
      },
      ...vaccines,
    ]);
    alert(`Vacina "${newVaccine}" registrada com sucesso!`);
  };

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    setWeightLogs([{ date: new Date().toLocaleDateString("pt-BR"), weight: Number(newWeight) }, ...weightLogs]);
    alert("Peso atualizado com sucesso!");
  };

  return (
    <div className="bg-matte-canvas text-on-surface font-body-base antialiased min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container border border-hairline-border p-6 rounded-2xl extruded-shadow">
          <div>
            <div className="flex items-center gap-2 text-primary font-label-bold text-xs uppercase tracking-widest mb-1">
              <span className="material-symbols-outlined text-sm">stethoscope</span>
              Módulo Veterinário
            </div>
            <h1 className="text-headline-md font-headline-md font-bold text-on-surface">Prontuário Eletrônico do Pet</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Imprimindo Prescrição / Receita Médica...")}
              className="bg-primary/10 border border-primary/30 text-primary px-4 py-2.5 rounded-xl text-body-sm font-label-bold flex items-center gap-2 hover:bg-primary/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Emitir Receita Médica
            </button>
          </div>
        </header>

        {/* Selected Pet Banner Card */}
        <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 extruded-shadow">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/30 overflow-hidden flex-shrink-0">
              <img src={selectedPet.photo} alt={selectedPet.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-headline-md font-bold text-on-surface">{selectedPet.name}</h2>
                <span className="text-xs font-label-bold bg-primary/20 text-primary px-2.5 py-0.5 rounded-full border border-primary/30">
                  {selectedPet.sex}
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                {selectedPet.species} • {selectedPet.breed} • {selectedPet.age}
              </p>
              <p className="text-caption text-outline mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">person</span>
                Tutor: <strong className="text-on-surface">{selectedPet.tutor}</strong> ({selectedPet.phone})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
            <div className="bg-surface-container p-3 rounded-xl border border-hairline-border text-center flex-1 md:w-28">
              <span className="text-caption text-on-surface-variant block">Peso Atual</span>
              <strong className="text-primary text-headline-sm font-bold">{selectedPet.weight}</strong>
            </div>
            <div className="bg-surface-container p-3 rounded-xl border border-hairline-border text-center flex-1 md:w-28">
              <span className="text-caption text-on-surface-variant block">Vacinas</span>
              <strong className="text-emerald-400 text-headline-sm font-bold">Em dia</strong>
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
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-label-bold text-body-sm transition-all border-b-2 ${
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
                className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span className="material-symbols-outlined">save</span>
                Salvar no Prontuário
              </button>
            </form>

            {/* History List */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-label-bold text-headline-sm text-on-surface">Histórico Clínico Registrado</h3>

              {medicalHistory.map((item) => (
                <div key={item.id} className="bg-elevated-card border border-hairline-border rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-label-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                      {item.date}
                    </span>
                    <span className="text-caption text-on-surface-variant">{item.vet}</span>
                  </div>

                  <h4 className="font-label-bold text-on-surface text-body-base">{item.title}</h4>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">{item.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "vacinas" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form onSubmit={handleAddVaccine} className="lg:col-span-5 bg-surface-container border border-hairline-border rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="font-label-bold text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">syringe</span>
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
                  <option value="Gradiase">Gradiase</option>
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
                className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Registrar Vacina
              </button>
            </form>

            <div className="lg:col-span-7 bg-elevated-card border border-hairline-border rounded-2xl p-6 space-y-4">
              <h3 className="font-label-bold text-headline-sm text-on-surface">Carteira de Vacinação</h3>

              <div className="space-y-3">
                {vaccines.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-hairline-border">
                    <div>
                      <h4 className="font-label-bold text-on-surface text-body-sm">{v.name}</h4>
                      <p className="text-caption text-on-surface-variant">Aplicada em: {v.appliedAt}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-caption font-label-bold bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30 block">
                        Próxima: {v.nextDueAt}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Atualizar Peso
              </button>
            </form>

            <div className="lg:col-span-7 bg-elevated-card border border-hairline-border rounded-2xl p-6 space-y-4">
              <h3 className="font-label-bold text-headline-sm text-on-surface">Histórico de Ponderação</h3>
              <div className="space-y-3">
                {weightLogs.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-hairline-border">
                    <span className="text-body-sm text-on-surface-variant">{w.date}</span>
                    <span className="text-headline-sm font-bold text-primary">{w.weight} kg</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "receita" && (
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-6 space-y-4 max-w-3xl">
            <h3 className="font-label-bold text-headline-sm text-on-surface">Emitir Receita Digital com Assinatura</h3>
            <textarea
              rows={6}
              defaultValue={`USO VETERINÁRIO - PRESCRIÇÃO
----------------------------------------
1. Meloxicam 1mg - 1 comprimido VO a cada 24 horas por 3 dias.
2. Otoguard Gel Auricular - Aplicar 4 gotas no conduto auditivo a cada 12 horas por 7 dias.

Dr. Carlos Eduardo (CRMV 48192)`}
              className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl p-4 text-on-surface font-mono text-body-sm outline-none resize-none"
            ></textarea>
            <button
              onClick={() => alert("Receita gerada e enviada via WhatsApp para o tutor Welington!")}
              className="bg-primary text-on-primary font-label-bold px-6 py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined">send</span>
              Enviar Receita por WhatsApp
            </button>
          </div>
        )}
      </main>

      <AdminBottomNav />
    </div>
  );
}
