"use client";

import { useEffect, useRef, useState } from "react";

const WEDDING_DATE = new Date("2026-10-31T16:20:00-03:00").getTime();

function getTimeLeft() {
  const distance = Math.max(0, WEDDING_DATE - Date.now());
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1_000) % 60),
  };
}

export function WeddingExperience() {
  const [opening, setOpening] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const hasOpened = useRef(false);

  useEffect(() => {
    const updateCountdown = () => setTimeLeft(getTimeLeft());
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, []);

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
    window.scrollTo(0, 0);
    setOpening(true);
    window.setTimeout(() => setOpen(true), 1750);
  };

  const gardenStyle = {
    transform: `scale(${(opening ? 1.04 : 1.24) + progress * 0.34}) translateY(${progress * 3.5}%)`,
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
          <div
            className="countdown"
            aria-label={`${timeLeft.days} dias, ${timeLeft.hours} horas, ${timeLeft.minutes} minutos e ${timeLeft.seconds} segundos para o casamento`}
          >
            {(
              [
                ["dias", timeLeft.days],
                ["horas", timeLeft.hours],
                ["min", timeLeft.minutes],
                ["seg", timeLeft.seconds],
              ] as const
            ).map(([label, value]) => (
              <div className="countdown-unit" key={label}>
                <strong>{String(value).padStart(2, "0")}</strong>
                <small>{label}</small>
              </div>
            ))}
          </div>
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
        <div className="envelope-background" />
        <div className="canvas-grain" />
        <div className="opening-beam" />
        <div className="opening-light" />
        <div className="envelope-asset-stage">
          <img
            className="envelope-object envelope-object-top"
            src="/envelope-cutout-v2.webp"
            alt=""
          />
          <img
            className="envelope-object envelope-object-bottom"
            src="/envelope-cutout-v2.webp"
            alt=""
          />
          <button
            type="button"
            className="painted-seal"
            onClick={openInvitation}
            aria-label="Abrir convite de Djalma e Victoria"
            data-testid="open-invitation"
          />
          <p className="seal-note">Toque no lacre</p>
        </div>
      </section>
    </main>
  );
}
