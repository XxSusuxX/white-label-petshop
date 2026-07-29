"use client";

import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-matte-canvas text-on-surface antialiased overflow-x-hidden">
      <GlobalHeader />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden pt-12 md:pt-0">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-glow/5 blur-[120px] -z-10 rounded-full"></div>
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700 transition-all opacity-100 translate-y-0">
              <h1 className="font-headline-lg text-headline-lg md:text-[56px] leading-[1.1] text-on-background max-w-xl">
                O cuidado que seu pet merece, na palma da sua mão.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
                Acompanhe banhos, consultas e agendamentos em tempo real. Uma experiência exclusiva para você e seu melhor amigo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth/register" className="bg-primary text-on-primary font-label-bold text-label-bold px-8 py-4 rounded-xl extruded-shadow emerald-glow-effect hover:brightness-110 transition-all flex items-center justify-center gap-2">
                  Criar Conta Agora
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
                <Link href="/auth/login" className="border border-hairline-border text-on-surface font-label-bold text-label-bold px-8 py-4 rounded-xl hover:bg-white/5 transition-all flex items-center justify-center">
                  Entrar na minha conta
                </Link>
              </div>
            </div>

            {/* 3D Illustration Area */}
            <div className="relative group transition-all duration-700 opacity-100 translate-y-0">
              <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative rounded-3xl overflow-hidden border border-hairline-border bg-elevated-card shadow-2xl p-2 transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
                <img alt="Pet Care Visual" className="w-full h-auto rounded-2xl object-cover" src="https://lh3.googleusercontent.com/aida/AP1WRLvMLXCHIA2NqX_ymDQsh15WqdDcOKE1qd_R8Wlr6A_9PNHPLtkJU3EiGNs0cPH0FHtHTKb3s1WsM_xw_cwDukwjogtOcwUMWu3en2r4kLsMYvM-cNWDyryt8ZO3Ioo2wtldRPSjLlv5J5o0wzZDDR2aFHbrUaJzc5p69xV33nQRxvaSlt5-ch8xn9AjP2r5iAAO2pTe-Porqfnkarcjm1Qns2V3FFxsrp7Ipc4DIDVlqzMIah9CKvwZNpA" />
              </div>


              {/* Badge */}
              <div className="absolute -bottom-6 -left-6 bg-surface-container-high border border-hairline-border p-4 rounded-2xl extruded-shadow hidden lg:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined pulse-node">verified</span>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold">Clínica Verificada</p>
                  <p className="font-caption text-caption text-on-surface-variant">Atendimento 24h</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-stack-lg px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <span className="text-primary font-label-bold text-label-bold uppercase tracking-widest">Nossos Diferenciais</span>
              <h2 className="font-headline-lg text-headline-lg mt-2">Tecnologia a serviço do bem-estar</h2>
            </div>
            <p className="font-body-base text-body-base text-on-surface-variant max-w-md">
              Utilizamos os melhores sistemas de gestão para garantir que cada momento do seu pet seja registrado e compartilhado com você.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="bg-surface-container-low border border-hairline-border p-8 rounded-2xl hover:border-primary/40 transition-colors group">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">pets</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-3">Acompanhamento ao vivo</h3>
              <p className="font-body-base text-body-base text-on-surface-variant">
                Receba fotos e notificações de cada etapa do banho e tosa do seu pet.
              </p>
            </div>

            <div className="bg-surface-container-low border border-hairline-border p-8 rounded-2xl hover:border-primary/40 transition-colors group">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">calendar_month</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-3">Agendamento ágil</h3>
              <p className="font-body-base text-body-base text-on-surface-variant">
                Reserve horários em segundos, sem precisar ligar. Disponibilidade 24h.
              </p>
            </div>

            <div className="bg-surface-container-low border border-hairline-border p-8 rounded-2xl hover:border-primary/40 transition-colors group">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">workspace_premium</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-3">Clube de Benefícios</h3>
              <p className="font-body-base text-body-base text-on-surface-variant">
                Ganhe pontos a cada serviço e troque por mimos e descontos exclusivos.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-surface-container-lowest border-y border-hairline-border/50">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop text-center">
            <div className="flex justify-center gap-1 mb-6">
              <span className="material-symbols-outlined text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <h2 className="font-headline-md text-headline-md mb-12">Amado por +10.000 tutores e seus pets</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center">
                <img className="w-16 h-16 rounded-full border-2 border-primary mb-4 object-cover" alt="Ana Clara" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-MM-db3teAlIy9gLkHY5dI9wyeKEDiu0PNc7o5cBS8B9Z04QmPexf5uzlxZ5Obn7PKNJz-LqgyFd7W-dQyQd5nmGC_nP0fUy1q15-T2gCv3MoUjrnQnBsvSDCoU3cnajWoM6H8KbYUu1pEKkEu34ZUBl_8QGdNeqssS5fYOxT4LHxa3cM7IDBNg2czgukFLgKVND5M22NwxD2UJYRAAAgsbpM2oQG8lCeZDVncQxWx2CHDnS0hx8ljTRIJob-w77Ccc7VTR7sKeo" />
                <p className="font-label-bold text-label-bold">Ana Clara</p>
                <p className="font-caption text-caption text-on-surface-variant">Tutor de Pipoca</p>
              </div>

              <div className="flex flex-col items-center">
                <img className="w-16 h-16 rounded-full border-2 border-primary mb-4 object-cover" alt="Ricardo M." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9CckBRhGkqDCgkblDwKv6lwGvF2FjSyGns-BvpQmnmo2TahVtGpFnf20qMXz3YuJUcdj3TTrMchKjxbdn_-rtNmDBa1KQ61fbBVkKhgTUvJMdgctvoV_ohpMhAfKm6AkQLrJ_IoV8tnkHzV8Z7KAeIRyKrWBpr9Q5pdUF3vzDEEmkR0iigh3QXqWcNrlI0GKZR9BIrGZ7i4qUsa-BTap2dT1b4uXft9FgL58XIX8LKZ8s-s1qBl-H-MfN2EwEhnPv8SIYsy6Byzg" />
                <p className="font-label-bold text-label-bold">Ricardo M.</p>
                <p className="font-caption text-caption text-on-surface-variant">Tutor de Theo</p>
              </div>

              <div className="flex flex-col items-center">
                <img className="w-16 h-16 rounded-full border-2 border-primary mb-4 object-cover" alt="Julia Silva" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLayjlgk-SDOXdotztli-ouZApP72YpYcKHJ8duApYb-iclLrHe8CjWCJFiu2ekZjDHFmJn0zV43XCoMlT5d7V1qg5RFc4Eh4wViWoDE_mGOpL95z9yVoWpsLd4_4yCoesk0udaZpy3Y4YayJWQCO38LrFYT3H4mAq9axxIEzfFfAaZKvc1RUcC9ujxuJxBrpkCh94rYMUCPCpbp8aMAEEBaS8WXEtB87Tiub6268PKTpWO33T5LSFBjxldpjg8uUgqsyGvkZsi-Q" />
                <p className="font-label-bold text-label-bold">Julia Silva</p>
                <p className="font-caption text-caption text-on-surface-variant">Tutor de Amora</p>
              </div>

              <div className="flex flex-col items-center">
                <img className="w-16 h-16 rounded-full border-2 border-primary mb-4 object-cover" alt="Bruno G." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-66O9Qs4jMLyappdyQeq2_dpSDo7WxfcHWB1eU9fGCmF7Uwkomfw-uQuxLaNYdkjvH4iOY3Bywzhe9LjzBhv_Y8H1VF948vOu8MiH1-GYnuTbPznmeJPOeRMmIAZMPuTPS_Deu2zTEuSiyTL3mYKMuHOZgYvWcgkG4jvm6hpdDRwGHmGlZccV3-gzGM2yQ8OVRROcajLxY3tzHDIk5vPcUaArQ0mZl9K3g05r6PMPtmjzeVT48B7SXN9fS46aj-f6Wo14Rwa9Qc0" />
                <p className="font-label-bold text-label-bold">Bruno G.</p>
                <p className="font-caption text-caption text-on-surface-variant">Tutor de Bento</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-stack-lg px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-6 relative z-10">
              Pronto para elevar o nível do cuidado com seu pet?
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto relative z-10">
              Junte-se à comunidade PetFlow e tenha todo o histórico de saúde e estética do seu pet organizado em um só lugar.
            </p>
            <div className="relative z-10">
              <Link href="/auth/register" className="inline-block bg-primary text-on-primary font-label-bold text-label-bold px-12 py-5 rounded-2xl extruded-shadow hover:scale-105 transition-transform text-lg">
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
            <div className="font-headline-md text-headline-md font-bold text-primary">SaaS Portal</div>
            <p className="font-caption text-caption text-on-surface-variant text-center md:text-left max-w-xs">
              © 2024 SaaS Portal. All rights reserved. Precise care for your companions.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="text-on-surface-variant hover:text-primary transition-colors font-caption text-caption" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-caption text-caption" href="#">Terms of Service</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-caption text-caption" href="#">Cookie Policy</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-caption text-caption" href="#">Contact Support</a>
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
