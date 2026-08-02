import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PetNexus - Gestão Inteligente para Pet Shops",
  description: "Plataforma SaaS White-Label para Pet Shops e Clínicas Veterinárias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className={`${hankenGrotesk.className} min-h-screen bg-[#0f1419] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
