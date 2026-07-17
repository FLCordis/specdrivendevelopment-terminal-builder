import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SDD Terminal",
  description: "Gera documentação orientada a agentes (Superpowers) para projetos de software.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
