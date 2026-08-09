"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface AdminPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  weight: string;
  coat: string;
  color: string;
  observations: string;
  photo_url: string;
  tutor_id?: string;
  tutor_name: string;
  tutor_phone: string;
  created_at?: string;
  current_status: string;
}

function PetsContent() {
  const searchParams = useSearchParams();
  const searchParamQuery = searchParams.get("search") || searchParams.get("pet") || "";
  const petIdQuery = searchParams.get("id") || "";

  const [pets, setPets] = useState<AdminPet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParamQuery);
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState("Todos");
  const [selectedPetDetail, setSelectedPetDetail] = useState<AdminPet | null>(null);

  useEffect(() => {
    if (searchParamQuery) {
      setSearchTerm(searchParamQuery);
    }
  }, [searchParamQuery]);

  useEffect(() => {
    async function loadAdminPets() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/pets");
        const data = await res.json();
        if (res.ok && data.pets) {
          setPets(data.pets);

          // Se houver petIdQuery ou searchParamQuery, encontrar o pet e abrir os detalhes automaticamente
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
      } catch (err) {
        console.error("Erro ao carregar pets do Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAdminPets();
  }, [petIdQuery, searchParamQuery]);

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
          {/* Header & Filter Pills */}
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
                  className="w-full bg-surface-container border border-hairline-border rounded-xl pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
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
            </div>
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
                <Link
                  href="/admin/clientes"
                  className="bg-surface-container-low border-2 border-dashed border-hairline-border rounded-xl p-5 hover:border-primary/50 hover:bg-surface-container-high transition-all flex flex-col items-center justify-center gap-3 min-h-[280px]"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[32px]">add</span>
                  </div>
                  <p className="font-label-bold text-label-bold text-on-surface">Cadastrar Novo Pet</p>
                  <p className="text-caption text-on-surface-variant text-center px-4">
                    Localize o cliente e adicione pets diretamente ao perfil do tutor.
                  </p>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Layout */}
      <main className="block md:hidden px-5 pb-32 pt-4 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Pets</h1>
            <p className="text-xs text-on-surface-variant">{pets.length} pets cadastrados</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container border-hairline-border border rounded-full pl-10 pr-4 py-2 text-sm text-on-surface outline-none placeholder:text-outline"
            placeholder="Buscar por pet ou tutor..."
          />
        </div>

        {/* Cards List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-4 text-center text-on-surface-variant">Carregando...</div>
          ) : filteredPets.map((pet) => (
            <div
              key={pet.id}
              onClick={() => setSelectedPetDetail(pet)}
              className="bg-elevated-card border border-hairline-border p-4 rounded-xl space-y-3 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <img src={pet.photo_url} alt={pet.name} className="w-14 h-14 rounded-xl object-cover border border-hairline-border" />
                <div className="flex-1">
                  <h3 className="font-bold text-on-surface">{pet.name}</h3>
                  <p className="text-xs text-on-surface-variant">{pet.breed} • {pet.weight}</p>
                  <p className="text-xs text-primary font-bold mt-0.5">Tutor: {pet.tutor_name}</p>
                </div>
                <span className="material-symbols-outlined text-primary text-sm">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>
      </main>

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
                <span className="text-on-surface-variant font-bold">WhatsApp Tutor:</span>
                <span className="text-on-surface">{selectedPetDetail.tutor_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Idade / Observações:</span>
                <span className="text-on-surface">{selectedPetDetail.observations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Peso:</span>
                <span className="text-on-surface">{selectedPetDetail.weight}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold">Pelagem & Cor:</span>
                <span className="text-on-surface">{selectedPetDetail.coat} • {selectedPetDetail.color}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              {selectedPetDetail.tutor_phone && selectedPetDetail.tutor_phone !== "Não informado" && (
                <a
                  href={`https://wa.me/55${selectedPetDetail.tutor_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  Contato no WhatsApp
                </a>
              )}
              <button
                onClick={() => setSelectedPetDetail(null)}
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

export default function PetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-on-surface-variant">Carregando pets...</div>}>
      <PetsContent />
    </Suspense>
  );
}
