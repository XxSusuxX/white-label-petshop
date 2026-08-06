"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ClientHomePage() {
  const [showLiveCameraModal, setShowLiveCameraModal] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showVaccinesModal, setShowVaccinesModal] = useState(false);

  // User & Real Pets from Supabase
  const [userName, setUserName] = useState("Tutor");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userPets, setUserPets] = useState<any[]>([]);

  // Active Pet State
  const [selectedPetId, setSelectedPetId] = useState("");

  const activePet = userPets.find((p) => p.id === selectedPetId) || userPets[0] || null;
  const activePetPhoto = activePet?.photo_url || (activePet?.species === "Gato" ? "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80" : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80");

  // Form State for New Pet Modal
  const [newPetName, setNewPetName] = useState("");
  const [newSpecies, setNewSpecies] = useState("Cachorro");
  const [newBreed, setNewBreed] = useState("");
  const [newSex, setNewSex] = useState("Macho");
  const [newAge, setNewAge] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadClientDashboard() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Fetch Profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

          const name = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Tutor";
          setUserName(name);

          const avatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
          if (avatar) setUserAvatar(avatar);

          // Fetch Real Pets via API Route segura
          const petsRes = await fetch("/api/pets");
          const petsData = await petsRes.json();

          if (petsData.pets && petsData.pets.length > 0) {
            setUserPets(petsData.pets);
            setSelectedPetId(petsData.pets[0].id);
          }
        }
      } catch (err) {
        console.warn("Aviso ao carregar dashboard do cliente:", err);
      }
    }
    loadClientDashboard();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const [isSavingPet, setIsSavingPet] = useState(false);

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim()) {
      alert("Por favor, informe o nome do pet.");
      return;
    }

    setIsSavingPet(true);
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPetName.trim(),
          species: newSpecies,
          breed: newBreed.trim() || "Vira-lata",
          sex: newSex,
          weight: newWeight || null,
          observations: newNotes || null,
          photo_url: null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Recarregar lista de pets do Supabase
        const petsRes = await fetch("/api/pets");
        const petsData = await petsRes.json();
        if (petsData.pets && petsData.pets.length > 0) {
          setUserPets(petsData.pets);
          setSelectedPetId(data.pet?.id || petsData.pets[0].id);
        }

        setNewPetName("");
        setNewBreed("");
        setNewAge("");
        setNewWeight("");
        setNewNotes("");
        setNewPhotoPreview(null);
        setShowAddPetModal(false);
        alert(`🎉 Pet "${newPetName}" cadastrado com sucesso no sistema!`);
      } else {
        alert(`Erro ao cadastrar pet: ${data.error || "Tente novamente."}`);
      }
    } catch (err) {
      console.error("Erro ao salvar pet:", err);
      alert("Erro de conexão ao cadastrar pet. Verifique sua internet.");
    } finally {
      setIsSavingPet(false);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 📱 MOBILE VIEW (Visible on mobile screens below md: block md:hidden) */}
      {/* ========================================================================= */}
      <div className="block md:hidden min-h-screen pb-32">
        {/* Top Bar (Mobile Only) */}
        <header className="sticky top-0 z-40 h-16 w-full flex justify-between items-center px-4 bg-surface/80 backdrop-blur-md border-b border-hairline-border">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              pets
            </span>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">PetNexus</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Notificações: Seu pet Thor está em atendimento na sala de tosa!")}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-primary/20 flex items-center justify-center">
              {userAvatar ? (
                <img
                  className="w-full h-full object-cover"
                  alt={userName}
                  src={userAvatar}
                />
              ) : (
                <span className="text-primary font-bold text-[10px]">{userName.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Mobile Canvas */}
        <main className="w-full px-4 pt-4 space-y-6">
          {/* Welcome Header */}
          <section className="space-y-1">
            <h2 className="font-headline-lg-mobile text-2xl text-on-surface font-bold">Olá, {userName}! 👋</h2>
            <p className="font-body-base text-sm text-on-surface-variant">
              {userPets.length > 0 ? `O pet ${userPets[0].name} está em ótimas mãos hoje.` : "Seja bem-vindo ao portal do seu pet."}
            </p>
          </section>

          {/* Featured Pet Illustration & Live Status Card */}
          <section className="bg-surface-container rounded-xl p-5 border border-hairline-border extruded-shadow relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-primary/30 p-1">
                  <img
                    src={userPets[0]?.photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80"}
                    alt={userPets[0]?.name || "Pet"}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-headline-md text-xl font-bold text-primary">{userPets[0]?.name || "Seu Pet"}</h3>
                <p className="font-body-base text-xs text-on-surface-variant">{userPets[0]?.breed || userPets[0]?.species || "Sem raça informada"}</p>
                <div className="mt-2 inline-flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-primary/30">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-[10px] font-label-bold text-primary uppercase tracking-wider">Em Andamento</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
              <div className="bg-surface-container-highest p-3.5 rounded-lg border border-hairline-border/40">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Serviço</p>
                <p className="font-label-bold text-xs font-bold text-on-surface">Banho + Tosa Bebê</p>
              </div>
              <div className="bg-surface-container-highest p-3.5 rounded-lg border border-hairline-border/40">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Previsão</p>
                <p className="font-label-bold text-xs font-bold text-on-surface">16:45</p>
              </div>
            </div>
          </section>

          {/* Quick Actions 2 Buttons */}
          <section className="grid grid-cols-2 gap-4">
            <a
              href="https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20informações%20sobre%20o%20pet%20Thor"
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center justify-center p-5 rounded-xl bg-surface-container border border-hairline-border extruded-shadow active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-[#10b981]/20 flex items-center justify-center mb-3 text-[#10b981]">
                <span className="material-symbols-outlined text-2xl">chat</span>
              </div>
              <span className="font-label-bold text-xs font-bold text-on-surface">WhatsApp</span>
            </a>

            <button
              onClick={() => alert("Discando para a Unidade Jardins SP: (11) 3300-4000")}
              className="flex flex-col items-center justify-center p-5 rounded-xl bg-surface-container border border-hairline-border extruded-shadow active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center mb-3 text-secondary">
                <span className="material-symbols-outlined text-2xl">call</span>
              </div>
              <span className="font-label-bold text-xs font-bold text-on-surface">Ligar Unidade</span>
            </button>
          </section>

          {/* Service Progress Card */}
          <section>
            <div className="p-5 rounded-xl bg-elevated-card border border-hairline-border extruded-shadow space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary border border-hairline-border">
                    <span className="material-symbols-outlined">content_cut</span>
                  </div>
                  <div>
                    <h3 className="font-label-bold text-sm font-bold text-on-surface">Banho + Tosa Bebê</h3>
                    <p className="text-xs text-on-surface-variant">Thor • Golden Retriever</p>
                  </div>
                </div>
                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-label-bold text-[10px] px-2.5 py-1 rounded-full uppercase font-bold">
                  Em Tosa
                </span>
              </div>

              <div className="flex justify-between items-end text-xs font-bold pt-1">
                <span className="text-on-surface-variant">Progresso</span>
                <span className="text-primary font-mono">60%</span>
              </div>
              <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden p-0.5 border border-hairline-border">
                <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(78,222,163,0.6)] w-[60%] transition-all duration-700"></div>
              </div>
            </div>
          </section>

          {/* Activity Timeline */}
          <section className="space-y-4">
            <h4 className="font-label-bold text-xs font-bold text-on-surface-variant uppercase tracking-widest">Acompanhamento</h4>
            <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-hairline-border">
              {/* Step 1: Collected (Success) */}
              <div className="relative">
                <div className="absolute -left-[26px] w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-4 ring-background">
                  <span className="material-symbols-outlined text-[12px] text-on-primary font-bold">check</span>
                </div>
                <div>
                  <div className="flex justify-between items-start">
                    <h5 className="font-label-bold text-xs font-bold text-primary">Coletado</h5>
                    <span className="text-[11px] text-on-surface-variant font-mono">14:15</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Check-in realizado na recepção.</p>
                </div>
              </div>

              {/* Step 2: Bath (Success) */}
              <div className="relative">
                <div className="absolute -left-[26px] w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-4 ring-background">
                  <span className="material-symbols-outlined text-[12px] text-on-primary font-bold">check</span>
                </div>
                <div>
                  <div className="flex justify-between items-start">
                    <h5 className="font-label-bold text-xs font-bold text-primary">Banho Finalizado</h5>
                    <span className="text-[11px] text-on-surface-variant font-mono">14:45</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Shampoo Hipoalergênico e secagem completa.</p>
                </div>
              </div>

              {/* Step 3: Grooming (Active) */}
              <div className="relative">
                <div className="absolute -left-[26px] w-5 h-5 rounded-full bg-amber-500 animate-pulse ring-4 ring-background shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
                <div>
                  <div className="flex justify-between items-start">
                    <h5 className="font-label-bold text-xs font-bold text-amber-400">Em Tosa Bebê</h5>
                    <span className="text-[11px] text-on-surface-variant font-mono">Iniciado 15:30</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Ajuste de acabamento por Ricardo M.</p>
                </div>
              </div>

              {/* Step 4: Finalized (Pending) */}
              <div className="relative opacity-40">
                <div className="absolute -left-[26px] w-5 h-5 rounded-full bg-surface-variant ring-4 ring-background border border-hairline-border"></div>
                <div>
                  <div className="flex justify-between items-start">
                    <h5 className="font-label-bold text-xs font-bold text-on-surface-variant">Inspeção Final</h5>
                  </div>
                  <p className="text-xs text-on-surface-variant">Pronto para conferência final.</p>
                </div>
              </div>

              {/* Step 5: Delivery (Pending) */}
              <div className="relative opacity-40">
                <div className="absolute -left-[26px] w-5 h-5 rounded-full bg-surface-variant ring-4 ring-background border border-hairline-border"></div>
                <div>
                  <div className="flex justify-between items-start">
                    <h5 className="font-label-bold text-xs font-bold text-on-surface-variant">Saindo para Entrega</h5>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Bottom Floating Live Camera Button Container (Mobile Only) */}
        <div className="fixed bottom-20 left-0 w-full px-4 z-40">
          <button
            onClick={() => setShowLiveCameraModal(true)}
            className="w-full bg-primary text-on-primary font-bold text-sm h-12 rounded-xl flex items-center justify-center gap-3 extruded-shadow active:scale-[0.98] transition-transform cursor-pointer shadow-[0_0_15px_rgba(78,222,163,0.4)]"
          >
            <span className="material-symbols-outlined text-xl">videocam</span>
            <span>Ver Câmera ao Vivo</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🖥️ DESKTOP VIEW (Visible on md screens and above: hidden md:block) */}
      {/* ========================================================================= */}
      <div className="hidden md:block">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-matte-canvas/90 backdrop-blur-md border-b border-hairline-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Portal do Cliente</span>
            <span>/</span>
            <span className="text-on-surface font-bold">Status do Atendimento em Tempo Real</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/agendar"
              className="px-4 py-2 bg-surface-container-high border border-hairline-border text-on-surface font-bold text-xs rounded-xl hover:bg-surface-variant transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>
              Agendar Serviço
            </Link>
            <Link
              href="/client/pets?add=true"
              className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl extruded-shadow hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Cadastrar Pet
            </Link>
          </div>
        </header>

        {/* Page Main Content Workspace */}
        <main className="flex-1 p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Welcome Banner with Stats Pills */}
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-6 extruded-shadow flex flex-col gap-5">
            <div className="flex flex-row items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20 mb-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Login Efetuado • Unidade Jardins SP
                </div>
                <h1 className="text-3xl font-extrabold text-on-surface flex items-center gap-2">
                  Bem-vindo(a) de volta, {userName}! <span className="inline-block animate-bounce">👋</span>
                </h1>
                <p className="text-base text-on-surface-variant mt-1">
                  Seu pet <strong className="text-on-surface font-bold">{userPets[0]?.name || "Thor"}</strong> está cadastrado com sucesso. Acompanhe a transmissão ao vivo ou fale com a recepção.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20informações%20sobre%20o%20pet%20Thor"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 bg-[#10b981] hover:bg-[#059669] text-on-primary font-bold text-sm rounded-xl extruded-shadow transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">chat</span>
                  WhatsApp Unidade
                </a>
                <button
                  onClick={() => alert("Discando para a Unidade Jardins SP: (11) 3300-4000")}
                  className="px-5 py-3 bg-surface-container-high border border-hairline-border hover:bg-surface-variant text-on-surface font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">call</span>
                  Ligar para Recepção
                </button>
              </div>
            </div>

            {/* Stats Badges */}
            <div className="grid grid-cols-4 gap-3 pt-2 border-t border-hairline-border/50">
              <div className="bg-elevated-card p-3 rounded-xl border border-hairline-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">pets</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase">Meus Pets</span>
                  <span className="text-sm font-bold text-on-surface">1 Cadastrado (Thor)</span>
                </div>
              </div>

              <div className="bg-elevated-card p-3 rounded-xl border border-hairline-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">repeat</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase">Pacote Mensal</span>
                  <span className="text-sm font-bold text-amber-400">3 de 4 banhos restantes</span>
                </div>
              </div>

              <div className="bg-elevated-card p-3 rounded-xl border border-hairline-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">vaccines</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase">Vacinas</span>
                  <span className="text-sm font-bold text-emerald-400">V10 & Antirrábica OK</span>
                </div>
              </div>

              <div className="bg-elevated-card p-3 rounded-xl border border-hairline-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">card_membership</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase">Cupom Ativo</span>
                  <span className="text-sm font-bold text-blue-400">10% OFF Desbloqueado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid: Left Live Status + Right Timeline */}
          {userPets.length === 0 ? (
            <div className="bg-elevated-card border border-hairline-border rounded-2xl p-10 text-center space-y-4 extruded-shadow">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">pets</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Nenhum Pet Cadastrado</h3>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                Você ainda não possui pets vinculados à sua conta. Cadastre seu companheiro para acompanhar banhos, tosas e vacinas em tempo real!
              </p>
              <Link
                href="/client/pets?add=true"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-on-primary font-bold text-sm rounded-xl extruded-shadow hover:brightness-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Cadastrar Meu Primeiro Pet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column: Pet Live Status Card */}
              <div className="col-span-2 space-y-6">
                {/* Pet Selector Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {userPets.map((pet) => {
                    const isSelected = (selectedPetId && selectedPetId === pet.id) || (!selectedPetId && userPets[0]?.id === pet.id);
                    return (
                      <button
                        key={pet.id}
                        onClick={() => setSelectedPetId(pet.id)}
                        className={`px-4 py-2.5 rounded-xl font-label-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-on-primary shadow-[0_0_12px_rgba(78,222,163,0.4)]"
                            : "bg-surface-container border border-hairline-border text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">pets</span>
                        {pet.name} ({pet.breed || pet.species})
                      </button>
                    );
                  })}
                  <Link
                    href="/client/pets?add=true"
                    className="px-4 py-2.5 rounded-xl font-label-bold text-xs bg-surface-container border border-dashed border-hairline-border text-on-surface-variant hover:text-primary hover:border-primary transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Adicionar Pet
                  </Link>
                </div>

                {/* Main Service Progress Card */}
                <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 extruded-shadow space-y-6">
                  {/* Pet Info & Status Badge */}
                  <div className="flex items-center justify-between gap-4 border-b border-hairline-border/40 pb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 relative flex-shrink-0 shadow-lg">
                        <img
                          src={activePetPhoto}
                          alt={activePet?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-on-surface">{activePet?.name}</h2>
                        <p className="text-sm text-on-surface-variant">
                          {activePet?.breed ? `${activePet.breed} (${activePet.species})` : activePet?.species} • {activePet?.observations || "Sem observações"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        EM TOSA • ETAPA 3 DE 5
                      </span>
                      <span className="text-xs text-on-surface-variant mt-1.5">Término previsto: 16:45</span>
                    </div>
                  </div>

                  {/* Service Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-on-surface-variant uppercase tracking-wider">Progresso do Serviço</span>
                      <span className="text-primary font-mono text-sm">60% Concluído (Etapa 3 / 5)</span>
                    </div>
                    <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden p-0.5 border border-hairline-border">
                      <div className="h-full bg-primary rounded-full w-[60%] shadow-[0_0_12px_rgba(78,222,163,0.6)] transition-all duration-700"></div>
                    </div>
                  </div>

                  {/* 4 Stat Boxes Grid */}
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    <div className="bg-surface-container-lowest border border-hairline-border p-4 rounded-xl space-y-1">
                      <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">ESPÉCIE</span>
                      <span className="text-sm font-bold text-on-surface block truncate">{activePet?.species}</span>
                    </div>

                    <div className="bg-surface-container-lowest border border-hairline-border p-4 rounded-xl space-y-1">
                      <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">SEXO</span>
                      <span className="text-sm font-bold text-on-surface block truncate">{activePet?.sex || "Macho"}</span>
                    </div>

                    <div className="bg-surface-container-lowest border border-hairline-border p-4 rounded-xl space-y-1">
                      <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">PESO</span>
                      <span className="text-sm font-bold text-on-surface block truncate">
                        {activePet?.weight ? `${activePet.weight} kg` : "Não inf."}
                      </span>
                    </div>

                    <div className="bg-surface-container-lowest border border-hairline-border p-4 rounded-xl space-y-1">
                      <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">SAÚDE</span>
                      <span className="text-sm font-bold text-primary flex items-center gap-1 block truncate">
                        <span>💚</span> Excelente
                      </span>
                    </div>
                  </div>

                  {/* Live Camera CTA Button */}
                  <button
                    onClick={() => setShowLiveCameraModal(true)}
                    className="w-full py-4 bg-surface-container-high border border-primary/40 text-primary font-bold text-sm rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2 extruded-shadow cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">videocam</span>
                    <span>Assistir Câmera ao Vivo da Sala de Tosa (Câmera 02)</span>
                  </button>
                </div>

                {/* Bento Grid Tutor Options */}
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/agendar"
                  className="bg-surface-container border border-hairline-border p-5 rounded-2xl hover:border-primary/40 transition-all flex items-center justify-between gap-4 group extruded-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">calendar_month</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface text-body-sm">Agendar Novo Banho</h3>
                      <p className="text-xs text-on-surface-variant">Escolha data e horário em segundos</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">arrow_forward</span>
                </Link>

                <button
                  onClick={() => setShowVaccinesModal(true)}
                  className="bg-surface-container border border-hairline-border p-5 rounded-2xl hover:border-primary/40 transition-all flex items-center justify-between gap-4 group extruded-shadow text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">vaccines</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface text-body-sm">Carteira de Vacinas</h3>
                      <p className="text-xs text-on-surface-variant">V10 e Antirrábica em dia</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-emerald-400 transition-colors">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Right Column: Real-Time Timeline Card */}
            <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 extruded-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-hairline-border/40 pb-4">
                  <h3 className="text-xl font-bold text-on-surface">Timeline do Banho</h3>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                    Ao Vivo
                  </span>
                </div>

                {/* Steps List */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-hairline-border">
                  {/* Step 1 - Coletado (Completed) */}
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-[0_0_10px_rgba(78,222,163,0.4)]">
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Coletado & Check-in</h4>
                      <p className="text-xs text-on-surface-variant">Realizado às 14:15</p>
                    </div>
                    <span className="px-2 py-0.5 bg-surface-container border border-hairline-border text-primary font-mono text-[10px] rounded font-bold">OK</span>
                  </div>

                  {/* Step 2 - Banho Finalizado (Completed) */}
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-[0_0_10px_rgba(78,222,163,0.4)]">
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Banho & Hidratação</h4>
                      <p className="text-xs text-on-surface-variant">Shampoo Hipoalergênico às 14:45</p>
                    </div>
                    <span className="px-2 py-0.5 bg-surface-container border border-hairline-border text-primary font-mono text-[10px] rounded font-bold">OK</span>
                  </div>

                  {/* Step 3 - Em Tosa (Active Current) */}
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse">
                      <span className="material-symbols-outlined text-sm font-bold">content_cut</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-400">Em Tosa Bebê</h4>
                      <p className="text-xs text-on-surface-variant">Iniciado às 15:30 por Ricardo M.</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-[10px] rounded font-bold">ATUAL</span>
                  </div>

                  {/* Step 4 - Finalizado (Pending) */}
                  <div className="relative flex items-start justify-between gap-3 opacity-50">
                    <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-surface-container border border-hairline-border flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-sm">fact_check</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Inspeção Final & Perfumaria</h4>
                      <p className="text-xs text-on-surface-variant">Previsão 16:30</p>
                    </div>
                  </div>

                  {/* Step 5 - Saindo para entrega (Pending) */}
                  <div className="relative flex items-start justify-between gap-3 opacity-50">
                    <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-surface-container border border-hairline-border flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-sm">local_shipping</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Pronto para Busca / Leva e Traz</h4>
                      <p className="text-xs text-on-surface-variant">Previsão 16:45</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowLiveCameraModal(true)}
                className="w-full py-3.5 bg-surface-container border border-primary/40 text-primary font-bold text-sm rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2 extruded-shadow cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">videocam</span>
                <span>Abrir Câmera ao Vivo</span>
              </button>
            </div>
          </div>
        )}
        </main>

        <footer className="py-6 px-6 bg-matte-canvas border-t border-hairline-border text-center text-xs text-outline mt-auto">
          © 2026 PetNexus. Todos os direitos reservados.
        </footer>
      </div>

      {/* Live Camera Modal */}
      {showLiveCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-primary/30 rounded-3xl p-6 max-w-2xl w-full text-center extruded-shadow flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hairline-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <h3 className="text-lg font-bold text-on-surface">Transmissão ao Vivo - Sala de Tosa</h3>
              </div>
              <button
                onClick={() => setShowLiveCameraModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-hairline-border flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80"
                alt="Câmera ao vivo grooming"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute top-4 left-4 bg-red-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                AO VIVO • CÂMERA 02 (SALA DE TOSA)
              </div>
              <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-on-surface text-xs px-3 py-1.5 rounded-lg border border-hairline-border">
                Thor • Tosa Bebê por Ricardo M. em andamento
              </div>
            </div>

            <button
              onClick={() => setShowLiveCameraModal(false)}
              className="w-full bg-surface-container border border-hairline-border text-on-surface font-bold py-3 rounded-xl hover:bg-surface-variant transition-all mt-1 cursor-pointer"
            >
              Fechar Câmera
            </button>
          </div>
        </div>
      )}

      {/* Vaccines Modal */}
      {showVaccinesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-md w-full p-6 extruded-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-hairline-border pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">vaccines</span>
                <h3 className="text-lg font-bold text-on-surface">Carteira de Vacinas de Thor</h3>
              </div>
              <button onClick={() => setShowVaccinesModal(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-surface-container rounded-xl border border-hairline-border flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-body-sm text-on-surface">Vacina V10 Múltipla</h4>
                  <span className="text-caption text-on-surface-variant">Aplicada: 28/07/2026</span>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  Próxima: 28/07/2027
                </span>
              </div>

              <div className="p-3 bg-surface-container rounded-xl border border-hairline-border flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-body-sm text-on-surface">Antirrábica Imunológica</h4>
                  <span className="text-caption text-on-surface-variant">Aplicada: 10/01/2026</span>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  Próxima: 10/01/2027
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowVaccinesModal(false)}
              className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:brightness-110 transition-all cursor-pointer"
            >
              Concluído
            </button>
          </div>
        </div>
      )}
    </>
  );
}
