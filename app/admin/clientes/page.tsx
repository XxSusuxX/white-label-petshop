"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

interface EmployeeUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  role_label: string;
  created_at: string;
  status: string;
}

interface Metrics {
  totalClients: number;
  activeClients: number;
  totalPets: number;
  totalVisits: number;
  totalEmployees?: number;
}

const ROLE_BADGE_STYLE: Record<string, { bg: string; icon: string }> = {
  admin: { bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", icon: "shield_person" },
  dono: { bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", icon: "workspace_premium" },
  veterinario: { bg: "bg-sky-500/20 text-sky-400 border-sky-500/40", icon: "stethoscope" },
  banhista_tosador: { bg: "bg-amber-500/20 text-amber-400 border-amber-500/40", icon: "content_cut" },
  recepcionista: { bg: "bg-purple-500/20 text-purple-400 border-purple-500/40", icon: "support_agent" },
  entregador: { bg: "bg-blue-500/20 text-blue-400 border-blue-500/40", icon: "local_shipping" },
  auxiliar: { bg: "bg-slate-500/20 text-slate-300 border-slate-500/40", icon: "engineering" },
  funcionario: { bg: "bg-slate-500/20 text-slate-300 border-slate-500/40", icon: "badge" },
};

export default function ClientesPage() {
  const [activeTab, setActiveTab] = useState<"clientes" | "funcionarios">("clientes");
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalClients: 0,
    activeClients: 0,
    totalPets: 0,
    totalVisits: 0,
    totalEmployees: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos os status");
  const [currentUserRole, setCurrentUserRole] = useState<string>("cliente");

  // Detail & New Client Modal States
  const [selectedClient, setSelectedClient] = useState<ClientUser | null>(null);
  const [clientPackages, setClientPackages] = useState<{ id: string; package_name: string; total_credits: number; used_credits: number; status: string; expires_at: string | null }[]>([]);

  useEffect(() => {
    if (!selectedClient) {
      setClientPackages([]);
      return;
    }
    fetch(`/api/admin/client-packages?client_id=${selectedClient.id}`)
      .then((res) => res.json())
      .then((data) => setClientPackages(data.packages || []))
      .catch(() => setClientPackages([]));
  }, [selectedClient]);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [isSavingClient, setIsSavingClient] = useState(false);

  // Direct Add Pet Modal States (Campos completos da ficha do pet)
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [petTargetClient, setPetTargetClient] = useState<ClientUser | null>(null);
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("Cachorro");
  const [petBreed, setPetBreed] = useState("");
  const [petSex, setPetSex] = useState("Macho");
  const [petAgeYears, setPetAgeYears] = useState("0");
  const [petAgeMonths, setPetAgeMonths] = useState("0");
  const [petWeight, setPetWeight] = useState("");
  const [petCoat, setPetCoat] = useState("Curta");
  const [petColor, setPetColor] = useState("");
  const [petIsCastrated, setPetIsCastrated] = useState(false);
  const [petPhotoUrl, setPetPhotoUrl] = useState("");
  const [petObservations, setPetObservations] = useState("");
  const [isSavingPet, setIsSavingPet] = useState(false);

  useEffect(() => {
    async function loadCurrentRole() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          const rawRole = profile?.role || user.user_metadata?.role || "cliente";
          setCurrentUserRole(rawRole);
        }
      } catch (err) {
        console.warn("Aviso ao carregar cargo em ClientesPage:", err);
      }
    }
    loadCurrentRole();
  }, []);

  const isOwnerOrAdmin =
    currentUserRole === "admin" ||
    currentUserRole === "dono" ||
    currentUserRole === "Administrador";

  const handleOpenAddPetModal = (client: ClientUser) => {
    setPetTargetClient(client);
    setPetName("");
    setPetBreed("");
    setPetSex("Macho");
    setPetAgeYears("0");
    setPetAgeMonths("0");
    setPetWeight("");
    setPetCoat("Curta");
    setPetColor("");
    setPetIsCastrated(false);
    setPetPhotoUrl("");
    setPetObservations("");
    setShowAddPetModal(true);
  };

  const handleSavePetForClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petTargetClient || !petName.trim()) {
      alert("Informe o nome do pet.");
      return;
    }

    setIsSavingPet(true);
    try {
      const res = await fetch("/api/admin/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: petName.trim(),
          species: petSpecies,
          breed: petBreed.trim() || "Vira-Lata",
          sex: petSex,
          weight: petWeight.trim() || null,
          coat: petCoat,
          color: petColor.trim() || null,
          is_neutered: petIsCastrated,
          age_years: petAgeYears,
          age_months: petAgeMonths,
          photo_url: petPhotoUrl.trim() || null,
          observations: petObservations.trim() || null,
          client_id: petTargetClient.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddPetModal(false);
        setPetName("");
        setPetBreed("");
        setPetWeight("");
        setPetColor("");
        setPetObservations("");

        // Reload clients and pets
        const reloadRes = await fetch("/api/admin/clients");
        const reloadData = await reloadRes.json();
        if (reloadData.clients) {
          setClients(reloadData.clients);
          if (reloadData.employees) setEmployees(reloadData.employees);
          if (reloadData.metrics) setMetrics(reloadData.metrics);
        }
        alert(`🐾 Pet ${petName} cadastrado e vinculado a ${petTargetClient.full_name} com sucesso!`);
        setPetTargetClient(null);
      } else {
        alert(`Erro ao cadastrar pet: ${data.error || "Tente novamente."}`);
      }
    } catch (err) {
      console.error("Erro ao salvar pet:", err);
      alert("Erro de conexão ao salvar pet.");
    } finally {
      setIsSavingPet(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim() || !newClientEmail.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios (Nome, Telefone e E-mail).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClientEmail.trim())) {
      alert("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    setIsSavingClient(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newClientName.trim(),
          phone: newClientPhone.trim(),
          email: newClientEmail.trim(),
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
          if (reloadData.employees) setEmployees(reloadData.employees);
          if (reloadData.metrics) setMetrics(reloadData.metrics);
        }
        alert("🎉 Cliente e conta de tutor cadastrados com sucesso!");
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
          if (data.employees) {
            setEmployees(data.employees);
          }
          if (data.metrics) {
            setMetrics(data.metrics);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar clientes e equipe do Supabase:", err);
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

  const getWhatsAppLink = (phone: string) => {
    if (!phone || phone === "Não informado") return "#";
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "#";
    return digits.startsWith("55") ? `https://wa.me/${digits}` : `https://wa.me/55${digits}`;
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

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role_label.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "Todos os status" ||
      (statusFilter === "Ativo" && emp.status === "Ativo") ||
      (statusFilter === "Inativo" && emp.status === "Inativo");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full min-h-screen bg-matte-canvas text-on-surface">
      {/* Desktop Layout */}
      <main className="hidden md:block p-margin-desktop space-y-8">
        {/* Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Clientes / Funcionários</h1>
            <p className="text-on-surface-variant font-label-muted mt-1">
              {isLoading
                ? "Carregando registros..."
                : `${clients.length} tutores e ${employees.length} colaboradores ativos no Supabase`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isOwnerOrAdmin && (
              <Link
                href="/admin/register-admin"
                className="bg-surface-container border border-primary/40 text-primary font-label-bold text-label-bold px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-primary/10 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">person_add</span>
                Cadastrar Colaborador
              </Link>
            )}

            <button
              onClick={() => setShowNewClientModal(true)}
              className="bg-primary text-on-primary font-label-bold text-label-bold px-6 py-3 rounded-lg flex items-center gap-2 extruded-shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">group_add</span>
              Cadastrar Cliente
            </button>
          </div>
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
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-2 rounded-lg">badge</span>
              <span className="text-caption text-primary">Equipe</span>
            </div>
            <div className="text-headline-md font-headline-md text-on-surface">{employees.length}</div>
            <div className="text-caption font-label-muted text-on-surface-variant">Funcionários ativos</div>
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

        {/* Filter Bar & Tabs */}
        <div className="space-y-4">
          <div className="flex border-b border-hairline-border gap-6">
            <button
              onClick={() => setActiveTab("clientes")}
              className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "clientes"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">group</span>
              Clientes / Tutores ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab("funcionarios")}
              className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "funcionarios"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">badge</span>
              Funcionários Ativos & Equipe ({employees.length})
            </button>
          </div>

          <div className="bg-surface-container border border-hairline-border p-4 rounded-xl flex flex-wrap items-center gap-4">
            <div className="flex-1 relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-matte-canvas border-hairline-border border rounded-lg pl-10 pr-4 py-2.5 text-label-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface placeholder:text-outline"
                placeholder={
                  activeTab === "clientes"
                    ? "Buscar cliente por nome, email, telefone ou pet..."
                    : "Buscar colaborador por nome, e-mail ou cargo..."
                }
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
        </div>

        {/* Table Section */}
        <div className="bg-elevated-card border border-hairline-border rounded-xl extruded-shadow overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === "clientes" ? (
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
                        <td className="px-6 py-5"><div className="h-10 w-36 bg-surface-container-highest rounded"></div></td>
                        <td className="px-6 py-5"><div className="h-8 w-44 bg-surface-container-highest rounded"></div></td>
                        <td className="px-6 py-5"><div className="h-6 w-24 bg-surface-container-highest rounded"></div></td>
                        <td className="px-6 py-5"><div className="h-6 w-20 bg-surface-container-highest rounded"></div></td>
                        <td className="px-6 py-5 text-center"><div className="h-6 w-16 bg-surface-container-highest rounded mx-auto"></div></td>
                        <td className="px-6 py-5 text-right"><div className="h-6 w-8 bg-surface-container-highest rounded ml-auto"></div></td>
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

                        <td className="px-6 py-5">
                          <div className="flex flex-wrap items-center gap-2">
                            {client.pets.map((pet) => (
                              <span
                                key={pet.id}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-highest border border-hairline-border rounded-lg text-xs font-label-bold text-on-surface"
                              >
                                <span className="material-symbols-outlined text-[14px] text-primary">pets</span>
                                {pet.name} ({pet.breed || pet.species})
                              </span>
                            ))}

                            <button
                              onClick={() => handleOpenAddPetModal(client)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-bold rounded-lg transition-all cursor-pointer"
                              title={`Adicionar novo pet diretamente para ${client.full_name}`}
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                              {client.pets.length === 0 ? "Vincular Pet" : "Pet"}
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                            <span className="text-label-muted">{formatDate(client.created_at)}</span>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-center">
                            <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-label-bold uppercase">
                              {client.status}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {client.phone && client.phone !== "Não informado" && (
                              <a
                                href={getWhatsAppLink(client.phone)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                title="Abrir contato direto no WhatsApp"
                              >
                                <span className="material-symbols-outlined text-lg">chat</span>
                              </a>
                            )}
                            <button
                              onClick={() => setSelectedClient(client)}
                              className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                              title="Ver detalhes e cadastrar novos pets"
                            >
                              <span className="material-symbols-outlined text-lg">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              /* TABELA DE FUNCIONÁRIOS E EQUIPE ATIVA */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline-border bg-surface-container-low">
                    <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Colaborador</th>
                    <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Contato / E-mail</th>
                    <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Cargo / Função</th>
                    <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Data de Cadastro</th>
                    <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-border">
                  {isLoading ? (
                    [1, 2, 3].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-5"><div className="h-10 w-36 bg-surface-container-highest rounded"></div></td>
                        <td className="px-6 py-5"><div className="h-8 w-44 bg-surface-container-highest rounded"></div></td>
                        <td className="px-6 py-5"><div className="h-6 w-24 bg-surface-container-highest rounded"></div></td>
                        <td className="px-6 py-5"><div className="h-6 w-20 bg-surface-container-highest rounded"></div></td>
                        <td className="px-6 py-5 text-center"><div className="h-6 w-16 bg-surface-container-highest rounded mx-auto"></div></td>
                        <td className="px-6 py-5 text-right"><div className="h-6 w-8 bg-surface-container-highest rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-4xl text-outline mb-2">badge</span>
                        <p className="font-bold">Nenhum funcionário encontrado</p>
                        <p className="text-xs text-outline mt-1">Nenhum membro de equipe cadastrado ainda.</p>
                        {isOwnerOrAdmin && (
                          <Link
                            href="/admin/register-admin"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold"
                          >
                            <span className="material-symbols-outlined text-base">person_add</span>
                            Cadastrar Primeiro Colaborador
                          </Link>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const badgeInfo = ROLE_BADGE_STYLE[emp.role] || {
                        bg: "bg-primary/20 text-primary border-primary/30",
                        icon: "badge",
                      };
                      return (
                        <tr key={emp.id} className="hover:bg-surface-container-high/30 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm">
                                {getInitials(emp.full_name)}
                              </div>
                              <div>
                                <div className="font-label-bold text-on-surface font-bold">{emp.full_name}</div>
                                <div className="text-caption text-on-surface-variant font-mono">{emp.role_label}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-on-surface-variant">
                                <span className="material-symbols-outlined text-sm text-primary">call</span>
                                <span className="text-label-muted">{emp.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-on-surface-variant/70">
                                <span className="material-symbols-outlined text-sm">mail</span>
                                <span className="text-caption">{emp.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeInfo.bg}`}>
                              <span className="material-symbols-outlined text-sm">{badgeInfo.icon}</span>
                              {emp.role_label}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <span className="material-symbols-outlined text-sm">calendar_month</span>
                              <span className="text-label-muted">{formatDate(emp.created_at)}</span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-label-bold uppercase">
                                {emp.status}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {emp.phone && emp.phone !== "Não informado" && (
                                <a
                                  href={getWhatsAppLink(emp.phone)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                  title="Enviar mensagem limpa no WhatsApp"
                                >
                                  <span className="material-symbols-outlined text-lg">chat</span>
                                </a>
                              )}
                              {isOwnerOrAdmin && (
                                <Link
                                  href="/admin/register-admin"
                                  className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                                  title="Editar ou alterar cargo do colaborador"
                                >
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Layout */}
      <main className="block md:hidden px-5 pb-32 pt-4 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Clientes / Funcionários</h1>
            <p className="text-xs text-on-surface-variant">{clients.length} clientes • {employees.length} colaboradores</p>
          </div>
          <button
            onClick={() => setShowNewClientModal(true)}
            className="bg-primary text-on-primary p-2.5 rounded-full extruded-shadow"
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
        </div>

        {/* Mobile Tabs */}
        <div className="flex border-b border-hairline-border">
          <button
            onClick={() => setActiveTab("clientes")}
            className={`flex-1 py-2 text-xs font-bold border-b-2 text-center ${
              activeTab === "clientes" ? "border-primary text-primary" : "border-transparent text-on-surface-variant"
            }`}
          >
            Clientes ({clients.length})
          </button>
          <button
            onClick={() => setActiveTab("funcionarios")}
            className={`flex-1 py-2 text-xs font-bold border-b-2 text-center ${
              activeTab === "funcionarios" ? "border-primary text-primary" : "border-transparent text-on-surface-variant"
            }`}
          >
            Funcionários ({employees.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container border-hairline-border border rounded-full pl-10 pr-4 py-2 text-sm text-on-surface outline-none placeholder:text-outline"
            placeholder="Buscar..."
          />
        </div>

        {/* Cards List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-4 text-center text-on-surface-variant">Carregando...</div>
          ) : activeTab === "clientes" ? (
            filteredClients.map((client) => {
              const petCount = (client.pets || []).length;
              const statusLabel = client.status === "active" ? "Ativo" : "Inativo";
              const statusColor = client.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-surface-container-high text-on-surface-variant border-hairline-border";

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="bg-elevated-card border border-hairline-border p-4 rounded-xl space-y-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {getInitials(client.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-on-surface truncate">{client.full_name}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">{client.phone}</p>
                      <p className="text-[11px] text-outline truncate">{client.email}</p>
                      <p className="text-[11px] text-on-surface-variant">{petCount} pet(s) cadastrado(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/55${client.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-emerald-500/25 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">chat</span>
                      WhatsApp
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(client);
                        setShowAddPetModal(true);
                      }}
                      className="flex-1 bg-primary/15 border border-primary/40 text-primary text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary/25 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">pets</span>
                      Add Pet
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} className="bg-elevated-card border border-hairline-border p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {getInitials(emp.full_name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface">{emp.full_name}</h3>
                      <p className="text-xs text-primary font-bold">{emp.role_label}</p>
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant">{emp.phone}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Novo Cliente */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-md w-full p-6 space-y-6 extruded-shadow animate-in fade-in">
            <div className="flex justify-between items-center border-b border-hairline-border pb-4">
              <h3 className="font-headline-md text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">group_add</span>
                Cadastrar Novo Cliente / Tutor
              </h3>
              <button
                onClick={() => setShowNewClientModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                  Nome Completo do Tutor *
                </label>
                <input
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                  Telefone / WhatsApp *
                </label>
                <input
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                  E-mail do Tutor *
                </label>
                <input
                  required
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="maria@email.com"
                  type="email"
                  className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary font-medium"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  O e-mail será validado e vinculado à conta de tutor do cliente no sistema.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="flex-1 py-3 bg-surface-container text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingClient}
                  className="flex-1 py-3 bg-primary text-on-primary font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingClient ? "Salvando..." : "Cadastrar Tutor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Novo Pet Completo Vinculado ao Tutor */}
      {showAddPetModal && petTargetClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-lg w-full p-6 space-y-6 extruded-shadow animate-in fade-in my-8">
            <div className="flex justify-between items-center border-b border-hairline-border pb-4">
              <div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">pets</span>
                  Cadastrar Pet para {petTargetClient.full_name}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Ficha completa do pet vinculada ao tutor
                </p>
              </div>
              <button
                onClick={() => setShowAddPetModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePetForClient} className="space-y-4">
              {/* Foto do Pet */}
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-20 h-20 rounded-full bg-surface-container border-2 border-dashed border-hairline-border flex items-center justify-center relative overflow-hidden group">
                  {petPhotoUrl ? (
                    <img src={petPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-outline">photo_camera</span>
                  )}
                </div>
                <input
                  type="url"
                  value={petPhotoUrl}
                  onChange={(e) => setPetPhotoUrl(e.target.value)}
                  placeholder="URL da Foto do Pet (Opcional)"
                  className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2 text-xs text-on-surface placeholder:text-outline outline-none text-center"
                />
              </div>

              {/* Nome do Pet */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                  Nome do Pet *
                </label>
                <input
                  required
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Ex: Bob, Nina, Tobey..."
                  className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                    Espécie *
                  </label>
                  <select
                    value={petSpecies}
                    onChange={(e) => setPetSpecies(e.target.value)}
                    className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary cursor-pointer font-medium"
                  >
                    <option value="Cachorro">Cachorro</option>
                    <option value="Gato">Gato</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                    Raça
                  </label>
                  <input
                    value={petBreed}
                    onChange={(e) => setPetBreed(e.target.value)}
                    placeholder="Ex: Poodle, Shih Tzu, SRD"
                    className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary font-medium"
                  />
                </div>
              </div>

              {/* Sexo (Macho / Fêmea buttons) */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                  Sexo
                </label>
                <div className="flex bg-surface-container p-1 rounded-xl border border-hairline-border">
                  <button
                    type="button"
                    onClick={() => setPetSex("Macho")}
                    className={`flex-1 text-center py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      petSex === "Macho"
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Macho
                  </button>
                  <button
                    type="button"
                    onClick={() => setPetSex("Fêmea")}
                    className={`flex-1 text-center py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      petSex === "Fêmea"
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Fêmea
                  </button>
                </div>
              </div>

              {/* Idade Aproximada: Anos e Meses */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                  Idade Aproximada
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-0.5">Anos</label>
                    <select
                      value={petAgeYears}
                      onChange={(e) => setPetAgeYears(e.target.value)}
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2 text-on-surface text-sm outline-none cursor-pointer"
                    >
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i} value={i}>{i} {i === 1 ? "ano" : "anos"}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-0.5">Meses</label>
                    <select
                      value={petAgeMonths}
                      onChange={(e) => setPetAgeMonths(e.target.value)}
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2 text-on-surface text-sm outline-none cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>{i} {i === 1 ? "mês" : "meses"}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                    Peso QUILOGRAMAS (KG)
                  </label>
                  <input
                    value={petWeight}
                    onChange={(e) => setPetWeight(e.target.value)}
                    placeholder="Ex: 8.5"
                    type="number"
                    step="0.1"
                    className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                    Pelagem
                  </label>
                  <select
                    value={petCoat}
                    onChange={(e) => setPetCoat(e.target.value)}
                    className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary cursor-pointer font-medium"
                  >
                    <option value="Curta">Curta</option>
                    <option value="Média">Média</option>
                    <option value="Longa">Longa</option>
                    <option value="Lisa">Lisa</option>
                    <option value="Cacheada">Cacheada</option>
                    <option value="Crespa">Crespa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                  Cor
                </label>
                <input
                  value={petColor}
                  onChange={(e) => setPetColor(e.target.value)}
                  placeholder="Ex: Preto e Branco"
                  className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary font-medium"
                />
              </div>

              {/* Checkbox Castrado */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="client_pet_castrated"
                  type="checkbox"
                  checked={petIsCastrated}
                  onChange={(e) => setPetIsCastrated(e.target.checked)}
                  className="rounded bg-surface-container border-hairline-border text-primary cursor-pointer w-4 h-4"
                />
                <label htmlFor="client_pet_castrated" className="text-xs text-on-surface font-bold cursor-pointer">
                  Meu pet é castrado
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                  Observações Clínicas / Cuidados
                </label>
                <textarea
                  value={petObservations}
                  onChange={(e) => setPetObservations(e.target.value)}
                  placeholder="Ex: Alérgico a sabão com fragrância, bravo para cortar unhas..."
                  rows={2}
                  className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary font-medium"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddPetModal(false)}
                  className="flex-1 py-3 bg-surface-container text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPet}
                  className="flex-1 py-3 bg-primary text-on-primary font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingPet ? "Salvando Pet..." : "Salvar e Vincular Pet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes do Cliente */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-md w-full p-6 space-y-6 extruded-shadow animate-in fade-in">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold text-lg">
                  {getInitials(selectedClient.full_name)}
                </div>
                <div>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">{selectedClient.full_name}</h3>
                  <span className="inline-block text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded mt-1">
                    Cliente {selectedClient.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 border-t border-hairline-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Telefone / WhatsApp:</span>
                <span className="text-on-surface">{selectedClient.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">E-mail:</span>
                <span className="text-on-surface">{selectedClient.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Data de Cadastro:</span>
                <span className="text-on-surface">{formatDate(selectedClient.created_at)}</span>
              </div>
            </div>

            {clientPackages.filter((p) => p.status === "ativo").length > 0 && (
              <div className="space-y-2 border-t border-hairline-border pt-3">
                <h5 className="text-xs font-bold text-on-surface-variant uppercase">Pacotes Ativos</h5>
                {clientPackages
                  .filter((p) => p.status === "ativo")
                  .map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-2.5 bg-surface-container rounded-xl border border-hairline-border text-xs">
                      <div>
                        <p className="font-bold text-on-surface">{pkg.package_name}</p>
                        {pkg.expires_at && (
                          <p className="text-[10px] text-on-surface-variant">Válido até {formatDate(pkg.expires_at)}</p>
                        )}
                      </div>
                      <span className="font-bold text-primary">{pkg.total_credits - pkg.used_credits}/{pkg.total_credits}</span>
                    </div>
                  ))}
              </div>
            )}

            <div className="space-y-3 border-t border-hairline-border pt-3">
              <div className="flex justify-between items-center">
                <h5 className="text-xs font-bold text-on-surface-variant uppercase">Pets Associados ({selectedClient.pets.length})</h5>
                <button
                  onClick={() => {
                    const client = selectedClient;
                    setSelectedClient(null);
                    handleOpenAddPetModal(client);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Adicionar Pet
                </button>
              </div>

              {selectedClient.pets.length > 0 ? (
                selectedClient.pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="flex items-center justify-between p-3 bg-surface-container rounded-xl border border-hairline-border hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">pets</span>
                      <div>
                        <span className="font-bold text-on-surface text-sm">{pet.name}</span>
                        <span className="text-xs text-on-surface-variant ml-2">{pet.breed || pet.species}</span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/pets?search=${encodeURIComponent(pet.name)}&id=${pet.id}`}
                      onClick={() => setSelectedClient(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-on-primary text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      Ver Pet
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant italic py-2">Nenhum pet vinculado a este tutor ainda.</p>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              {selectedClient.phone && selectedClient.phone !== "Não informado" && (
                <a
                  href={getWhatsAppLink(selectedClient.phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  Contato no WhatsApp
                </a>
              )}
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-3 bg-surface-container text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
