"use client";

import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-matte-canvas text-on-surface antialiased overflow-x-hidden">
      <GlobalHeader />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden py-10 md:py-0">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-glow/5 blur-[120px] -z-10 rounded-full"></div>
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center w-full">
            
            {/* Texto principal (Título + Subtítulo) */}
            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left duration-700 transition-all opacity-100 translate-y-0 text-center md:text-left flex flex-col items-center md:items-start">
              <h1 className="font-headline-lg text-3xl sm:text-4xl md:text-[56px] leading-[1.15] md:leading-[1.1] text-on-background max-w-xl font-bold">
                O cuidado que seu pet merece, na palma da sua mão.
              </h1>
              <p className="font-body-lg text-sm sm:text-base md:text-body-lg text-on-surface-variant max-w-lg leading-relaxed">
                Acompanhe banhos, consultas e agendamentos em tempo real. Uma experiência exclusiva para você e seu melhor amigo.
              </p>

              {/* Botões de Ação no Desktop (mantém layout perfeito de 2 colunas) */}
              <div className="hidden md:flex flex-row gap-4 pt-2 w-full">
                <Link
                  href="/auth/register"
                  className="bg-primary text-on-primary font-label-bold text-label-bold px-8 py-4 rounded-xl extruded-shadow emerald-glow-effect hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  Criar Conta Agora
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
                <Link
                  href="/auth/login"
                  className="border border-hairline-border text-on-surface font-label-bold text-label-bold px-8 py-4 rounded-xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center text-sm"
                >
                  Entrar na minha conta
                </Link>
              </div>
            </div>

            {/* Glassmorphism Card & Botões Mobile (No mobile: Título -> Card -> Botões) */}
            <div className="relative group transition-all duration-700 opacity-100 translate-y-0 w-full flex flex-col items-center justify-center">
              <div className="absolute -inset-4 bg-primary/15 blur-3xl rounded-full opacity-40 group-hover:opacity-60 transition-opacity"></div>
              
              {/* Card visual em destaque */}
              <div className="relative w-full max-w-sm sm:max-w-md rounded-[2rem] sm:rounded-[2.5rem] border border-primary/20 bg-elevated-card/90 backdrop-blur-xl p-7 sm:p-10 md:p-14 shadow-2xl flex flex-col items-center justify-center text-center gap-5 sm:gap-6 group-hover:border-primary/40 transition-all duration-500">
                {/* Círculo com ícone */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_35px_rgba(78,222,163,0.15)] group-hover:scale-105 transition-transform duration-500">
                  <span className="material-symbols-outlined text-4xl sm:text-5xl">pets</span>
                </div>

                {/* Título */}
                <h3 className="font-headline-md text-xl sm:text-2xl text-on-surface font-bold tracking-tight">
                  PetShop & Estética Premium
                </h3>

                {/* Pill Badge */}
                <div className="bg-primary/10 border border-primary/30 text-primary px-4 sm:px-5 py-2 rounded-full inline-flex items-center justify-center gap-2 text-xs sm:text-caption font-label-bold shadow-sm max-w-full">
                  <span className="material-symbols-outlined text-sm font-bold shrink-0">check_circle</span>
                  <span className="truncate">Clínica Verificada • Atendimento 24h</span>
                </div>
              </div>

              {/* Botões de Ação no Mobile (Aparecem logo abaixo do Card) */}
              <div className="flex md:hidden flex-col gap-3 pt-6 w-full max-w-sm sm:max-w-md">
                <Link
                  href="/auth/register"
                  className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 px-6 rounded-xl extruded-shadow emerald-glow-effect hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 text-center text-sm font-bold shadow-lg"
                >
                  Criar Conta Agora
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
                <Link
                  href="/auth/login"
                  className="w-full border border-hairline-border bg-surface-container/50 text-on-surface font-label-bold text-label-bold py-3.5 px-6 rounded-xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center text-center text-sm font-semibold"
                >
                  Entrar na minha conta
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section ("Nossos Diferenciais") */}
        <section id="features" className="py-12 md:py-stack-lg px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4 md:gap-6">
            <div>
              <span className="text-primary font-label-bold text-xs md:text-label-bold uppercase tracking-widest block font-bold">Nossos Diferenciais</span>
              <h2 className="text-2xl sm:text-3xl md:text-headline-lg font-bold mt-1 md:mt-2 text-on-surface">Tecnologia a serviço do bem-estar</h2>
            </div>
            <p className="text-xs sm:text-sm md:text-body-base text-on-surface-variant max-w-md break-words leading-relaxed">
              Utilizamos os melhores sistemas de gestão para garantir que cada momento do seu pet seja registrado e compartilhado com você.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-gutter">
            <div className="bg-surface-container-low border border-hairline-border p-6 sm:p-8 rounded-2xl hover:border-primary/40 transition-colors group flex flex-col justify-start">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 sm:mb-6 group-hover:scale-110 transition-transform shrink-0">
                <span className="material-symbols-outlined text-2xl sm:text-3xl">pets</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-on-surface break-words">Acompanhamento ao vivo</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed break-words">
                Receba fotos e notificações de cada etapa do banho e tosa do seu pet.
              </p>
            </div>

            <div className="bg-surface-container-low border border-hairline-border p-6 sm:p-8 rounded-2xl hover:border-primary/40 transition-colors group flex flex-col justify-start">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 sm:mb-6 group-hover:scale-110 transition-transform shrink-0">
                <span className="material-symbols-outlined text-2xl sm:text-3xl">calendar_month</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-on-surface break-words">Agendamento ágil</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed break-words">
                Reserve horários em segundos, sem precisar ligar. Disponibilidade 24h.
              </p>
            </div>

            <div className="bg-surface-container-low border border-hairline-border p-6 sm:p-8 rounded-2xl hover:border-primary/40 transition-colors group flex flex-col justify-start">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 sm:mb-6 group-hover:scale-110 transition-transform shrink-0">
                <span className="material-symbols-outlined text-2xl sm:text-3xl">workspace_premium</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-on-surface break-words">Clube de Benefícios</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed break-words">
                Ganhe pontos a cada serviço e troque por mimos e descontos exclusivos.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 bg-surface-container-lowest border-y border-hairline-border/50">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop text-center">
            <div className="flex justify-center gap-1 mb-4 md:mb-6">
              <span className="material-symbols-outlined text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-headline-md font-bold mb-8 md:mb-12 text-on-surface">Amado por +10.000 tutores e seus pets</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <div className="flex flex-col items-center gap-2 p-4 bg-surface-container-low/50 sm:bg-transparent rounded-xl border border-hairline-border/30 sm:border-0">
                <img loading="lazy" className="w-16 h-16 rounded-full border-2 border-primary mb-2 object-cover" alt="Ana Clara" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" />
                <p className="font-label-bold text-label-bold">Ana Clara</p>
                <p className="font-caption text-caption text-on-surface-variant">Tutora da Pipoca</p>
                <p className="text-xs text-on-surface-variant/80 text-center max-w-[200px] sm:max-w-[160px] italic leading-relaxed">&quot;Consigo acompanhar cada etapa do banho em tempo real. Incrível!&quot;</p>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-surface-container-low/50 sm:bg-transparent rounded-xl border border-hairline-border/30 sm:border-0">
                <img loading="lazy" className="w-16 h-16 rounded-full border-2 border-primary mb-2 object-cover" alt="Ricardo M." src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" />
                <p className="font-label-bold text-label-bold">Ricardo M.</p>
                <p className="font-caption text-caption text-on-surface-variant">Tutor do Theo</p>
                <p className="text-xs text-on-surface-variant/80 text-center max-w-[200px] sm:max-w-[160px] italic leading-relaxed">&quot;Agendei online às 23h sem precisar ligar. Muito prático!&quot;</p>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-surface-container-low/50 sm:bg-transparent rounded-xl border border-hairline-border/30 sm:border-0">
                <img loading="lazy" className="w-16 h-16 rounded-full border-2 border-primary mb-2 object-cover" alt="Julia Silva" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" />
                <p className="font-label-bold text-label-bold">Julia Silva</p>
                <p className="font-caption text-caption text-on-surface-variant">Tutora da Amora</p>
                <p className="text-xs text-on-surface-variant/80 text-center max-w-[200px] sm:max-w-[160px] italic leading-relaxed">&quot;Todo o histórico de saúde da minha gata num só lugar. Adorei!&quot;</p>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-surface-container-low/50 sm:bg-transparent rounded-xl border border-hairline-border/30 sm:border-0">
                <img loading="lazy" className="w-16 h-16 rounded-full border-2 border-primary mb-2 object-cover" alt="Bruno G." src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80" />
                <p className="font-label-bold text-label-bold">Bruno G.</p>
                <p className="font-caption text-caption text-on-surface-variant">Tutor do Bento</p>
                <p className="text-xs text-on-surface-variant/80 text-center max-w-[200px] sm:max-w-[160px] italic leading-relaxed">&quot;Recebi notificação quando o Bento ficou pronto. Serviço 5 estrelas!&quot;</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-stack-lg px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-8 sm:p-12 md:p-20 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl md:text-headline-lg font-bold mb-4 md:mb-6 relative z-10 text-on-surface">
              Pronto para elevar o nível do cuidado com seu pet?
            </h2>
            <p className="text-sm md:text-body-lg text-on-surface-variant mb-8 md:mb-10 max-w-2xl mx-auto relative z-10 leading-relaxed">
              Tenha todo o histórico de saúde e estética do seu pet organizado em um só lugar, com agendamento online e acompanhamento em tempo real.
            </p>
            <div className="relative z-10">
              <Link href="/auth/register" className="inline-block w-full sm:w-auto bg-primary text-on-primary font-label-bold text-label-bold px-10 sm:px-12 py-4 sm:py-5 rounded-2xl extruded-shadow hover:scale-105 active:scale-95 transition-all text-base sm:text-lg shadow-lg">
                Começar Agora Grátis
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-hairline-border">
        <div className="py-stack-lg px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-stack-md">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="font-headline-md text-headline-md font-bold text-primary">PetNexus</div>
            <p className="font-caption text-caption text-on-surface-variant text-center md:text-left max-w-xs">
              © 2026 PetNexus. Todos os direitos reservados. Cuidado preciso para seus companheiros.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="text-on-surface-variant hover:text-primary transition-colors font-caption text-caption" href="#">Política de Privacidade</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-caption text-caption" href="#">Termos de Uso</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-caption text-caption" href="#">Política de Cookies</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-caption text-caption" href="#">Suporte ao Cliente</a>
          </div>
          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full border border-hairline-border flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all">
              <span className="material-symbols-outlined text-lg">share</span>
            </button>
            <button className="w-10 h-10 rounded-full border border-hairline-border flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all">
              <span className="material-symbols-outlined text-lg">mail</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
