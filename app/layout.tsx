import type { Metadata } from "next";
import "@fontsource-variable/cormorant-garamond";
import "./globals.css";

export const metadata: Metadata = {
  title: "Djalma & Victoria — Nosso casamento",
  description:
    "Um convite para viver conosco o dia 31 de outubro de 2026, no Villa Garden.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
