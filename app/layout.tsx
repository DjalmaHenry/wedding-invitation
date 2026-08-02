import type { Metadata } from "next";
import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/cormorant-garamond";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://victoriasandy.djalmahenry.com"),
  alternates: {
    canonical: "/",
  },
  title: "Djalma & Victoria — Nosso casamento",
  description:
    "Um convite para viver conosco o dia 31 de outubro de 2026, no Villa Garden.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Djalma & Victoria",
    title: "Djalma & Victoria — Nosso casamento",
    description:
      "Você está convidado para celebrar conosco o dia 31 de outubro de 2026.",
    images: [
      {
        url: "https://victoriasandy.djalmahenry.com/preview-carta-whatsapp.jpg",
        width: 1733,
        height: 908,
        type: "image/jpeg",
        alt: "Carta fechada de Djalma e Victoria com lacre verde-oliva D & V",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Djalma & Victoria — Nosso casamento",
    description:
      "Você está convidado para celebrar conosco o dia 31 de outubro de 2026.",
    images: ["https://victoriasandy.djalmahenry.com/preview-carta-whatsapp.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="preload"
          href="/salut-damour-elgar.mp3"
          as="audio"
          type="audio/mpeg"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
