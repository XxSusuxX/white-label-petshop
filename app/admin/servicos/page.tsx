"use client";

import { useState } from "react";
import Link from "next/link";

interface ServiceItem {
  id: string;
  name: string;
  category: "Banho & Tosa" | "Veterinária" | "Estética & Spa";
  duration: string;
  priceSmall: string;
  priceMedium: string;
  priceLarge: string;
}

export default function AdminServicosPage() {
  const [services] = useState<ServiceItem[]>([
    {
      id: "1",
      name: "Banho Completo Hipoalergênico",
      category: "Banho & Tosa",
      duration: "45 min",
      priceSmall: "R$ 60,00",
      priceMedium: "R$ 80,00",
      priceLarge: "R$ 110,00",
    },
    {
      id: "2",
      name: "Tosa Bebê / Tosa da Raça",
      category: "Banho & Tosa",
      duration: "60 min",
      priceSmall: "R$ 90,00",
      priceMedium: "R$ 120,00",
      priceLarge: "R$ 160,00",
    },
    {
      id: "3",
      name: "Vacinação V10 Importada",
      category: "Veterinária",
      duration: "20 min",
      priceSmall: "R$ 95,00",
      priceMedium: "R$ 95,00",
      priceLarge: "R$ 95,00",
    },
    {
      id: "4",
      name: "Consulta Veterinária de Rotina",
      category: "Veterinária",
      duration: "30 min",
      priceSmall: "R$ 150,00",
      priceMedium: "R$ 150,00",
      priceLarge: "R$ 150,00",
    },
  ]);

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
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
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
            className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-label-bold extruded-shadow"
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
            <span className="text-on-surface font-bold">Catálogo de Serviços & Tabela de Preços</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Gestão de Serviços & Valores</h1>
              <p className="text-sm text-on-surface-variant">Configure os preços por porte de pet (Pequeno, Médio, Grande).</p>
            </div>

            <button
              onClick={() => alert("Novo Serviço: Adicionar ao catálogo de preços")}
              className="px-5 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-xl extruded-shadow hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>Cadastrar Novo Serviço</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-elevated-card border border-hairline-border rounded-2xl overflow-hidden extruded-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-on-surface">
                <thead className="bg-surface-container-low border-b border-hairline-border text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Serviço</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Duração Aprox.</th>
                    <th className="p-4">Porte Pequeno</th>
                    <th className="p-4">Porte Médio</th>
                    <th className="p-4">Porte Grande</th>
                    <th className="p-4 text-center">Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-border/40">
                  {services.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="p-4 font-bold text-on-surface">{item.name}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono text-on-surface-variant">{item.duration}</td>
                      <td className="p-4 font-bold text-on-surface">{item.priceSmall}</td>
                      <td className="p-4 font-bold text-on-surface">{item.priceMedium}</td>
                      <td className="p-4 font-bold text-primary">{item.priceLarge}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => alert(`Editando valores de: ${item.name}`)}
                          className="p-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
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
