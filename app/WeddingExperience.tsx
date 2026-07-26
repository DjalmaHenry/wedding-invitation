"use client";

import { useEffect, useRef, useState } from "react";

export function WeddingExperience() {
  const [opening, setOpening] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasOpened = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openInvitation = () => {
    if (hasOpened.current) return;
    hasOpened.current = true;
    setOpening(true);
    window.setTimeout(() => setOpen(true), 900);
  };

  const gardenStyle = {
    transform: `scale(${1.04 + progress * 0.34}) translateY(${progress * 3.5}%)`,
  };

  return (
    <main
      className={`storybook${opening ? " is-opening" : ""}${open ? " is-open" : ""}`}
    >
      <section className="painted-garden" aria-label="Jardim do casamento">
        <div className="garden-art" style={gardenStyle} />
        <div className="garden-wash" />

        <article
          className={`invitation-card${progress > 0.1 ? " is-fading" : ""}`}
          aria-label="Convite de casamento de Djalma e Victoria"
        >
          <p className="intro">Junto com nossas famílias</p>
          <h1>
            <span>Djalma</span>
            <i>&</i>
            <span>Victoria</span>
          </h1>
          <p className="invitation-message">
            convidam você e sua família para celebrar o nosso casamento
          </p>
          <div className="ornament" aria-hidden="true">
            ✦
          </div>
          <div className="date-lockup">
            <div>
              <small>sábado</small>
              <strong>31</strong>
              <small>outubro</small>
            </div>
            <span />
            <div>
              <small>às</small>
              <strong>16:20</strong>
              <small>horas</small>
            </div>
          </div>
          <p className="venue">Villa Garden</p>
          <p className="year">2026</p>
        </article>

        <div
          className={`scroll-note${progress > 0.08 ? " is-hidden" : ""}`}
          aria-hidden="true"
        >
          <span>Role para caminhar até o altar</span>
          <b>↓</b>
        </div>
      </section>

      <section className="painted-envelope" aria-label="Carta de casamento">
        <div className="envelope-art" />
        <div className="canvas-grain" />
        <div className="opening-light" />
        <button
          type="button"
          className="painted-seal"
          onClick={openInvitation}
          aria-label="Abrir convite de Djalma e Victoria"
          data-testid="open-invitation"
        >
          <span>D</span>
          <i>&</i>
          <span>V</span>
        </button>
        <p className="seal-note">Toque no lacre</p>
      </section>
    </main>
  );
}
