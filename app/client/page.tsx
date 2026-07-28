"use client";

import { useState } from "react";
import Link from "next/link";

export default function ClientHomePage() {
  const [showLiveCameraModal, setShowLiveCameraModal] = useState(false);
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

    setNewPetName("");
    setNewBreed("");
    setNewAge("");
    setNewWeight("");
    setNewColor("");
    setNewNotes("");
    setNewPhotoPreview(null);
    setNewIsCastrated(false);
    setShowAddPetModal(false);

    alert(`🎉 Pet "${newPetName}" cadastrado com sucesso! Veja na página Meus Pets.`);
  };

  return (
    <div className="bg-matte-canvas text-on-surface font-body-base antialiased custom-scrollbar min-h-screen flex flex-col">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-matte-canvas border-r border-hairline-border flex-col z-50">
        <div className="p-6 border-b border-hairline-border flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center extruded-shadow">
            <span
              className="material-symbols-outlined text-on-primary-container text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              pets
            </span>
          </div>
          <span className="text-headline-md font-headline-md font-bold text-primary">SaaS Portal</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/client"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-label-bold transition-colors"
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </Link>
          <Link
            href="/client/pets"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors font-label-muted"
          >
            <span className="material-symbols-outlined">pets</span>
            Meus Pets
          </Link>
          <Link
            href="/agenda"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors font-label-muted"
          >
            <span className="material-symbols-outlined">calendar_today</span>
            Agendar Serviço
          </Link>
          <Link
            href="/auth/login"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors font-label-muted"
          >
            <span className="material-symbols-outlined">history</span>
            Portal de Acesso
          </Link>
        </nav>

        <div className="p-4 border-t border-hairline-border space-y-3">
          <Link
            href="/admin/dashboard"
            className="w-full bg-surface-container-high border border-hairline-border text-on-surface py-2 rounded-xl font-label-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            <span>Painel Admin</span>
          </Link>
          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">Ana Paula</p>
              <p className="text-xs text-on-surface-variant truncate">ana.tutor@exemplo.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-matte-canvas/90 backdrop-blur-md border-b border-hairline-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-9 h-9 bg-primary-container rounded-lg flex items-center justify-center extruded-shadow">
              <span
                className="material-symbols-outlined text-on-primary-container text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                pets
              </span>
            </div>
            <span className="text-xl font-bold text-primary">SaaS Portal</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Portal do Cliente</span>
            <span>/</span>
            <span className="text-on-surface font-bold">Status do Atendimento em Tempo Real</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-surface-container-high border border-hairline-border text-on-surface font-bold text-xs rounded-lg hover:bg-surface-variant transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">login</span>
              Entrar
            </Link>
            <button
              onClick={() => setShowAddPetModal(true)}
              className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-lg extruded-shadow hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">pets</span>
              Cadastrar Pet
            </button>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Main Dashboard Grid: Left Status + Right Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Greeting & Pet Live Status Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Top Greeting Card */}
              <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 extruded-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface flex items-center gap-2">
                    Olá, Ana! <span className="inline-block animate-bounce">👋</span>
                  </h1>
                  <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
                    O <strong className="text-on-surface font-bold">Thor</strong> está se sentindo incrível hoje. Confira o status do atendimento dele em tempo real abaixo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <a
                    href="https://wa.me/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 md:flex-initial px-5 py-3 bg-[#10b981] hover:bg-[#059669] text-on-primary font-bold text-sm rounded-xl extruded-shadow transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span>
                    WhatsApp
                  </a>
                  <button
                    onClick={() => alert("Discando para a Unidade Jardins SP: (11) 3300-4000")}
                    className="flex-1 md:flex-initial px-5 py-3 bg-surface-container border border-hairline-border hover:bg-surface-container-high text-on-surface font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">call</span>
                    Ligar para Unidade
                  </button>
                </div>
              </div>

              {/* Main Service Progress Card */}
              <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 extruded-shadow space-y-6">
                {/* Pet Info & Status Badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline-border/40 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 relative flex-shrink-0 shadow-lg">
                      <img
                        src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80"
                        alt="Thor - Golden Retriever"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-on-surface">Thor</h2>
                      <p className="text-sm text-on-surface-variant">Golden Retriever • Banho + Tosa</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end">
                    <span className="px-3 py-1 bg-warning-amber/10 border border-warning-amber/30 text-warning-amber font-bold text-xs rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-warning-amber animate-pulse"></span>
                      EM ANDAMENTO
                    </span>
                    <span className="text-xs text-on-surface-variant mt-1.5">Término previsto: 16:45</span>
                  </div>
                </div>

                {/* Service Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-on-surface-variant uppercase tracking-wider">Progresso do Serviço</span>
                    <span className="text-primary font-mono text-sm">2 / 5 Etapas</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden p-0.5 border border-hairline-border">
                    <div className="h-full bg-primary rounded-full w-[40%] shadow-[0_0_12px_rgba(78,222,163,0.6)] transition-all duration-700"></div>
                  </div>
                </div>

                {/* 4 Stat Boxes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-surface-container-lowest border border-hairline-border p-4 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">UNIDADE</span>
                    <span className="text-sm font-bold text-on-surface block truncate">Jardins SP</span>
                  </div>

                  <div className="bg-surface-container-lowest border border-hairline-border p-4 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">PROFISSIONAL</span>
                    <span className="text-sm font-bold text-on-surface block truncate">Ricardo M.</span>
                  </div>

                  <div className="bg-surface-container-lowest border border-hairline-border p-4 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">PESO</span>
                    <span className="text-sm font-bold text-on-surface block truncate">32.4 kg</span>
                  </div>

                  <div className="bg-surface-container-lowest border border-hairline-border p-4 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">SAÚDE</span>
                    <span className="text-sm font-bold text-primary flex items-center gap-1 block truncate">
                      <span>💚</span> Excelente
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Timeline Real-Time Card */}
            <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 extruded-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-hairline-border/40 pb-4">
                  <h3 className="text-xl font-bold text-on-surface">Timeline</h3>
                  <Link href="/pets" className="text-xs font-bold text-primary hover:underline">
                    Ver Histórico
                  </Link>
                </div>

                {/* Steps List */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-hairline-border">
                  {/* Step 1 - Coletado (Completed) */}
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-[0_0_10px_rgba(78,222,163,0.4)]">
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Coletado</h4>
                      <p className="text-xs text-on-surface-variant">Check-in realizado às 14:15</p>
                    </div>
                    <span className="px-2 py-0.5 bg-surface-container border border-hairline-border text-primary font-mono text-[10px] rounded font-bold">OK</span>
                  </div>

                  {/* Step 2 - Banho Finalizado (Completed) */}
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-[0_0_10px_rgba(78,222,163,0.4)]">
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Banho Finalizado</h4>
                      <p className="text-xs text-on-surface-variant">Utilizado Shampoo Hipoalergênico</p>
                    </div>
                    <span className="px-2 py-0.5 bg-surface-container border border-hairline-border text-primary font-mono text-[10px] rounded font-bold">OK</span>
                  </div>

                  {/* Step 3 - Em Tosa (Active Current) */}
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-warning-amber flex items-center justify-center text-on-primary shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse">
                      <span className="material-symbols-outlined text-sm font-bold">content_cut</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-warning-amber">Em Tosa</h4>
                      <p className="text-xs text-on-surface-variant">Iniciado às 15:30 (Tosa Bebê)</p>
                    </div>
                    <span className="px-2 py-0.5 bg-warning-amber/20 border border-warning-amber/40 text-warning-amber font-mono text-[10px] rounded font-bold">ATUAL</span>
                  </div>

                  {/* Step 4 - Finalizado (Pending) */}
                  <div className="relative flex items-start justify-between gap-3 opacity-50">
                    <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-surface-container border border-hairline-border flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-sm">fact_check</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Finalizado</h4>
                      <p className="text-xs text-on-surface-variant">Aguardando inspeção final</p>
                    </div>
                  </div>

                  {/* Step 5 - Saindo para entrega (Pending) */}
                  <div className="relative flex items-start justify-between gap-3 opacity-50">
                    <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-surface-container border border-hairline-border flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-sm">local_shipping</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Saindo para entrega</h4>
                      <p className="text-xs text-on-surface-variant">Motorista: Carlos A.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Camera Button */}
              <button
                onClick={() => setShowLiveCameraModal(true)}
                className="w-full py-3.5 bg-surface-container border border-primary/40 text-primary font-bold text-sm rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2 extruded-shadow cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">videocam</span>
                Ver Câmera ao Vivo
              </button>
            </div>
          </div>
        </main>

        <footer className="py-6 px-6 bg-matte-canvas border-t border-hairline-border text-center text-xs text-outline mt-auto">
          © 2026 SaaS Portal. Todos os direitos reservados.
        </footer>
      </div>

      {/* Live Camera Modal */}
      {showLiveCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-primary/30 rounded-3xl p-6 max-w-2xl w-full text-center extruded-shadow emerald-glow-effect flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hairline-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <h3 className="text-lg font-bold text-on-surface">Transmissão ao Vivo - Sala de Tosa</h3>
              </div>
              <button
                onClick={() => setShowLiveCameraModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
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
                AO VIVO (Câmera 02)
              </div>
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-on-surface text-xs px-3 py-1.5 rounded-lg border border-hairline-border">
                Thor • Tosa Bebê em andamento por Ricardo M.
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

      {/* Modal: Adicionar Novo Pet */}
      {showAddPetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-xl w-full p-6 md:p-8 extruded-shadow flex flex-col gap-6 relative my-auto">
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

            <form onSubmit={handleCreatePet} className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <input
                  type="file"
                  id="modal-client-pet-photo"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="modal-client-pet-photo"
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
                <div className="md:col-span-2 space-y-1">
                  <label htmlFor="modal_client_pet_name" className="text-xs font-bold text-on-surface">Nome do Pet *</label>
                  <input
                    id="modal_client_pet_name"
                    type="text"
                    required
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    placeholder="Ex: Bob, Nina, Tobey..."
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm placeholder:text-outline outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal_client_species" className="text-xs font-bold text-on-surface">Espécie</label>
                  <select
                    id="modal_client_species"
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

                <div className="space-y-1">
                  <label htmlFor="modal_client_breed" className="text-xs font-bold text-on-surface">Raça</label>
                  <input
                    id="modal_client_breed"
                    type="text"
                    value={newBreed}
                    onChange={(e) => setNewBreed(e.target.value)}
                    placeholder="Ex: Poodle, Shih Tzu, SRD"
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-on-surface text-sm placeholder:text-outline outline-none"
                  />
                </div>
              </div>

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
                  className="flex-1 bg-primary text-on-primary font-bold text-sm py-3 rounded-xl extruded-shadow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>Salvar Pet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
