"use client";

import { useState, useEffect } from "react";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
}

interface ClientUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  pets: Pet[];
  created_at: string;
  status: string;
}

interface Metrics {
  totalClients: number;
  activeClients: number;
  totalPets: number;
  totalVisits: number;
}

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalClients: 0,
    activeClients: 0,
    totalPets: 0,
    totalVisits: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos os status");

  // Detail & New Client Modal States
  const [selectedClient, setSelectedClient] = useState<ClientUser | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [isSavingClient, setIsSavingClient] = useState(false);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      alert("Por favor, informe o nome do cliente.");
      return;
    }
    setIsSavingClient(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newClientName.trim(),
          phone: newClientPhone.trim() || null,
          email: newClientEmail.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowNewClientModal(false);
        setNewClientName("");
        setNewClientPhone("");
        setNewClientEmail("");
        // Reload clients
        const reloadRes = await fetch("/api/admin/clients");
        const reloadData = await reloadRes.json();
        if (reloadData.clients) {
          setClients(reloadData.clients);
          if (reloadData.metrics) setMetrics(reloadData.metrics);
        }
        alert("Cliente cadastrado com sucesso!");
      } else {
        alert(`Erro: ${data.error || "Tente novamente."}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao cadastrar cliente.");
    } finally {
      setIsSavingClient(false);
    }
  };

  useEffect(() => {
    async function loadAdminClients() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/clients");
        const data = await res.json();
        if (res.ok && data.clients) {
          setClients(data.clients);
          if (data.metrics) {
            setMetrics(data.metrics);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar clientes reais do Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAdminClients();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "CL";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Primeiro acesso";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "01/01/2026";
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.pets.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "Todos os status" ||
      (statusFilter === "Ativo" && client.status === "Ativo") ||
      (statusFilter === "Inativo" && client.status === "Inativo");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full min-h-screen bg-matte-canvas text-on-surface">
      {/* Desktop Layout */}
      <main className="hidden md:block p-margin-desktop space-y-8">
        {/* Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Clientes / Tutores</h1>
            <p className="text-on-surface-variant font-label-muted mt-1">
              {isLoading ? "Carregando clientes..." : `${clients.length} tutores cadastrados no Supabase`}
            </p>
          </div>
          <button
            onClick={() => setShowNewClientModal(true)}
            className="bg-primary text-on-primary font-label-bold text-label-bold px-6 py-3 rounded-lg flex items-center gap-2 extruded-shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">person_add</span>
            Cadastrar cliente
          </button>
        </div>

        {/* Bento Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-elevated-card border border-hairline-border p-5 rounded-xl extruded-shadow group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-2 rounded-lg">group</span>
              <span className="text-caption text-primary">+100%</span>
            </div>
            <div className="text-headline-md font-headline-md text-on-surface">{metrics.totalClients}</div>
            <div className="text-caption font-label-muted text-on-surface-variant">Total de clientes</div>
          </div>
          <div className="bg-elevated-card border border-hairline-border p-5 rounded-xl extruded-shadow group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-2 rounded-lg">person_check</span>
              <span className="text-caption text-primary">Ativos</span>
            </div>
            <div className="text-headline-md font-headline-md text-on-surface">{metrics.activeClients}</div>
            <div className="text-caption font-label-muted text-on-surface-variant">Clientes ativos</div>
          </div>
          <div className="bg-elevated-card border border-hairline-border p-5 rounded-xl extruded-shadow group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-2 rounded-lg">pets</span>
              <span className="text-caption text-primary">Pets</span>
            </div>
            <div className="text-headline-md font-headline-md text-on-surface">{metrics.totalPets}</div>
            <div className="text-caption font-label-muted text-on-surface-variant">Pets cadastrados</div>
          </div>
          <div className="bg-elevated-card border border-hairline-border p-5 rounded-xl extruded-shadow group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-2 rounded-lg">event_available</span>
              <span className="text-caption text-primary">Recorde</span>
            </div>
            <div className="text-headline-md font-headline-md text-on-surface">{metrics.totalVisits}</div>
            <div className="text-caption font-label-muted text-on-surface-variant">Total de visitas</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-surface-container border border-hairline-border p-4 rounded-xl flex flex-wrap items-center gap-4">
          <div className="flex-1 relative min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-matte-canvas border-hairline-border border rounded-lg pl-10 pr-4 py-2.5 text-label-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface placeholder:text-outline"
              placeholder="Buscar por nome, email, telefone ou pet..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-matte-canvas border border-hairline-border rounded-lg px-4 py-2.5 text-label-muted text-on-surface focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="Todos os status">Todos os status</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-elevated-card border border-hairline-border rounded-xl extruded-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline-border bg-surface-container-low">
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Pets Cadastrados</th>
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Data de Cadastro</th>
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-border">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5">
                        <div className="h-10 w-36 bg-surface-container-highest rounded"></div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-8 w-44 bg-surface-container-highest rounded"></div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-6 w-24 bg-surface-container-highest rounded"></div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-6 w-20 bg-surface-container-highest rounded"></div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="h-6 w-16 bg-surface-container-highest rounded mx-auto"></div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="h-6 w-8 bg-surface-container-highest rounded ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl text-outline mb-2">group_off</span>
                      <p className="font-bold">Nenhum cliente encontrado</p>
                      <p className="text-xs text-outline mt-1">Nenhum registro corresponde aos filtros ou busca.</p>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-surface-container-high/30 transition-colors group">
                      {/* Nome e Avatar */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                            {getInitials(client.full_name)}
                          </div>
                          <div>
                            <div className="font-label-bold text-on-surface font-bold">{client.full_name}</div>
                            <div className="text-caption text-on-surface-variant">{client.pets.length} {client.pets.length === 1 ? "pet registrado" : "pets registrados"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contato (Telefone + Email real) */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm text-primary">call</span>
                            <span className="text-label-muted">{client.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-on-surface-variant/70">
                            <span className="material-symbols-outlined text-sm">mail</span>
                            <span className="text-caption">{client.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Pets */}
                      <td className="px-6 py-5">
                        {client.pets.length === 0 ? (
                          <span className="text-xs text-outline italic">Nenhum pet</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {client.pets.map((pet) => (
                              <span
                                key={pet.id}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-highest border border-hairline-border rounded-lg text-xs font-label-bold text-on-surface"
                              >
                                <span className="material-symbols-outlined text-[14px] text-primary">pets</span>
                                {pet.name} ({pet.breed || pet.species})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Data de Cadastro */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">calendar_month</span>
                          <span className="text-label-muted">{formatDate(client.created_at)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-label-bold uppercase">
                            {client.status}
                          </span>
                        </div>
                      </td>

                      {/* Ações (WhatsApp Direct Link) */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {client.phone && client.phone !== "Não informado" && (
                            <a
                              href={`https://wa.me/55${client.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Conversar no WhatsApp"
                              className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined text-xl">chat</span>
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant cursor-pointer"
                            title="Ver detalhes do cliente"
                          >
                            <span className="material-symbols-outlined text-xl">more_vert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-hairline-border bg-surface-container-low flex items-center justify-between">
            <span className="text-caption font-label-muted text-on-surface-variant">
              Mostrando {filteredClients.length} de {clients.length} clientes
            </span>
          </div>
        </div>
      </main>

      {/* Mobile Layout */}
      <main className="block md:hidden px-4 pt-4 pb-24 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Clientes / Tutores</h1>
            <p className="text-on-surface-variant text-sm font-label-muted">{clients.length} tutores no banco</p>
          </div>
        </div>

        {/* Mobile Metrics Slider */}
        <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar -mx-4 px-4">
          <div className="min-w-[140px] flex-1 bg-elevated-card border border-hairline-border p-4 rounded-xl extruded-shadow">
            <div className="text-xl font-bold text-on-surface">{metrics.totalClients}</div>
            <div className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Total Clientes</div>
          </div>
          <div className="min-w-[140px] flex-1 bg-elevated-card border border-hairline-border p-4 rounded-xl extruded-shadow">
            <div className="text-xl font-bold text-on-surface">{metrics.totalPets}</div>
            <div className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Total Pets</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container border-hairline-border border rounded-full pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none text-on-surface placeholder:text-outline"
            placeholder="Buscar tutor ou pet..."
            type="text"
          />
        </div>

        {/* Cards List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-4 text-center text-on-surface-variant">Carregando...</div>
          ) : filteredClients.length === 0 ? (
            <div className="p-6 bg-elevated-card rounded-xl text-center text-outline text-xs">
              Nenhum cliente encontrado.
            </div>
          ) : (
            filteredClients.map((client) => (
              <div key={client.id} className="bg-elevated-card border border-hairline-border p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {getInitials(client.full_name)}
                  </div>
                  <div>
                    <div className="font-bold text-on-surface">{client.full_name}</div>
                    <div className="text-xs text-on-surface-variant">{client.phone}</div>
                    <div className="flex gap-1 mt-1">
                      {client.pets.map((p) => (
                        <span key={p.id} className="px-1.5 py-0.5 bg-surface-container-highest rounded text-[10px] text-on-surface-variant flex items-center">
                          <span className="material-symbols-outlined text-[12px] mr-1 text-primary">pets</span>
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {client.phone && client.phone !== "Não informado" && (
                    <a
                      href={`https://wa.me/55${client.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-full"
                    >
                      <span className="material-symbols-outlined text-lg">chat</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ====== MODAL: Detalhes do Cliente ====== */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-lg w-full p-6 space-y-5 extruded-shadow">
            <div className="flex justify-between items-center border-b border-hairline-border pb-3">
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Detalhes do Cliente
              </h3>
              <button onClick={() => setSelectedClient(null)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg bg-surface-container cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg">
                {getInitials(selectedClient.full_name)}
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-lg">{selectedClient.full_name}</h4>
                <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-[10px] font-bold uppercase">{selectedClient.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-surface-container p-3 rounded-xl border border-hairline-border">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase block">Telefone</span>
                <span className="text-on-surface font-bold">{selectedClient.phone}</span>
              </div>
              <div className="bg-surface-container p-3 rounded-xl border border-hairline-border">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase block">E-mail</span>
                <span className="text-on-surface font-bold text-xs">{selectedClient.email}</span>
              </div>
              <div className="bg-surface-container p-3 rounded-xl border border-hairline-border">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase block">Cadastro</span>
                <span className="text-on-surface font-bold">{formatDate(selectedClient.created_at)}</span>
              </div>
              <div className="bg-surface-container p-3 rounded-xl border border-hairline-border">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase block">Pets</span>
                <span className="text-on-surface font-bold">{selectedClient.pets.length} pet(s)</span>
              </div>
            </div>

            {selectedClient.pets.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-on-surface-variant uppercase">Pets Associados</h5>
                {selectedClient.pets.map((pet) => (
                  <div key={pet.id} className="flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-hairline-border">
                    <span className="material-symbols-outlined text-primary">pets</span>
                    <div>
                      <span className="font-bold text-on-surface text-sm">{pet.name}</span>
                      <span className="text-xs text-on-surface-variant ml-2">{pet.breed || pet.species}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {selectedClient.phone && selectedClient.phone !== "Não informado" && (
                <a
                  href={`https://wa.me/55${selectedClient.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-emerald-500 text-black font-bold py-3 rounded-xl text-sm text-center flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  WhatsApp
                </a>
              )}
              <button
                onClick={() => setSelectedClient(null)}
                className="flex-1 bg-surface-container-high border border-hairline-border text-on-surface font-bold py-3 rounded-xl text-sm hover:bg-surface-container-highest transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: Cadastro de Novo Cliente ====== */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-md w-full p-6 space-y-5 extruded-shadow">
            <div className="flex justify-between items-center border-b border-hairline-border pb-3">
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_add</span>
                Cadastrar Novo Cliente
              </h3>
              <button onClick={() => setShowNewClientModal(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg bg-surface-container cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  className="w-full bg-surface-container border border-hairline-border rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-surface-container border border-hairline-border rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">E-mail</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full bg-surface-container border border-hairline-border rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingClient}
                className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:brightness-110 transition-all extruded-shadow cursor-pointer disabled:opacity-50"
              >
                {isSavingClient ? "Salvando..." : "Cadastrar Cliente"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
