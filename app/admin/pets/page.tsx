"use client";

import { useState } from "react";
import Link from "next/link";

interface AdminPet {
  id: string;
  name: string;
  tutor: string;
  species: string;
  breed: string;
  weight: string;
  lastVaccine: string;
  status: "Saudável" | "Em tratamento" | "Vacina Pendente";
}

export default function AdminPetsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [pets] = useState<AdminPet[]>([
    {
      id: "1",
      name: "Thor",
      tutor: "Ana Paula Silva",
      species: "Cachorro",
      breed: "Golden Retriever",
      weight: "32.4 kg",
      lastVaccine: "V10 - 15/05/2026",
      status: "Saudável",
    },
    {
      id: "2",
      name: "Luna",
      tutor: "Ana Paula Silva",
      species: "Gato",
      breed: "Siamês",
      weight: "4.2 kg",
      lastVaccine: "AntirrÁbica - 10/01/2026",
      status: "Saudável",
    },
    {
      id: "3",
      name: "Max",
      tutor: "Carlos Eduardo Costa",
      species: "Cachorro",
      breed: "French Bulldog",
      weight: "11.0 kg",
      lastVaccine: "Pendente Vacina de Raiva",
      status: "Vacina Pendente",
    },
  ]);

  const filteredPets = pets.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tutor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-matte-canvas text-on-surface font-body-base min-h-screen flex selection:bg-primary/30">
      {/* Admin Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-surface-container border-r border-hairline-border py-6 px-4 z-50">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center extruded-shadow">
            <span
              className="material-symbols-outlined text-on-primary-container text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              admin_panel_settings
            </span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md text-primary font-bold leading-none">
              Painel Admin
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">
              Gestão de Petshop & Vet
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <Link
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
            href="/admin/dashboard"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
            href="/admin/clientes"
          >
            <span className="material-symbols-outlined">group</span>
            <span>Clientes / Tutores</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-label-bold extruded-shadow"
            href="/admin/pets"
          >
            <span className="material-symbols-outlined">pets</span>
            <span>Pets & Prontuários</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
            href="/admin/agenda"
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Agenda Geral</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
            href="/admin/operacao"
          >
            <span className="material-symbols-outlined">pending_actions</span>
            <span>Esteira de Operação</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
            href="/admin/servicos"
          >
            <span className="material-symbols-outlined">sell</span>
            <span>Serviços & Preços</span>
          </Link>
        </nav>
      </aside>

      {/* Main Admin Workspace */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 w-full flex justify-between items-center px-4 md:px-8 sticky top-0 z-30 bg-matte-canvas/90 backdrop-blur-md border-b border-hairline-border">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Administração</span>
            <span>/</span>
            <span className="text-on-surface font-bold">Controle Clínico de Pets & Prontuários</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Prontuários Médicos & Ficha dos Pets</h1>
              <p className="text-sm text-on-surface-variant">Histórico clínico vet, vacinação e observações de saúde.</p>
            </div>

            <button
              onClick={() => alert("Novo Prontuário Médico: Formulário clínico veterinário")}
              className="px-5 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-xl extruded-shadow hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">medical_services</span>
              <span>Abrir Ficha Clínica</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full bg-surface-container px-10 py-2.5 rounded-xl border border-hairline-border text-on-surface placeholder:text-outline text-sm outline-none"
              placeholder="Buscar por pet, tutor ou raça..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table Container */}
          <div className="bg-elevated-card border border-hairline-border rounded-2xl overflow-hidden extruded-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-on-surface">
                <thead className="bg-surface-container-low border-b border-hairline-border text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Nome do Pet</th>
                    <th className="p-4">Tutor Responsável</th>
                    <th className="p-4">Espécie / Raça</th>
                    <th className="p-4">Peso</th>
                    <th className="p-4">Carteira de Vacina</th>
                    <th className="p-4">Status de Saúde</th>
                    <th className="p-4 text-center">Ações Clínicas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-border/40">
                  {filteredPets.map((pet) => (
                    <tr key={pet.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="p-4 font-bold text-on-surface">{pet.name}</td>
                      <td className="p-4 text-xs text-on-surface-variant">{pet.tutor}</td>
                      <td className="p-4 text-xs">{pet.species} • {pet.breed}</td>
                      <td className="p-4 font-mono text-xs">{pet.weight}</td>
                      <td className="p-4 text-xs text-on-surface-variant">{pet.lastVaccine}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            pet.status === "Saudável"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-warning-amber/10 text-warning-amber border-warning-amber/20"
                          }`}
                        >
                          {pet.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => alert(`Abrindo Prontuário Médico de ${pet.name}`)}
                          className="px-3 py-1.5 bg-surface-container border border-hairline-border hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">assignment</span>
                          Ver Prontuário
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
