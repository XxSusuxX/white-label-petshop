"use client";

import { useState } from "react";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  petsCount: number;
  lastVisit: string;
  totalSpent: string;
  status: "Ativo" | "Pendente" | "Inativo";
}

export default function AdminClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clients] = useState<Client[]>([
    {
      id: "1",
      name: "Ana Paula Silva",
      phone: "(11) 98877-6655",
      email: "ana.paula@gmail.com",
      petsCount: 2,
      lastVisit: "Hoje, 14:15",
      totalSpent: "R$ 1.450,00",
      status: "Ativo",
    },
    {
      id: "2",
      name: "Carlos Eduardo Costa",
      phone: "(11) 97766-5544",
      email: "carlos.costa@hotmail.com",
      petsCount: 1,
      lastVisit: "12/07/2026",
      totalSpent: "R$ 820,00",
      status: "Ativo",
    },
    {
      id: "3",
      name: "Mariana Oliveira",
      phone: "(11) 96655-4433",
      email: "mari.oli@gmail.com",
      petsCount: 3,
      lastVisit: "05/07/2026",
      totalSpent: "R$ 2.100,00",
      status: "Ativo",
    },
  ]);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
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
            className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-label-bold extruded-shadow"
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
            <span className="text-on-surface font-bold">Gestão de Clientes & CRM WhatsApp</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Cadastro de Tutores / Clientes</h1>
              <p className="text-sm text-on-surface-variant">Gerencie históricos, contatos de WhatsApp e dados de cobrança.</p>
            </div>

            <button
              onClick={() => alert("Novo Cliente: Cadastro rápido de tutor por formulário")}
              className="px-5 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-xl extruded-shadow hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              <span>Cadastrar Novo Cliente</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full bg-surface-container px-10 py-2.5 rounded-xl border border-hairline-border text-on-surface placeholder:text-outline text-sm outline-none"
              placeholder="Buscar por nome, telefone ou e-mail..."
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
                    <th className="p-4">Cliente / Tutor</th>
                    <th className="p-4">WhatsApp / Contato</th>
                    <th className="p-4">Pets Viculados</th>
                    <th className="p-4">Última Visita</th>
                    <th className="p-4">Total Gasto</th>
                    <th className="p-4 text-center">Ações WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-border/40">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-on-surface">{client.name}</p>
                        <p className="text-xs text-on-surface-variant">{client.email}</p>
                      </td>
                      <td className="p-4 font-mono text-xs">{client.phone}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold text-xs">
                          {client.petsCount} Pets
                        </span>
                      </td>
                      <td className="p-4 text-xs text-on-surface-variant">{client.lastVisit}</td>
                      <td className="p-4 font-bold text-primary">{client.totalSpent}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => alert(`Enviando mensagem no WhatsApp para ${client.phone}`)}
                          className="px-3 py-1.5 bg-[#10b981] text-on-primary font-bold text-xs rounded-lg hover:brightness-110 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">chat</span>
                          Enviar Whats
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
