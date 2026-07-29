"use client";

import { useState } from "react";
import Link from "next/link";

interface HistoryItem {
  id: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petPhoto: string;
  serviceName: string;
  date: string;
  time: string;
  location: string;
  price: number;
  status: "completed" | "cancelled" | "in_progress";
  notes?: string;
}

export default function ClientHistoricoPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPetFilter, setSelectedPetFilter] = useState("Todos os Pets");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("todos");
  const [selectedItemDetail, setSelectedItemDetail] = useState<HistoryItem | null>(null);

  const historyData: HistoryItem[] = [
    {
      id: "1",
      petName: "Max",
      petSpecies: "Cachorro",
      petBreed: "Golden Retriever",
      petPhoto: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80",
      serviceName: "Banho Completo & Hidratação",
      date: "12 Out, 2026",
      time: "09:30 AM",
      location: "Unidade Jardins SP • Rua Oscar Freire, 1200",
      price: 85,
      status: "completed",
      notes: "Shampoo hipoalergênico aplicado. Corte de unhas e limpeza auricular concluídos sem intercorrências.",
    },
    {
      id: "2",
      petName: "Luna",
      petSpecies: "Gato",
      petBreed: "Siamesa",
      petPhoto: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80",
      serviceName: "Spa Premium & Escovação",
      date: "28 Set, 2026",
      time: "14:00 PM",
      location: "Unidade Jardins SP • Av. Paulista, 1000",
      price: 145,
      status: "completed",
      notes: "Hidratação de pelagem e desembolo delicado. Pet comportou-se de maneira exemplar.",
    },
    {
      id: "3",
      petName: "Thor",
      petSpecies: "Cachorro",
      petBreed: "Golden Retriever",
      petPhoto: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300&q=80",
      serviceName: "Banho + Tosa Bebê",
      date: "28 Jul, 2026",
      time: "15:30 PM",
      location: "Unidade Jardins SP • Rua Oscar Freire, 1200",
      price: 120,
      status: "in_progress",
      notes: "Atendimento em andamento na sala de tosa com Ricardo M.",
    },
    {
      id: "4",
      petName: "Bolt",
      petSpecies: "Cachorro",
      petBreed: "Jack Russell",
      petPhoto: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80",
      serviceName: "Banho & Tosa Higiênica",
      date: "15 Set, 2026",
      time: "11:00 AM",
      location: "Unidade Jardins SP • Rua Oscar Freire, 1200",
      price: 110,
      status: "cancelled",
      notes: "Cancelado pelo tutor via aplicativo 2 horas antes do horário.",
    },
  ];

  const filteredItems = historyData.filter((item) => {
    const matchesSearch =
      item.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPet =
      selectedPetFilter === "Todos os Pets" || item.petName === selectedPetFilter;

    const matchesStatus =
      selectedStatusFilter === "todos" ||
      (selectedStatusFilter === "concluidos" && item.status === "completed") ||
      (selectedStatusFilter === "cancelados" && item.status === "cancelled") ||
      (selectedStatusFilter === "andamento" && item.status === "in_progress");

    return matchesSearch && matchesPet && matchesStatus;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Filters Section Bar */}
        <div className="bg-surface-container p-4 md:p-6 rounded-2xl border border-hairline-border extruded-shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                Buscar por Serviço ou Pet
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: Banho, Max, Jardins..."
                  className="w-full bg-elevated-card border border-hairline-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Filter by Pet */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                Filtrar por Pet
              </label>
              <select
                value={selectedPetFilter}
                onChange={(e) => setSelectedPetFilter(e.target.value)}
                className="w-full bg-elevated-card border border-hairline-border rounded-xl px-3 py-2.5 text-xs text-on-surface outline-none cursor-pointer focus:border-primary transition-colors"
              >
                <option value="Todos os Pets">Todos os Pets</option>
                <option value="Max">Max (Golden Retriever)</option>
                <option value="Luna">Luna (Siamesa)</option>
                <option value="Thor">Thor (Golden Retriever)</option>
                <option value="Bolt">Bolt (Jack Russell)</option>
              </select>
            </div>

            {/* Filter by Status Pills */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                Status do Atendimento
              </label>
              <div className="flex bg-elevated-card p-1 rounded-xl border border-hairline-border">
                <button
                  onClick={() => setSelectedStatusFilter("todos")}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedStatusFilter === "todos"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSelectedStatusFilter("concluidos")}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedStatusFilter === "concluidos"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Concluídos
                </button>
                <button
                  onClick={() => setSelectedStatusFilter("cancelados")}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedStatusFilter === "cancelados"
                      ? "bg-error-red text-white"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Cancelados
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History Cards List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="bg-surface-container border border-hairline-border rounded-2xl p-12 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-outline">history_toggle_off</span>
              <h3 className="text-base font-bold text-on-surface">Nenhum atendimento encontrado</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                Tente ajustar os termos de busca ou selecionar outro filtro de pet.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-elevated-card border rounded-2xl p-5 md:p-6 extruded-shadow transition-all group ${
                  item.status === "cancelled"
                    ? "border-error-red/30 opacity-75"
                    : item.status === "in_progress"
                    ? "border-amber-500/40"
                    : "border-hairline-border hover:border-primary/40"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Pet Avatar & Status Pill */}
                  <div className="flex items-center gap-4 min-w-[220px]">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-16 h-16 rounded-full border-2 overflow-hidden ${
                          item.status === "cancelled"
                            ? "border-error-red/40 grayscale"
                            : "border-primary/30"
                        }`}
                      >
                        <img
                          src={item.petPhoto}
                          alt={item.petName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-elevated-card ${
                          item.status === "completed"
                            ? "bg-primary text-on-primary"
                            : item.status === "in_progress"
                            ? "bg-amber-500 text-black"
                            : "bg-error-red text-white"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs font-bold">
                          {item.status === "completed"
                            ? "check"
                            : item.status === "in_progress"
                            ? "content_cut"
                            : "close"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                        {item.petName}
                      </h3>
                      <span className="text-xs text-on-surface-variant block">
                        {item.petSpecies} • {item.petBreed}
                      </span>
                      <div className="mt-1.5">
                        {item.status === "completed" && (
                          <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            CONCLUÍDO
                          </span>
                        )}
                        {item.status === "in_progress" && (
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            EM ANDAMENTO
                          </span>
                        )}
                        {item.status === "cancelled" && (
                          <span className="bg-error-red/20 text-error-red border border-error-red/30 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                            CANCELADO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-hairline-border/50">
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider">SERVIÇO</p>
                      <p className="text-sm font-bold text-on-surface mt-0.5">{item.serviceName}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider">DATA E HORA</p>
                      <p className="text-sm font-bold text-on-surface mt-0.5">
                        {item.date} • {item.time}
                      </p>
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider">LOCALIZAÇÃO</p>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {item.location}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider">VALOR TOTAL</p>
                      <p className="text-base font-extrabold text-primary mt-0.5">
                        R$ {item.price.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-hairline-border/40">
                    <button
                      onClick={() => setSelectedItemDetail(item)}
                      className="flex-1 lg:flex-initial px-4 py-2.5 bg-surface-container border border-hairline-border hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      <span>Ver Detalhes</span>
                    </button>

                    <Link
                      href="/agendar"
                      className="flex-1 lg:flex-initial px-4 py-2.5 bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">repeat</span>
                      <span>Reagendar</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Detalhes do Atendimento */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-lg w-full p-6 md:p-8 extruded-shadow space-y-5">
            <div className="flex items-center justify-between border-b border-hairline-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">receipt_long</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Comprovante de Atendimento</h3>
                  <p className="text-xs text-on-surface-variant">Detalhamento completo do serviço</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-surface-container p-3.5 rounded-xl border border-hairline-border">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedItemDetail.petPhoto}
                    alt={selectedItemDetail.petName}
                    className="w-10 h-10 rounded-full object-cover border border-primary/30"
                  />
                  <div>
                    <h4 className="font-bold text-on-surface">{selectedItemDetail.petName}</h4>
                    <span className="text-[11px] text-on-surface-variant">
                      {selectedItemDetail.petSpecies} • {selectedItemDetail.petBreed}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-primary/20 text-primary font-bold text-[10px] rounded-full uppercase">
                  {selectedItemDetail.status === "completed" ? "Concluído" : selectedItemDetail.status}
                </span>
              </div>

              <div className="bg-surface-container p-4 rounded-xl border border-hairline-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Serviço Realizado:</span>
                  <span className="font-bold text-on-surface">{selectedItemDetail.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Data & Hora:</span>
                  <span className="font-bold text-on-surface">{selectedItemDetail.date} às {selectedItemDetail.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Unidade:</span>
                  <span className="font-bold text-on-surface">{selectedItemDetail.location}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-hairline-border/50 text-sm font-bold">
                  <span className="text-on-surface">Total Pago:</span>
                  <span className="text-primary">R$ {selectedItemDetail.price.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>

              {selectedItemDetail.notes && (
                <div className="p-3.5 bg-surface-container-lowest border border-hairline-border rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Observações do Profissional</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{selectedItemDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="flex-1 bg-surface-container border border-hairline-border text-on-surface font-bold py-3 rounded-xl hover:bg-surface-variant transition-all cursor-pointer"
              >
                Fechar
              </button>
              <Link
                href="/agendar"
                className="flex-1 bg-primary text-on-primary font-bold text-center py-3 rounded-xl extruded-shadow hover:brightness-110 transition-all"
              >
                Reagendar Serviço
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
