"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { calculateAgeFromBirthDate, getYearsMonthsFromBirthDate } from "@/lib/utils/formatters";

interface AdminPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  weight: string;
  coat: string;
  color: string;
  birth_date?: string;
  is_neutered?: boolean;
  observations: string;
  photo_url: string;
  tutor_id?: string;
  tutor_name: string;
  tutor_phone: string;
  created_at?: string;
  current_status: string;
}

interface ClientOption {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

function PetsContent() {
  const searchParams = useSearchParams();
  const searchParamQuery = searchParams.get("search") || searchParams.get("pet") || "";
  const petIdQuery = searchParams.get("id") || "";

  const [pets, setPets] = useState<AdminPet[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParamQuery);
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState("Todos");
  const [selectedPetDetail, setSelectedPetDetail] = useState<AdminPet | null>(null);

  // Mobile layout state
  const [mobileLimit, setMobileLimit] = useState(6);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);

  // Create Pet Modal States
  const [showCreatePetModal, setShowCreatePetModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
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

  // Estado para edição de pet existente
  const [editingPet, setEditingPet] = useState<AdminPet | null>(null);

  const handleOpenEditModal = (pet: AdminPet) => {
    setSelectedPetDetail(null); // Fecha o modal de detalhes antes de abrir a edição
    setEditingPet(pet);
    setSelectedClientId(pet.tutor_id || (clients[0]?.id || ""));
    setPetName(pet.name);
    setPetSpecies(pet.species || "Cachorro");
    setPetBreed(pet.breed || "");
    setPetSex(pet.sex || "Macho");
    const { years, months } = getYearsMonthsFromBirthDate(pet.birth_date);
    setPetAgeYears(years);
    setPetAgeMonths(months);
    setPetWeight(pet.weight ? pet.weight.replace(/\s*kg/i, "") : "");
    setPetCoat(pet.coat || "Curta");
    setPetColor(pet.color || "");
    setPetIsCastrated(Boolean(pet.is_neutered));
    setPetPhotoUrl(pet.photo_url || "");
    setPetObservations(pet.observations || "");
    setShowCreatePetModal(true);
  };

  const handleDeletePet = async (petId: string, petName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o pet "${petName}"? Esta ação removerá a ficha permanentemente.`)) return;
    try {
      const res = await fetch(`/api/admin/pets?id=${petId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao excluir pet.");
      
      setSelectedPetDetail(null);
      await loadAdminPets();
      alert("Pet excluído com sucesso!");
    } catch (err: any) {
      alert(err.message || "Não foi possível excluir o pet.");
    }
  };

  const loadAdminPets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/pets");
      const data = await res.json();
      if (res.ok && data.pets) {
        setPets(data.pets);

        if (petIdQuery || searchParamQuery) {
          const foundPet = data.pets.find(
            (p: AdminPet) =>
              (petIdQuery && p.id === petIdQuery) ||
              (searchParamQuery && p.name.toLowerCase() === searchParamQuery.toLowerCase())
          );
          if (foundPet) {
            setSelectedPetDetail(foundPet);
          }
        }
      }

      // Load clients list for the tutor select dropdown
      const clientsRes = await fetch("/api/admin/clients");
      const clientsData = await clientsRes.json();
      if (clientsRes.ok && clientsData.clients) {
        setClients(clientsData.clients);
      }
    } catch (err) {
      console.error("Erro ao carregar pets do Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchParamQuery) {
      setSearchTerm(searchParamQuery);
    }
  }, [searchParamQuery]);

  useEffect(() => {
    loadAdminPets();
  }, [petIdQuery, searchParamQuery]);

  const handleOpenCreateModal = () => {
    setSelectedPetDetail(null);
    setEditingPet(null);
    setSelectedClientId(clients[0]?.id || "");
    setPetName("");
    setPetSpecies("Cachorro");
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
    setShowCreatePetModal(true);
  };

  const handleCreatePetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName.trim()) {
      alert("Por favor, preencha o nome do pet.");
      return;
    }

    if (!selectedClientId) {
      alert("Por favor, selecione o tutor responsável.");
      return;
    }

    setIsSavingPet(true);
    try {
      const method = editingPet ? "PUT" : "POST";
      const payload: Record<string, any> = {
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
        client_id: selectedClientId,
      };

      if (editingPet) {
        payload.id = editingPet.id;
      }

      const res = await fetch("/api/admin/pets", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.pet)) {
        setShowCreatePetModal(false);
        setEditingPet(null);
        setSelectedPetDetail(null);
        await loadAdminPets();
        alert(`🎉 Pet ${petName} ${editingPet ? "atualizado" : "cadastrado"} com sucesso!`);
      } else {
        alert(`Erro ao salvar pet: ${data.error || "Tente novamente."}`);
      }
    } catch (err) {
      console.error("Erro ao salvar pet:", err);
      alert("Erro de conexão ao salvar pet.");
    } finally {
      setIsSavingPet(false);
    }
  };

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.tutor_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecies =
      selectedSpeciesFilter === "Todos" ||
      (selectedSpeciesFilter === "Cachorros" && pet.species === "Cachorro") ||
      (selectedSpeciesFilter === "Gatos" && pet.species === "Gato") ||
      (selectedSpeciesFilter === "Outros" && pet.species !== "Cachorro" && pet.species !== "Gato");

    return matchesSearch && matchesSpecies;
  });

  return (
    <div className="w-full min-h-screen bg-matte-canvas text-on-surface">
      {/* Desktop Layout */}
      <main className="hidden md:block p-margin-desktop min-h-screen pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header & Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Pets & Prontuários</h1>
              <p className="text-body-base text-on-surface-variant">
                {isLoading ? (
                  "Carregando pets..."
                ) : (
                  <>
                    <span className="text-primary font-bold">{pets.length} pets</span> registrados no Supabase
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  search
                </span>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por pet ou tutor..."
                  className="w-full bg-surface-container border border-hairline-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="bg-primary text-on-primary font-label-bold text-label-bold px-5 py-2.5 rounded-xl flex items-center gap-2 extruded-shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-xl">add</span>
                Cadastrar Novo Pet
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 border-b border-hairline-border pb-4">
            {["Todos", "Cachorros", "Gatos", "Outros"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedSpeciesFilter(filter)}
                className={`px-4 py-2 rounded-full font-label-bold text-xs transition-all cursor-pointer ${
                  selectedSpeciesFilter === filter
                    ? "bg-primary text-on-primary extruded-shadow"
                    : "bg-elevated-card text-on-surface-variant hover:text-on-surface border border-hairline-border"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Bento Pets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-elevated-card border border-hairline-border rounded-xl p-5 animate-pulse flex flex-col gap-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-xl bg-surface-container-highest"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-surface-container-highest rounded w-3/4"></div>
                      <div className="h-3 bg-surface-container-highest rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-3 bg-surface-container-highest rounded"></div>
                    <div className="h-3 bg-surface-container-highest rounded"></div>
                  </div>
                </div>
              ))
            ) : filteredPets.length === 0 ? (
              <div className="col-span-full bg-elevated-card border border-hairline-border rounded-xl p-12 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-outline">pets</span>
                <p className="font-bold text-on-surface">Nenhum pet encontrado</p>
                <p className="text-xs text-on-surface-variant">Nenhum pet cadastrado corresponde à busca "{searchTerm}".</p>
                <button
                  onClick={handleOpenCreateModal}
                  className="mt-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Cadastrar Primeiro Pet
                </button>
              </div>
            ) : (
              <>
                {filteredPets.map((pet) => (
                  <div
                    key={pet.id}
                    className="bg-elevated-card border border-hairline-border rounded-xl p-5 extruded-shadow group hover:border-primary/50 transition-all duration-300 relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-hairline-border group-hover:border-primary/30 transition-colors flex-shrink-0">
                          <img className="w-full h-full object-cover" alt={pet.name} src={pet.photo_url} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-headline-md text-body-lg font-bold text-on-surface">{pet.name}</h3>
                            <span className="flex h-2 w-2 rounded-full bg-primary pulse-node" title={pet.current_status}></span>
                          </div>
                          <p className="text-caption text-on-surface-variant">{pet.breed} ({pet.species})</p>
                          <span className="inline-block text-[10px] text-primary/80 font-bold bg-primary/10 px-2 py-0.5 rounded mt-1">
                            {pet.sex}
                          </span>
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6 pt-2 border-t border-hairline-border/40">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Peso</p>
                          <p className="text-label-bold text-on-surface">{pet.weight}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Pelagem</p>
                          <p className="text-label-bold text-on-surface">{pet.coat}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Cor</p>
                          <p className="text-label-bold text-on-surface truncate" title={pet.color}>{pet.color}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Tutor (Cliente)</p>
                          <p className="text-label-bold text-primary font-bold truncate" title={pet.tutor_name}>
                            {pet.tutor_name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Button Details */}
                    <button
                      onClick={() => setSelectedPetDetail(pet)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-primary/10 hover:text-primary border border-hairline-border transition-all font-label-bold text-label-bold cursor-pointer"
                    >
                      Ver Detalhes
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                ))}

                {/* Add New Pet Dashed Card */}
                <button
                  onClick={handleOpenCreateModal}
                  className="bg-surface-container-low border-2 border-dashed border-hairline-border rounded-xl p-5 hover:border-primary/50 hover:bg-surface-container-high transition-all flex flex-col items-center justify-center gap-3 min-h-[280px] cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">add</span>
                  </div>
                  <p className="font-label-bold text-label-bold text-on-surface">Cadastrar Novo Pet</p>
                  <p className="text-caption text-on-surface-variant text-center px-4">
                    Localize o cliente e adicione pets diretamente ao perfil do tutor.
                  </p>
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Layout (Fiel à imagem de referência) */}
      <main className="block md:hidden px-4 pb-28 pt-3 space-y-5 bg-matte-canvas min-h-screen text-on-surface">
        {/* Mobile Header Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">pets</span>
            <span className="font-headline-md text-lg font-bold text-primary tracking-tight">PetNexus</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowMobileFilterMenu((prev) => !prev)}
              className="w-9 h-9 rounded-full bg-surface-container border border-hairline-border flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              title="Buscar pets ou tutores"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
          </div>
        </div>

        {/* Search Input Dropdown / Toggle */}
        {showMobileFilterMenu && (
          <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container border border-hairline-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary placeholder:text-outline"
              placeholder="Buscar por pet ou tutor..."
              autoFocus
            />
          </div>
        )}

        {/* Cards de Métricas Horizontais (Bento Horizontal Carousel) */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {/* Card 1: Total de Pets */}
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-4 min-w-[135px] flex-1 space-y-2 shrink-0 extruded-shadow">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary text-xl">pets</span>
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">+12%</span>
            </div>
            <div>
              <p className="text-[11px] text-on-surface-variant font-bold">Total de Pets</p>
              <p className="text-2xl font-bold text-on-surface font-mono">{pets.length}</p>
            </div>
          </div>

          {/* Card 2: Tarefas Urgentes / Prontuários */}
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-4 min-w-[135px] flex-1 space-y-2 shrink-0 extruded-shadow">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-amber-400 text-xl">medical_services</span>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            </div>
            <div>
              <p className="text-[11px] text-on-surface-variant font-bold">Tarefas Urgentes</p>
              <p className="text-2xl font-bold text-on-surface font-mono">8</p>
            </div>
          </div>

          {/* Card 3: Entradas Hoje */}
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-4 min-w-[135px] flex-1 space-y-2 shrink-0 extruded-shadow">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-emerald-400 text-xl">calendar_month</span>
            </div>
            <div>
              <p className="text-[11px] text-on-surface-variant font-bold">Entradas Hoje</p>
              <p className="text-2xl font-bold text-on-surface font-mono">24</p>
            </div>
          </div>
        </div>

        {/* Título de Seção & Botão de Filtro */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">Registro de Pets</h2>
            <p className="text-xs text-on-surface-variant">Gerencie seus clientes ativos</p>
          </div>
          <button
            onClick={() => {
              const nextFilter =
                selectedSpeciesFilter === "Todos"
                  ? "Cachorros"
                  : selectedSpeciesFilter === "Cachorros"
                  ? "Gatos"
                  : selectedSpeciesFilter === "Gatos"
                  ? "Outros"
                  : "Todos";
              setSelectedSpeciesFilter(nextFilter);
            }}
            className="w-10 h-10 rounded-xl bg-surface-container border border-hairline-border flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer relative"
            title="Filtrar por espécie"
          >
            <span className="material-symbols-outlined text-xl">tune</span>
            {selectedSpeciesFilter !== "Todos" && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full"></span>
            )}
          </button>
        </div>

        {/* Pills de Espécie em Filtro Rápido */}
        {selectedSpeciesFilter !== "Todos" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-on-surface-variant font-bold">Filtro:</span>
            <span className="bg-primary text-on-primary font-bold px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1">
              {selectedSpeciesFilter}
              <button onClick={() => setSelectedSpeciesFilter("Todos")} className="hover:opacity-75 font-bold ml-1">
                ×
              </button>
            </span>
          </div>
        )}

        {/* Lista de Pets no Estilo da Imagem (Cards com Foto à Esquerda, Nome/Tutor no Meio e Botão Ver Perfil à Direita) */}
        <div className="space-y-3 pt-1">
          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant animate-pulse space-y-3">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
              <p className="text-xs font-bold">Carregando pets...</p>
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="bg-surface-container border border-hairline-border rounded-2xl p-8 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-outline">pets</span>
              <p className="font-bold text-sm text-on-surface">Nenhum pet encontrado</p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl"
              >
                Cadastrar Pet
              </button>
            </div>
          ) : (
            filteredPets.slice(0, mobileLimit).map((pet, idx) => (
              <div
                key={pet.id}
                className="bg-surface-container border border-hairline-border rounded-2xl p-3.5 flex items-center justify-between gap-3 extruded-shadow hover:border-primary/40 transition-all"
              >
                {/* Foto do Pet (Quadrada com Cantos Arredondados) */}
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-hairline-border shrink-0 bg-surface-container-high">
                  <img
                    src={pet.photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300"}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Conteúdo Central: Nome, Status, Raça e Tutor */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-primary text-base truncate">{pet.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        idx % 3 === 1
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {idx % 3 === 1 ? "Pendente" : "Ativo"}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium truncate">{pet.breed || pet.species}</p>
                  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant/80 truncate">
                    <span className="material-symbols-outlined text-[13px]">person</span>
                    <span className="truncate">{pet.tutor_name}</span>
                  </div>
                </div>

                {/* Botão Ver Perfil (Verde em Destaque) */}
                <button
                  onClick={() => setSelectedPetDetail(pet)}
                  className="bg-primary text-on-primary font-bold text-xs px-3.5 py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  Ver Perfil
                </button>
              </div>
            ))
          )}
        </div>

        {/* Botão "Carregar mais Pets" */}
        {filteredPets.length > mobileLimit && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setMobileLimit((prev) => prev + 6)}
              className="px-6 py-2.5 bg-surface-container border border-hairline-border text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-high transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Carregar mais Pets</span>
              <span className="material-symbols-outlined text-base">expand_more</span>
            </button>
          </div>
        )}

        {/* Floating Action Button (FAB +) Flutuante no Canto Inferior Direito */}
        <button
          onClick={handleOpenCreateModal}
          className="fixed bottom-24 right-5 z-40 bg-primary text-on-primary w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer extruded-shadow"
          title="Cadastrar Novo Pet"
        >
          <span className="material-symbols-outlined text-2xl font-bold">add</span>
        </button>
      </main>

      {/* Modal Cadastrar Novo Pet (Com todos os 11 campos da ficha de pet) */}
      {showCreatePetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col extruded-shadow animate-in fade-in">
            <div className="flex justify-between items-center border-b border-hairline-border p-6 pb-4 shrink-0">
              <div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">pets</span>
                  Cadastrar Novo Pet
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Preencha a ficha completa e vincule o pet ao tutor responsável
                </p>
              </div>
              <button
                onClick={() => setShowCreatePetModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreatePetSubmit} className="p-6 pt-4 space-y-4 overflow-y-auto">
              {/* Selecionar Tutor (Cliente) */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                  Tutor / Cliente Responsável *
                </label>
                {clients.length === 0 ? (
                  <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    Nenhum cliente cadastrado ainda. Cadastre um cliente antes de registrar o pet.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary cursor-pointer font-medium"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.phone || c.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Foto do Pet */}
              <div className="flex flex-col items-center justify-center gap-2 pt-1">
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
                  id="admin_pet_castrated"
                  type="checkbox"
                  checked={petIsCastrated}
                  onChange={(e) => setPetIsCastrated(e.target.checked)}
                  className="rounded bg-surface-container border-hairline-border text-primary cursor-pointer w-4 h-4"
                />
                <label htmlFor="admin_pet_castrated" className="text-xs text-on-surface font-bold cursor-pointer">
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
                  onClick={() => setShowCreatePetModal(false)}
                  className="flex-1 py-3 bg-surface-container text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPet}
                  className="flex-1 py-3 bg-primary text-on-primary font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingPet ? "Salvando Pet..." : "Salvar e Cadastrar Pet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pet Detail Modal */}
      {selectedPetDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-md w-full p-6 space-y-6 extruded-shadow animate-in fade-in">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img src={selectedPetDetail.photo_url} alt={selectedPetDetail.name} className="w-16 h-16 rounded-xl object-cover border-2 border-primary" />
                <div>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">{selectedPetDetail.name}</h3>
                  <p className="text-xs text-on-surface-variant">{selectedPetDetail.breed} ({selectedPetDetail.species})</p>
                  <span className="inline-block text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded mt-1">
                    {selectedPetDetail.sex}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPetDetail(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 border-t border-hairline-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Tutor (Cliente):</span>
                <span className="text-primary font-bold">{selectedPetDetail.tutor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Telefone do Tutor:</span>
                <span className="text-on-surface">{selectedPetDetail.tutor_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Idade Aproximada:</span>
                <span className="text-on-surface font-semibold">{calculateAgeFromBirthDate(selectedPetDetail.birth_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Peso:</span>
                <span className="text-on-surface">{selectedPetDetail.weight}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Pelagem:</span>
                <span className="text-on-surface">{selectedPetDetail.coat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Cor:</span>
                <span className="text-on-surface">{selectedPetDetail.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Castrado:</span>
                <span className="text-on-surface">{selectedPetDetail.is_neutered ? "Sim" : "Não"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Status Atual:</span>
                <span className="text-emerald-400 font-bold">{selectedPetDetail.current_status}</span>
              </div>
            </div>

            <div className="space-y-1 border-t border-hairline-border pt-3">
              <h5 className="text-xs font-bold text-on-surface-variant uppercase">Observações</h5>
              <p className="text-xs text-on-surface bg-surface-container p-3 rounded-xl border border-hairline-border">
                {selectedPetDetail.observations}
              </p>
            </div>

            <div className="pt-3 border-t border-hairline-border flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => handleDeletePet(selectedPetDetail.id, selectedPetDetail.name)}
                className="px-3.5 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Excluir Pet
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEditModal(selectedPetDetail);
                  }}
                  className="px-4 py-2.5 bg-primary/20 border border-primary/40 text-primary font-bold text-xs rounded-xl hover:bg-primary/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Editar Pet
                </button>
                <button
                  onClick={() => setSelectedPetDetail(null)}
                  className="px-4 py-2.5 bg-surface-container text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-on-surface-variant">Carregando pets...</div>}>
      <PetsContent />
    </Suspense>
  );
}
