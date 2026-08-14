"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateAgeFromBirthDate, getYearsMonthsFromBirthDate } from "@/lib/utils/formatters";

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
  birth_date?: string;
  observations?: string;
}

export default function MeusPetsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");

  // Modal state
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State for New Pet Modal
  const [newPetName, setNewPetName] = useState("");
  const [newSpecies, setNewSpecies] = useState("Cachorro");
  const [newBreed, setNewBreed] = useState("");
  const [newSex, setNewSex] = useState("Macho");
  const [newAgeYears, setNewAgeYears] = useState("0");
  const [newAgeMonths, setNewAgeMonths] = useState("0");
  const [newWeight, setNewWeight] = useState("");
  const [newPelagem, setNewPelagem] = useState("Curta");
  const [newColor, setNewColor] = useState("");
  const [newIsCastrated, setNewIsCastrated] = useState(false);
  const [newNotes, setNewNotes] = useState("");
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Edit Pet Modal State
  const [showEditPetModal, setShowEditPetModal] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [editPetName, setEditPetName] = useState("");
  const [editSpecies, setEditSpecies] = useState("Cachorro");
  const [editBreed, setEditBreed] = useState("");
  const [editSex, setEditSex] = useState("Macho");
  const [editAgeYears, setEditAgeYears] = useState("0");
  const [editAgeMonths, setEditAgeMonths] = useState("0");
  const [editWeight, setEditWeight] = useState("");
  const [editPelagem, setEditPelagem] = useState("Curta");
  const [editColor, setEditColor] = useState("");
  const [editIsCastrated, setEditIsCastrated] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);

  // List of Pets State
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add") === "true") {
        setShowAddPetModal(true);
      }
    }

    async function fetchUserPets() {
      try {
        const res = await fetch("/api/pets");
        const resData = await res.json();
        if (resData.pets && resData.pets.length > 0) {
          const mappedPets: Pet[] = resData.pets.map((p: any) => ({
            id: p.id,
            name: p.name,
            species: p.species,
            breed: p.breed || "Vira-lata",
            status: "Em casa",
            statusType: "home",
            photo: p.photo_url || "/assets/img-cadastro-google-cli.png",
            sex: p.sex || "Macho",
            castrated: p.is_neutered ? "Sim" : "Não",
            weight: p.weight !== null && p.weight !== undefined ? String(p.weight) : "Não inf.",
            pelagem: p.coat || "Curta",
            color: p.color || "Caramelo",
            birth_date: p.birth_date,
            age: calculateAgeFromBirthDate(p.birth_date),
            observations: p.observations || "",
          }));
          setPets(mappedPets);
        } else {
          setPets([]);
        }
      } catch (err) {
        console.error("Erro ao buscar pets:", err);
      }
    }
    fetchUserPets();
  }, []);

  const getFormattedAge = (yStr: string, mStr: string) => {
    const y = parseInt(yStr || "0", 10);
    const m = parseInt(mStr || "0", 10);
    if (y === 0 && m === 0) return "Não informada";
    const yText = y > 0 ? `${y} ${y === 1 ? "ano" : "anos"}` : "";
    const mText = m > 0 ? `${m} ${m === 1 ? "mês" : "meses"}` : "";
    if (yText && mText) return `${yText} e ${mText}`;
    return yText || mText;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Envia a foto de verdade para o Supabase Storage e retorna a URL pública.
  // Se não houver arquivo novo selecionado, mantém a foto atual (fallbackUrl).
  const uploadPetPhotoIfNeeded = async (file: File | null, fallbackUrl: string | null): Promise<string | null> => {
    if (!file) return fallbackUrl;
    setIsUploadingPhoto(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return fallbackUrl;

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from("pet-photos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadErr) {
        console.error("Erro ao enviar foto:", uploadErr);
        alert("Não foi possível enviar a foto. O pet será salvo sem foto atualizada.");
        return fallbackUrl;
      }

      const { data: publicUrlData } = supabase.storage.from("pet-photos").getPublicUrl(path);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Erro ao enviar foto:", err);
      return fallbackUrl;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isUploadingPhoto) return;
    if (!newPetName.trim()) {
      alert("Por favor, informe o nome do pet.");
      return;
    }

    setIsLoading(true);

    const defaultPhoto = newSpecies === "Gato"
      ? "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80"
      : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80";

    const formattedAge = getFormattedAge(newAgeYears, newAgeMonths);

    const petPhoto = await uploadPetPhotoIfNeeded(newPhotoFile, null) || defaultPhoto;

    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPetName,
          species: newSpecies,
          breed: newBreed || "Vira-lata",
          sex: newSex,
          weight: newWeight ? parseFloat(newWeight) : null,
          coat: newPelagem,
          color: newColor,
          photo_url: petPhoto,
          age_years: newAgeYears,
          age_months: newAgeMonths,
          observations: newNotes.trim() || null,
        }),
      });

      const resData = await res.json();

      if (!res.ok || resData.error) {
        console.error("Erro ao salvar pet:", resData.error);
        alert("Erro ao cadastrar pet: " + (resData.error || "Erro no servidor"));
        setIsLoading(false);
        return;
      }

      const createdPetObj = resData.pet;
      const createdPet: Pet = {
        id: createdPetObj?.id || Date.now().toString(),
        name: newPetName,
        species: newSpecies,
        breed: newBreed || "Vira-lata",
        status: "Em casa",
        statusType: "home",
        photo: petPhoto,
        sex: newSex,
        castrated: newIsCastrated ? "Sim" : "Não",
        weight: newWeight ? newWeight : "Não inf.",
        pelagem: newPelagem,
        color: newColor || "Padrão",
        age: formattedAge,
        observations: newNotes.trim(),
      };

      setPets([createdPet, ...pets]);

      // Reset Form
      setNewPetName("");
      setNewBreed("");
      setNewAgeYears("0");
      setNewAgeMonths("0");
      setNewWeight("");
      setNewColor("");
      setNewNotes("");
      setNewPhotoPreview(null);
      setNewPhotoFile(null);
      setNewIsCastrated(false);

      setShowAddPetModal(false);
      alert(`🎉 Pet "${newPetName}" cadastrado com sucesso no seu perfil!`);
    } catch (err: any) {
      alert("Erro ao cadastrar pet: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenEditModal = (pet: Pet) => {
    setEditingPetId(pet.id);
    setEditPetName(pet.name);
    setEditSpecies(pet.species);
    setEditBreed(pet.breed === "Vira-lata" ? "" : pet.breed);
    setEditSex(pet.sex);
    
    const { years, months } = getYearsMonthsFromBirthDate(pet.birth_date);
    setEditAgeYears(years);
    setEditAgeMonths(months);

    setEditWeight(pet.weight === "Não inf." ? "" : pet.weight);
    setEditPelagem(pet.pelagem);
    setEditColor(pet.color === "Caramelo" ? "" : pet.color);
    setEditIsCastrated(pet.castrated === "Sim");
    setEditNotes(pet.observations || "");
    setEditPhotoPreview(pet.photo);
    setEditPhotoFile(null);
    setShowEditPetModal(true);
  };

  const handleUpdatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPetId || !editPetName.trim()) {
      alert("Por favor, informe o nome do pet.");
      return;
    }

    const formattedAge = getFormattedAge(editAgeYears, editAgeMonths);
    setIsLoading(true);

    const petPhoto = await uploadPetPhotoIfNeeded(editPhotoFile, editPhotoPreview);

    try {
      const res = await fetch(`/api/pets/${editingPetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editPetName,
          species: editSpecies,
          breed: editBreed || "Vira-lata",
          sex: editSex,
          weight: editWeight ? parseFloat(editWeight) : null,
          coat: editPelagem,
          color: editColor || "Caramelo",
          photo_url: petPhoto,
          age_years: editAgeYears,
          age_months: editAgeMonths,
          observations: editNotes.trim() || null,
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        alert("Erro ao atualizar pet: " + (resData.error || "Erro no servidor"));
        setIsLoading(false);
        return;
      }

      setPets((prevPets) =>
        prevPets.map((p) =>
          p.id === editingPetId
            ? {
                ...p,
                name: editPetName,
                species: editSpecies,
                breed: editBreed || "Vira-lata",
                sex: editSex,
                weight: editWeight ? editWeight : "Não inf.",
                pelagem: editPelagem,
                color: editColor || "Caramelo",
                photo: petPhoto || p.photo,
                castrated: editIsCastrated ? "Sim" : "Não",
                age: formattedAge,
                observations: editNotes.trim(),
              }
            : p
        )
      );

      setShowEditPetModal(false);
      setEditingPetId(null);
      alert(`🎉 As informações do pet "${editPetName}" foram atualizadas!`);
    } catch (err: any) {
      alert("Erro ao atualizar pet: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePet = async (petId: string, petName: string) => {
    if (!confirm(`Tem certeza de que deseja remover o pet "${petName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/pets/${petId}`, {
        method: "DELETE",
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        alert("Erro ao remover pet: " + (resData.error || "Erro no servidor"));
        setIsLoading(false);
        return;
      }

      setPets((prevPets) => prevPets.filter((p) => p.id !== petId));
      alert(`🗑️ Pet "${petName}" removido com sucesso.`);
    } catch (err: any) {
      alert("Erro ao remover pet: " + err.message);
    } finally {
      setIsLoading(false);
    }
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
    <div className="w-full">

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

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${pet.statusType === "active"
                          ? "bg-primary/20 text-primary border-primary/30"
                          : pet.statusType === "finished"
                            ? "bg-tertiary-container/20 text-tertiary border-tertiary-container/30"
                            : "bg-surface-container-highest text-on-surface-variant border-outline-variant"
                        }`}
                    >
                      {pet.status}
                    </span>
                    <button
                      onClick={() => handleOpenEditModal(pet)}
                      title="Editar pet"
                      className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePet(pet.id, pet.name)}
                      title="Remover pet"
                      className="p-1.5 text-on-surface-variant hover:text-red-400 hover:bg-surface-container rounded-lg transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
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
                      {pet.weight === "Não inf." ? "Não inf." : `${pet.weight} kg`}
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
                    href="/client/agenda"
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

      {/* Modal: Adicionar Novo Pet (Refatorado & Otimizado para Mobile) */}
      {showAddPetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-elevated-card border border-hairline-border rounded-3xl max-w-lg w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl extruded-shadow mb-16 sm:mb-0 animate-in zoom-in-95 duration-200">
            {/* Header Fixo */}
            <div className="p-4 sm:p-5 bg-surface-container border-b border-hairline-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">pets</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Adicionar Novo Pet</h3>
                  <p className="text-xs text-on-surface-variant">Preencha os dados do seu companheiro</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddPetModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Formulário Rolável Interno */}
            <form onSubmit={handleCreatePet} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* Photo Upload Preview */}
                <div className="flex flex-col items-center gap-2 pt-1">
                  <input
                    type="file"
                    id="modal-pet-photo"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="modal-pet-photo"
                    className="relative w-20 h-20 rounded-full bg-surface-container border-2 border-dashed border-hairline-border flex items-center justify-center cursor-pointer group hover:border-primary transition-all"
                  >
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                      {newPhotoPreview ? (
                        <img src={newPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-outline-variant text-3xl group-hover:text-primary transition-colors">
                          photo_camera
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 z-20 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-elevated-card text-on-primary text-xs font-bold shadow-md">
                      +
                    </div>
                  </label>
                  <span className="text-[11px] font-bold text-on-surface-variant">Foto do Pet</span>
                </div>

                {/* Pet Name */}
                <div className="space-y-1">
                  <label htmlFor="modal_pet_name" className="text-xs font-bold text-on-surface">Nome do Pet *</label>
                  <input
                    id="modal_pet_name"
                    type="text"
                    required
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    placeholder="Ex: Bob, Nina, Tobey..."
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-3 text-on-surface text-sm placeholder:text-outline outline-none focus:border-primary font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Species */}
                  <div className="space-y-1">
                    <label htmlFor="modal_species" className="text-xs font-bold text-on-surface">Espécie *</label>
                    <select
                      id="modal_species"
                      value={newSpecies}
                      onChange={(e) => setNewSpecies(e.target.value)}
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-3 text-on-surface text-sm outline-none cursor-pointer font-medium"
                    >
                      <option value="Cachorro">Cachorro 🐶</option>
                      <option value="Gato">Gato 🐱</option>
                      <option value="Ave">Ave 🦜</option>
                      <option value="Outro">Outro 🐾</option>
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
                      placeholder="Ex: Poodle, SRD"
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-3 text-on-surface text-sm placeholder:text-outline outline-none focus:border-primary font-medium"
                    />
                  </div>
                </div>

                {/* Sex Toggle */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Sexo</label>
                  <div className="flex bg-surface-container p-1 rounded-xl border border-hairline-border">
                    <button
                      type="button"
                      onClick={() => setNewSex("Macho")}
                      className={`flex-1 text-center py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        newSex === "Macho"
                          ? "bg-primary text-on-primary"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Macho ♂️
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSex("Fêmea")}
                      className={`flex-1 text-center py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        newSex === "Fêmea"
                          ? "bg-primary text-on-primary"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Fêmea ♀️
                    </button>
                  </div>
                </div>

                {/* Age: Anos e Meses */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Idade Aproximada</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-0.5">Anos</label>
                      <select
                        value={newAgeYears}
                        onChange={(e) => setNewAgeYears(e.target.value)}
                        className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm outline-none cursor-pointer font-medium"
                      >
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i} value={i}>{i} {i === 1 ? "ano" : "anos"}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-0.5">Meses</label>
                      <select
                        value={newAgeMonths}
                        onChange={(e) => setNewAgeMonths(e.target.value)}
                        className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm outline-none cursor-pointer font-medium"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>{i} {i === 1 ? "mês" : "meses"}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-3 text-on-surface text-sm placeholder:text-outline outline-none font-medium"
                    />
                  </div>

                  {/* Pelagem */}
                  <div className="space-y-1">
                    <label htmlFor="modal_pelagem" className="text-xs font-bold text-on-surface">Pelagem</label>
                    <select
                      id="modal_pelagem"
                      value={newPelagem}
                      onChange={(e) => setNewPelagem(e.target.value)}
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-3 text-on-surface text-sm outline-none cursor-pointer font-medium"
                    >
                      <option value="Curta">Curta</option>
                      <option value="Média">Média</option>
                      <option value="Longa">Longa</option>
                    </select>
                  </div>
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
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-3 text-on-surface text-sm placeholder:text-outline outline-none font-medium"
                  />
                </div>

                {/* Castrated Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="modal_castrated"
                    type="checkbox"
                    checked={newIsCastrated}
                    onChange={(e) => setNewIsCastrated(e.target.checked)}
                    className="rounded bg-surface-container border-hairline-border text-primary cursor-pointer w-4 h-4"
                  />
                  <label htmlFor="modal_castrated" className="text-xs text-on-surface font-bold cursor-pointer">
                    Meu pet é castrado
                  </label>
                </div>

                {/* Special Notes */}
                <div className="space-y-1">
                  <label htmlFor="modal_notes" className="text-xs font-bold text-on-surface">Observações de Saúde</label>
                  <textarea
                    id="modal_notes"
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Alergias ou comportamentos..."
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm placeholder:text-outline resize-none outline-none font-medium"
                  />
                </div>
              </div>

              {/* Rodapé Fixo com Botões Visíveis Acima da Bottom Navigation Bar */}
              <div className="p-4 bg-surface-container border-t border-hairline-border flex items-center gap-3 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setShowAddPetModal(false)}
                  className="flex-1 bg-surface-container-high border border-hairline-border text-on-surface font-bold text-xs py-3 rounded-xl hover:bg-surface-container-highest transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isUploadingPhoto}
                  className="flex-1 bg-primary text-on-primary font-bold text-xs py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading || isUploadingPhoto ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">sync</span>
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Salvar Pet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PET MODAL (Refatorado & Otimizado para Mobile) */}
      {showEditPetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-elevated-card border border-hairline-border rounded-3xl max-w-lg w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl extruded-shadow mb-16 sm:mb-0 animate-in zoom-in-95 duration-200">
            {/* Header Fixo */}
            <div className="p-4 sm:p-5 bg-surface-container border-b border-hairline-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">edit</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Editar Pet</h3>
                  <p className="text-xs text-on-surface-variant">Atualize as informações do seu pet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPetModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdatePet} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Photo Upload Preview */}
              <div className="flex items-center gap-4 bg-surface-container p-3 rounded-xl border border-hairline-border">
                <img
                  src={editPhotoPreview || "/assets/img-cadastro-google-cli.png"}
                  alt="Preview"
                  className="w-14 h-14 rounded-xl object-cover border border-primary/30"
                />
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Foto do Pet</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditPhotoUpload}
                    className="text-xs text-on-surface-variant file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary file:text-on-primary hover:file:brightness-110 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Pet Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Nome do Pet *</label>
                  <input
                    type="text"
                    required
                    value={editPetName}
                    onChange={(e) => setEditPetName(e.target.value)}
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm outline-none"
                  />
                </div>

                {/* Species */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Espécie</label>
                  <select
                    value={editSpecies}
                    onChange={(e) => setEditSpecies(e.target.value)}
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
                  <label className="text-xs font-bold text-on-surface">Raça</label>
                  <input
                    type="text"
                    value={editBreed}
                    onChange={(e) => setEditBreed(e.target.value)}
                    placeholder="Ex: Pincher, Poodle..."
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm outline-none"
                  />
                </div>

                {/* Sex */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Sexo</label>
                  <select
                    value={editSex}
                    onChange={(e) => setEditSex(e.target.value)}
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm outline-none cursor-pointer"
                  >
                    <option value="Macho">Macho</option>
                    <option value="Fêmea">Fêmea</option>
                  </select>
                </div>

                {/* Age: Anos e Meses */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-on-surface">Idade Aproximada</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-0.5">Anos</label>
                      <select
                        value={editAgeYears}
                        onChange={(e) => setEditAgeYears(e.target.value)}
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
                        value={editAgeMonths}
                        onChange={(e) => setEditAgeMonths(e.target.value)}
                        className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2 text-on-surface text-sm outline-none cursor-pointer"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>{i} {i === 1 ? "mês" : "meses"}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Weight */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Peso</label>
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-0.5">Quilogramas (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      placeholder="Ex: 4.5"
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2 text-on-surface text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Pelagem */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Pelagem</label>
                  <select
                    value={editPelagem}
                    onChange={(e) => setEditPelagem(e.target.value)}
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm outline-none cursor-pointer"
                  >
                    <option value="Curta">Curta</option>
                    <option value="Média">Média</option>
                    <option value="Longa">Longa</option>
                  </select>
                </div>

                {/* Color */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Cor</label>
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    placeholder="Ex: Preto e Caramelo"
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm outline-none"
                  />
                </div>

                {/* Castrated Checkbox */}
                <div className="md:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    id="edit_castrated"
                    type="checkbox"
                    checked={editIsCastrated}
                    onChange={(e) => setEditIsCastrated(e.target.checked)}
                    className="rounded bg-surface-container border-hairline-border text-primary cursor-pointer"
                  />
                  <label htmlFor="edit_castrated" className="text-xs text-on-surface cursor-pointer">
                    Meu pet é castrado
                  </label>
                </div>
              </div>

              </div>

              {/* Rodapé Fixo com Botões Visíveis Acima da Bottom Navigation Bar */}
              <div className="p-4 bg-surface-container border-t border-hairline-border flex items-center gap-3 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setShowEditPetModal(false)}
                  className="flex-1 bg-surface-container-high border border-hairline-border text-on-surface font-bold text-xs py-3 rounded-xl hover:bg-surface-container-highest transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary text-on-primary font-bold text-xs py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>{isLoading ? "Salvando..." : "Atualizar Pet"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
