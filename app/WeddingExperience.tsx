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
      const max = window.innerHeight * 1.55;
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
    window.setTimeout(() => setOpen(true), 650);
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
          className={`invitation-card${progress > 0.48 ? " is-fading" : ""}`}
          aria-label="Convite de casamento de Djalma e Victoria"
        >
          <p className="intro">Junto com nossas famílias</p>
          <h1>
            <span>Djalma</span>
            <i>&</i>
            <span>Victoria</span>
          </h1>
          <p className="invitation-message">
            convidamos você para celebrar nosso casamento.
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
        <div className="envelope-asset-stage">
          <img
            className="envelope-object"
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

      <div className="garden-scroll-space snap-section" aria-hidden="true" />

      <section className="venue-section snap-section" aria-labelledby="venue-title">
        <div className="venue-altar" aria-hidden="true">
          <span>O lugar do nosso sim</span>
        </div>

        <div className="venue-content">
          <div className="venue-grid">
            <div className="map-frame">
              <div className="map-viewport">
                <iframe
                  title="Mapa do Villa Garden"
                  src="https://www.google.com/maps?q=R.%20Dr.%20Rodrigo%20Codes%20Sandoval%2C%2076%20-%20Mondubim%2C%20Fortaleza%20-%20CE%2C%2060711-455&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <img
                className="map-frame-art"
                src="/map-frame-classic-v1.png"
                alt=""
                aria-hidden="true"
              />
            </div>

            <div className="venue-details">
              <p className="venue-eyebrow">Cerimônia & recepção</p>
              <h2 id="venue-title">Villa Garden</h2>
              <div className="venue-rule" />
              <address>
                R. Dr. Rodrigo Codes Sandoval, 76
                <br />
                Mondubim, Fortaleza — CE
                <br />
                60711-455
              </address>
              <div className="route-actions">
                <a
                  className="route-button route-primary"
                  href="https://www.google.com/maps/dir/?api=1&destination=R.%20Dr.%20Rodrigo%20Codes%20Sandoval%2C%2076%20-%20Mondubim%2C%20Fortaleza%20-%20CE%2C%2060711-455"
                  target="_blank"
                  rel="noreferrer"
                >
                  Traçar rota <span aria-hidden="true">↗</span>
                </a>
                <a
                  className="route-button route-secondary"
                  href="https://www.waze.com/ul?q=R.%20Dr.%20Rodrigo%20Codes%20Sandoval%2C%2076%20-%20Mondubim%2C%20Fortaleza%20-%20CE%2C%2060711-455&navigate=yes"
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir no Waze
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
