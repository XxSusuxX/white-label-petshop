"use client";

import { useState, useEffect, useMemo } from "react";

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  category: "service" | "product" | "package";
  is_active: boolean;
}

export default function ServicosPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"service" | "product" | "package">("service");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New item form
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDuration, setFormDuration] = useState("30");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState<"service" | "product" | "package">("service");

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (data.services) setItems(data.services);
    } catch (err) {
      console.error("Erro ao carregar catálogo:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice.trim()) {
      alert("Nome e preço são obrigatórios.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim(),
          duration_minutes: parseInt(formDuration) || 30,
          price: formPrice.trim(),
          category: formCategory,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowNewModal(false);
        setFormName("");
        setFormDescription("");
        setFormDuration("30");
        setFormPrice("");
        loadCatalog();
      } else {
        alert(`Erro: ${data.error || "Tente novamente."}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesTab = item.category === activeTab;
      const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [items, activeTab, searchTerm]);

  const tabCounts = useMemo(() => ({
    service: items.filter((i) => i.category === "service").length,
    product: items.filter((i) => i.category === "product").length,
    package: items.filter((i) => i.category === "package").length,
  }), [items]);

  const tabs = [
    { key: "service" as const, label: "Serviços", icon: "content_cut", count: tabCounts.service },
    { key: "product" as const, label: "Produtos", icon: "inventory_2", count: tabCounts.product },
    { key: "package" as const, label: "Pacotes", icon: "loyalty", count: tabCounts.package },
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "service": return "content_cut";
      case "product": return "inventory_2";
      case "package": return "loyalty";
      default: return "category";
    }
  };

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Serviços & Preços</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {isLoading ? "Carregando catálogo..." : `${items.length} itens no catálogo`}
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-primary text-on-primary font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 extruded-shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          Novo Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface-container border border-hairline-border rounded-xl p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-primary text-on-primary extruded-shadow"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === tab.key ? "bg-on-primary/20 text-on-primary" : "bg-surface-container-highest text-on-surface-variant"
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-surface-container border border-hairline-border rounded-xl pl-12 pr-4 py-3 text-sm text-on-surface outline-none focus:border-primary placeholder:text-outline"
          placeholder={`Buscar ${activeTab === "service" ? "serviços" : activeTab === "product" ? "produtos" : "pacotes"}...`}
        />
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-elevated-card border border-hairline-border rounded-xl p-5 animate-pulse">
              <div className="h-6 w-40 bg-surface-container-highest rounded mb-3"></div>
              <div className="h-4 w-full bg-surface-container-highest rounded mb-2"></div>
              <div className="h-4 w-24 bg-surface-container-highest rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3">inventory_2</span>
          <h3 className="font-bold text-on-surface-variant">Nenhum item encontrado</h3>
          <p className="text-sm text-outline mt-1">Adicione itens ao catálogo clicando em &quot;Novo Item&quot;.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-elevated-card border border-hairline-border rounded-xl p-5 hover:border-primary/30 transition-colors group extruded-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">{getCategoryIcon(item.category)}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-sm">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-on-surface-variant truncate max-w-[180px]">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-hairline-border">
                <div className="flex items-center gap-4">
                  {item.duration_minutes > 0 && (
                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span className="text-xs font-bold">{item.duration_minutes} min</span>
                    </div>
                  )}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.is_active
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}>
                    {item.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <span className="text-lg font-extrabold text-primary">
                  R$ {item.price.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== MODAL: Novo Item no Catálogo ====== */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-md w-full p-6 space-y-5 extruded-shadow">
            <div className="flex justify-between items-center border-b border-hairline-border pb-3">
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                Novo Item no Catálogo
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg bg-surface-container cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Categoria *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["service", "product", "package"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition-all ${
                        formCategory === cat
                          ? "bg-primary text-on-primary border-primary extruded-shadow"
                          : "bg-surface-container text-on-surface-variant border-hairline-border hover:border-primary/30"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{getCategoryIcon(cat)}</span>
                      {cat === "service" ? "Serviço" : cat === "product" ? "Produto" : "Pacote"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Nome *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Banho & Tosa Completo"
                  className="w-full bg-surface-container border border-hairline-border rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Descrição</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Breve descrição do serviço"
                  className="w-full bg-surface-container border border-hairline-border rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Duração (min)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="85.00"
                    className="w-full bg-surface-container border border-hairline-border rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:brightness-110 transition-all extruded-shadow cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Salvando..." : "Cadastrar Item"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
