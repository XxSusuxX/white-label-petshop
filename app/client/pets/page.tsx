"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  status: string;
  statusType: "active" | "home" | "finished";
  photo: string;
  sex: string;
  castrated: string;
  weight: string;
  pelagem: string;
  color: string;
  age: string;
}

export default function MeusPetsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");

  // Modal state
  const [showAddPetModal, setShowAddPetModal] = useState(false);

  // Form State for New Pet Modal
  const [newPetName, setNewPetName] = useState("");
  const [newSpecies, setNewSpecies] = useState("Cachorro");
  const [newBreed, setNewBreed] = useState("");
  const [newSex, setNewSex] = useState("Macho");
  const [newAge, setNewAge] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newPelagem, setNewPelagem] = useState("Curta");
  const [newColor, setNewColor] = useState("");
  const [newIsCastrated, setNewIsCastrated] = useState(false);
  const [newNotes, setNewNotes] = useState("");
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);

  // List of Pets State
  const [pets, setPets] = useState<Pet[]>([
    {
      id: "1",
      name: "Thor",
      species: "Cachorro",
      breed: "Golden Retriever",
      status: "Em banho",
      statusType: "active",
      photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80",
      sex: "Macho",
      castrated: "Sim",
      weight: "32",
      pelagem: "Longa",
      color: "Dourado",
      age: "3 Anos",
    },
    {
      id: "2",
      name: "Luna",
      species: "Gato",
      breed: "Siamese Cat",
      status: "Em casa",
      statusType: "home",
      photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80",
      sex: "Fêmea",
      castrated: "Sim",
      weight: "4.2",
      pelagem: "Curta",
      color: "Creme",
      age: "2 Anos",
    },
    {
      id: "3",
      name: "Max",
      species: "Cachorro",
      breed: "French Bulldog",
      status: "Finalizado",
      statusType: "finished",
      photo: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300&q=80",
      sex: "Macho",
      castrated: "Não",
      weight: "11",
      pelagem: "Curta",
      color: "Malhado",
      age: "4 Anos",
    },
  ]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCreatePet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim()) {
      alert("Por favor, informe o nome do pet.");
      return;
    }

    const defaultPhoto = newSpecies === "Gato"
      ? "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80"
      : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80";

    const createdPet: Pet = {
      id: Date.now().toString(),
      name: newPetName,
      species: newSpecies,
      breed: newBreed || "SRD (Sem Raça Definida)",
      status: "Em casa",
      statusType: "home",
      photo: newPhotoPreview || defaultPhoto,
      sex: newSex,
      castrated: newIsCastrated ? "Sim" : "Não",
      weight: newWeight || "0",
      pelagem: newPelagem,
      color: newColor || "Padrão",
      age: newAge || "Filhote",
    };

    setPets([createdPet, ...pets]);

    // Reset Form
    setNewPetName("");
    setNewBreed("");
    setNewAge("");
    setNewWeight("");
    setNewColor("");
    setNewNotes("");
    setNewPhotoPreview(null);
    setNewIsCastrated(false);

    // Close Modal
    setShowAddPetModal(false);
    alert(`🎉 Pet "${createdPet.name}" cadastrado com sucesso!`);
  };

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.species.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeFilter === "todos") return matchesSearch;
    if (activeFilter === "em_atendimento") return matchesSearch && pet.statusType === "active";
    if (activeFilter === "em_casa") return matchesSearch && pet.statusType === "home";
    return matchesSearch;
  });

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center px-4 md:px-margin-desktop w-full h-16 sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-outline-variant">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-sm">pets</span>
            </div>
            <span className="font-bold text-primary text-lg">SaaS Portal</span>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                className="w-full bg-surface-container px-10 py-2 rounded-full border border-outline-variant focus:outline-none focus:border-primary transition-colors text-body-base font-body-base text-on-surface placeholder:text-outline"
                placeholder="Buscar pets, raça ou status..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Notificações: Seu pet Thor está em atendimento!")}
              className="relative p-2 text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded-full active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full pulse-node"></span>
            </button>
            <button
              onClick={() => setShowAddPetModal(true)}
              className="p-2 text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded-full active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="h-8 w-px bg-outline-variant mx-1 hidden sm:block"></div>
            <div className="relative group cursor-pointer">
              <div className="flex items-center gap-2.5 p-1 pr-3 hover:bg-surface-container-high rounded-full transition-all">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  A
                </div>
                <span className="font-label-bold text-label-bold text-on-surface hidden lg:block">
                  Ana Paula
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-sm">
                  expand_more
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <div className="px-4 md:px-margin-desktop py-6 md:py-stack-lg max-w-7xl w-full mx-auto space-y-6">
          {/* Mobile Search Bar */}
          <div className="md:hidden relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full bg-surface-container px-10 py-2.5 rounded-full border border-outline-variant focus:outline-none focus:border-primary transition-colors text-body-base text-on-surface placeholder:text-outline"
              placeholder="Buscar pets, raça ou status..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Page Header Title & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-headline-lg text-2xl md:text-headline-lg text-on-surface font-bold">
                Meus Pets
              </h2>
              <p className="text-on-surface-variant font-body-base text-sm md:text-body-base">
                Gerencie e acompanhe a saúde e os serviços dos seus pets.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex bg-surface-container p-1 rounded-lg border border-outline-variant">
                <button
                  onClick={() => setActiveFilter("todos")}
                  className={`px-3 py-1.5 rounded font-label-bold text-xs transition-all cursor-pointer ${activeFilter === "todos"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                    }`}
                >
                  Todos ({pets.length})
                </button>
                <button
                  onClick={() => setActiveFilter("em_atendimento")}
                  className={`px-3 py-1.5 rounded font-label-bold text-xs transition-all cursor-pointer ${activeFilter === "em_atendimento"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                    }`}
                >
                  Em Atendimento
                </button>
              </div>

              <button
                onClick={() => setShowAddPetModal(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-label-bold text-sm extruded-shadow emerald-glow-active active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span>Adicionar Novo Pet</span>
              </button>
            </div>
          </div>

          {/* Pets Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map((pet) => (
              <div
                key={pet.id}
                className="bg-elevated-card border border-hairline-border rounded-xl p-5 hover:border-primary/40 transition-all group flex flex-col h-full extruded-shadow"
              >
                {/* Pet Card Header */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex gap-4">
                    <div className="relative">
                      <img
                        className="w-16 h-16 rounded-xl object-cover border-2 border-primary/20"
                        alt={pet.name}
                        src={pet.photo}
                      />
                      {pet.statusType === "active" && (
                        <div className="absolute -bottom-1 -right-1 bg-surface-container rounded-full p-0.5">
                          <div className="w-3.5 h-3.5 bg-primary rounded-full pulse-node shadow-[0_0_8px_rgba(78,222,163,0.8)]"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-headline-md text-xl font-bold text-on-surface">{pet.name}</h3>
                      <p className="text-on-surface-variant text-xs font-label-bold">
                        {pet.species} • {pet.breed}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${pet.statusType === "active"
                        ? "bg-primary/20 text-primary border-primary/30"
                        : pet.statusType === "finished"
                          ? "bg-tertiary-container/20 text-tertiary border-tertiary-container/30"
                          : "bg-surface-container-highest text-on-surface-variant border-outline-variant"
                      }`}
                  >
                    {pet.status}
                  </span>
                </div>

                {/* Pet Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">
                      Sexo / Castrado
                    </p>
                    <p className="text-on-surface text-xs font-label-bold">
                      {pet.sex} / {pet.castrated}
                    </p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Peso</p>
                    <p className="text-on-surface font-bold text-lg">
                      {pet.weight}
                      <span className="text-xs font-normal text-on-surface-variant ml-1">kg</span>
                    </p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">
                      Pelagem / Cor
                    </p>
                    <p className="text-on-surface text-xs font-label-bold truncate">
                      {pet.pelagem} / {pet.color}
                    </p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Idade</p>
                    <p className="text-on-surface text-xs font-label-bold">{pet.age}</p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-auto flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => alert(`Visualizando Prontuário de Saúde do ${pet.name}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-surface-container hover:bg-surface-container-highest border border-outline-variant rounded-lg transition-all text-on-surface font-label-bold text-xs active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">health_and_safety</span>
                      <span>Saúde</span>
                    </button>
                    <button
                      onClick={() => router.push("/")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-surface-container hover:bg-surface-container-highest border border-outline-variant rounded-lg transition-all text-on-surface font-label-bold text-xs active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">history</span>
                      <span>Histórico</span>
                    </button>
                  </div>

                  <Link
                    href="/auth/social"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-secondary-container text-on-secondary-container rounded-lg hover:brightness-110 transition-all font-label-bold text-xs active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                    <span>Agendar Serviço</span>
                  </Link>
                </div>
              </div>
            ))}

            {/* Dotted Card: Add New Pet Quick Trigger */}
            <button
              onClick={() => setShowAddPetModal(true)}
              className="bg-surface-container/40 border-2 border-dashed border-outline-variant hover:border-primary/60 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all group min-h-[340px] cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-primary mb-3 transition-colors">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <h3 className="font-bold text-on-surface text-base mb-1">Cadastrar Outro Pet</h3>
              <p className="text-xs text-on-surface-variant max-w-xs">
                Adicione cães, gatos ou outros companheiros à sua conta no portal.
              </p>
            </button>
          </div>
        </div>

      {/* Modal: Adicionar Novo Pet */}
      {showAddPetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-xl w-full p-6 md:p-8 extruded-shadow flex flex-col gap-6 relative my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-hairline-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">pets</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Adicionar Novo Pet</h3>
                  <p className="text-xs text-on-surface-variant">Preencha os dados do seu companheiro</p>
                </div>
              </div>

              <button
                onClick={() => setShowAddPetModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePet} className="space-y-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-2">
                <input
                  type="file"
                  id="modal-pet-photo"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="modal-pet-photo"
                  className="relative w-20 h-20 rounded-full bg-surface-container border-2 border-dashed border-outline-variant flex items-center justify-center cursor-pointer overflow-hidden group hover:border-primary transition-all"
                >
                  {newPhotoPreview ? (
                    <img src={newPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-outline-variant text-3xl group-hover:text-primary transition-colors">
                      photo_camera
                    </span>
                  )}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center border border-elevated-card text-on-primary text-xs font-bold">
                    +
                  </div>
                </label>
                <span className="text-xs font-bold text-on-surface-variant">Foto do Pet</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pet Name */}
                <div className="md:col-span-2 space-y-1">
                  <label htmlFor="modal_pet_name" className="text-xs font-bold text-on-surface">Nome do Pet *</label>
                  <input
                    id="modal_pet_name"
                    type="text"
                    required
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    placeholder="Ex: Bob, Nina, Tobey..."
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm placeholder:text-outline outline-none"
                  />
                </div>

                {/* Species */}
                <div className="space-y-1">
                  <label htmlFor="modal_species" className="text-xs font-bold text-on-surface">Espécie</label>
                  <select
                    id="modal_species"
                    value={newSpecies}
                    onChange={(e) => setNewSpecies(e.target.value)}
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm outline-none cursor-pointer"
                  >
                    <option value="Cachorro">Cachorro</option>
                    <option value="Gato">Gato</option>
                    <option value="Ave">Ave</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {/* Breed */}
                <div className="space-y-1">
                  <label htmlFor="modal_breed" className="text-xs font-bold text-on-surface">Raça</label>
                  <input
                    id="modal_breed"
                    type="text"
                    value={newBreed}
                    onChange={(e) => setNewBreed(e.target.value)}
                    placeholder="Ex: Poodle, Shih Tzu, SRD"
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm placeholder:text-outline outline-none"
                  />
                </div>

                {/* Sex Toggle */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-on-surface">Sexo</label>
                  <div className="flex bg-surface-container p-1 rounded-xl border border-hairline-border">
                    <button
                      type="button"
                      onClick={() => setNewSex("Macho")}
                      className={`flex-1 text-center py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${newSex === "Macho"
                          ? "bg-primary text-on-primary"
                          : "text-on-surface-variant hover:text-on-surface"
                        }`}
                    >
                      Macho
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSex("Fêmea")}
                      className={`flex-1 text-center py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${newSex === "Fêmea"
                          ? "bg-primary text-on-primary"
                          : "text-on-surface-variant hover:text-on-surface"
                        }`}
                    >
                      Fêmea
                    </button>
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-1">
                  <label htmlFor="modal_age" className="text-xs font-bold text-on-surface">Idade (ex: 2 Anos)</label>
                  <input
                    id="modal_age"
                    type="text"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    placeholder="Ex: 1 Ano, 6 Meses"
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm placeholder:text-outline outline-none"
                  />
                </div>

                {/* Weight */}
                <div className="space-y-1">
                  <label htmlFor="modal_weight" className="text-xs font-bold text-on-surface">Peso (kg)</label>
                  <input
                    id="modal_weight"
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="Ex: 8.5"
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm placeholder:text-outline outline-none"
                  />
                </div>

                {/* Pelagem */}
                <div className="space-y-1">
                  <label htmlFor="modal_pelagem" className="text-xs font-bold text-on-surface">Pelagem</label>
                  <select
                    id="modal_pelagem"
                    value={newPelagem}
                    onChange={(e) => setNewPelagem(e.target.value)}
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm outline-none cursor-pointer"
                  >
                    <option value="Curta">Curta</option>
                    <option value="Média">Média</option>
                    <option value="Longa">Longa</option>
                  </select>
                </div>

                {/* Color */}
                <div className="space-y-1">
                  <label htmlFor="modal_color" className="text-xs font-bold text-on-surface">Cor</label>
                  <input
                    id="modal_color"
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="Ex: Preto e Branco"
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm placeholder:text-outline outline-none"
                  />
                </div>

                {/* Castrated Checkbox */}
                <div className="md:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    id="modal_castrated"
                    type="checkbox"
                    checked={newIsCastrated}
                    onChange={(e) => setNewIsCastrated(e.target.checked)}
                    className="rounded bg-surface-container border-hairline-border text-primary cursor-pointer"
                  />
                  <label htmlFor="modal_castrated" className="text-xs text-on-surface cursor-pointer">
                    Meu pet é castrado
                  </label>
                </div>

                {/* Special Notes */}
                <div className="md:col-span-2 space-y-1">
                  <label htmlFor="modal_notes" className="text-xs font-bold text-on-surface">Observações de Saúde</label>
                  <textarea
                    id="modal_notes"
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Alergias ou comportamentos..."
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2 text-on-surface text-sm placeholder:text-outline resize-none outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddPetModal(false)}
                  className="flex-1 bg-surface-container border border-hairline-border text-on-surface font-bold text-sm py-3 rounded-xl hover:bg-surface-variant transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-on-primary font-bold text-sm py-3 rounded-xl extruded-shadow emerald-glow-active hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>Salvar Pet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
