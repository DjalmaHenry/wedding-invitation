import type { Metadata } from "next";
import { WeddingExperience } from "./WeddingExperience";

export const metadata: Metadata = {
  title: "Djalma & Victoria — 31.10.2026",
  description:
    "Você e sua família estão convidados para celebrar o casamento de Djalma e Victoria.",
};

export default function Home() {
  return <WeddingExperience />;
}
