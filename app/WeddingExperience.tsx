"use client";

import { useEffect, useRef, useState } from "react";

const WEDDING_DATE = new Date("2026-10-31T16:20:00-03:00").getTime();

type ModalName = "rsvp" | "gifts" | "guide" | null;
type FamilySide = "groom" | "bride" | null;
type GiftItem = {
  id: string;
  title: string;
  description: string;
  detail: string;
  image: string;
  minimum: number;
  maximum: number;
  suggestions: number[];
};
type GuideTopic = {
  title: string;
  text: string;
  image: string;
  alt: string;
};

const WEDDING_ADDRESS =
  "R. Dr. Rodrigo Codes Sandoval, 76 - Mondubim, Fortaleza - CE, 60711-455";
const TEMPORARY_PIX_KEY = "djalma.victoria@pix.exemplo";

const GIFT_ITEMS: GiftItem[] = [
  {
    id: "passagens",
    title: "Passagens da aventura",
    description: "Um empurrãozinho para começarmos essa história.",
    detail:
      "Sua contribuição ajuda a transformar o primeiro trecho da nossa aventura em uma lembrança inesquecível.",
    image: "/gift-flight-painted-v1.webp",
    minimum: 100,
    maximum: 800,
    suggestions: [100, 250, 500],
  },
  {
    id: "hospedagem",
    title: "Cantinho para descansar",
    description: "Aconchego para recarregar as energias.",
    detail:
      "Um carinho para as noites de descanso entre um novo cenário e outro, sempre com uma surpresa nos esperando.",
    image: "/gift-stay-painted-v1.webp",
    minimum: 80,
    maximum: 600,
    suggestions: [80, 200, 400],
  },
  {
    id: "jantar",
    title: "Jantar especial",
    description: "Um brinde aos primeiros dias dessa nova fase.",
    detail:
      "Ajude-nos a celebrar com uma experiência à mesa, feita de sabores, boas conversas e momentos só nossos.",
    image: "/gift-dinner-painted-v1.webp",
    minimum: 50,
    maximum: 350,
    suggestions: [50, 150, 300],
  },
  {
    id: "passeio",
    title: "Passeio inesquecível",
    description: "Um novo cenário para guardarmos na memória.",
    detail:
      "Sua contribuição vira tempo para explorar, admirar paisagens e colecionar histórias sem revelar o roteiro.",
    image: "/gift-tour-painted-v1.webp",
    minimum: 60,
    maximum: 450,
    suggestions: [60, 180, 350],
  },
  {
    id: "diversao",
    title: "Dia de diversão",
    description: "Risadas e encantamento em uma parada especial.",
    detail:
      "Um presente para vivermos um dia leve, cheio de alegria e daquele friozinho bom na barriga.",
    image: "/gift-fun-painted-v1.webp",
    minimum: 80,
    maximum: 500,
    suggestions: [80, 220, 400],
  },
  {
    id: "carro",
    title: "Locação para o roteiro",
    description: "Liberdade para nossos deslocamentos de ida e volta.",
    detail:
      "Este presente ajuda na locação do carro que nos acompanhará pelos trajetos de ida e volta da viagem.",
    image: "/gift-car-painted-v1.webp",
    minimum: 100,
    maximum: 1000,
    suggestions: [100, 350, 700],
  },
  {
    id: "caminho",
    title: "Caminho da viagem",
    description: "Para seguirmos pela estrada com tranquilidade.",
    detail:
      "Uma contribuição para combustível, pedágios e pequenos cuidados que deixam cada caminho mais leve.",
    image: "/gift-road-painted-v1.webp",
    minimum: 50,
    maximum: 400,
    suggestions: [50, 160, 300],
  },
];

const GUIDE_TOPICS: GuideTopic[] = [
  {
    title: "Confirme sua presença",
    text: "Pedimos, com muito carinho, que confirme sua presença com antecedência, para que possamos organizar cada detalhe da melhor maneira e garantir o conforto de todos durante a celebração.",
    image: "/guide-rsvp-painted-v1.webp",
    alt: "Caricatura de Djalma e Victoria recebendo uma confirmação de presença",
  },
  {
    title: "Chegue com tranquilidade",
    text: "Nossa cerimônia terá início pontualmente às 17:00. Para que todos possam se acomodar com tranquilidade e acompanhar esse momento desde o início, pedimos a gentileza de chegar por volta das 16:30, evitando atrasos.",
    image: "/guide-arrival-painted-v1.webp",
    alt: "Caricatura dos convidados chegando com antecedência à cerimônia",
  },
  {
    title: "Traje: esporte fino",
    text: "Escolhemos um estilo elegante e confortável para que todos aproveitem esse dia tão especial. Prefira peças bem alinhadas, tecidos leves e calçados que permitam celebrar conosco com conforto.",
    image: "/guide-attire-painted-v1.webp",
    alt: "Caricatura com exemplos de trajes esporte fino",
  },
  {
    title: "Cores reservadas",
    text: "Solicitamos gentilmente que não utilizem trajes nas cores branco, off-white, tons de bege e verde-oliva, pois essas cores serão reservadas para os noivos, padrinhos e madrinhas nesse dia tão especial.",
    image: "/guide-colors-painted-v1.webp",
    alt: "Caricatura orientando sobre as cores reservadas para o casamento",
  },
  {
    title: "Registre e celebre",
    text: "Tirem muitas fotos, divirtam-se, celebrem conosco e aproveitem cada momento desse dia tão especial! Sua presença fará parte de uma das lembranças mais bonitas da nossa história.",
    image: "/guide-celebrate-painted-v1.webp",
    alt: "Caricatura dos noivos e convidados fotografando e celebrando juntos",
  },
  {
    title: "Um convite especial para você",
    text: "Este convite foi preparado com muito carinho e é destinado especialmente a você. Por isso, pedimos gentilmente que não leve acompanhantes que não tenham sido informados no ato da confirmação de presença, para que possamos manter a organização e o conforto de todos.",
    image: "/guide-invitation-painted-v1.webp",
    alt: "Caricatura de uma convidada conferindo seu nome na lista da celebração",
  },
  {
    title: "Durante o nosso sim",
    text: "Para vivermos a cerimônia com toda a emoção que ela merece, pedimos que mantenha o celular no silencioso. Depois do nosso sim, as câmeras estão liberadas para registrar cada sorriso.",
    image: "/guide-silent-painted-v1.webp",
    alt: "Caricatura de um convidado colocando o celular no silencioso durante a cerimônia",
  },
];

const MODAL_ASSET_URLS = [
  "/couple-caricature-painted-olive-v2.webp",
  "/menu-rsvp-painted-olive-v2.webp",
  "/menu-gift-painted-olive-v2.webp",
  "/menu-guide-painted-olive-v2.webp",
  ...GIFT_ITEMS.map((gift) => gift.image),
  ...GUIDE_TOPICS.map((topic) => topic.image),
];
const preloadedModalImages: HTMLImageElement[] = [];

function preloadModalAssets() {
  if (preloadedModalImages.length > 0) return;

  MODAL_ASSET_URLS.forEach((src, index) => {
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = index === 0 ? "high" : "low";
    image.onload = () => {
      void image.decode().catch(() => undefined);
    };
    image.src = src;
    preloadedModalImages.push(image);
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTimeLeft() {
  const distance = Math.max(0, WEDDING_DATE - Date.now());
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1_000) % 60),
  };
}

async function createPersonalizedInvitationPdf(
  guestName: string,
  companions: string[],
  familySide: Exclude<FamilySide, null>,
) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const templateResponse = await fetch(
    "/invitation-confirmation-template.pdf?v=20260726-5",
    { cache: "no-store" },
  );
  if (!templateResponse.ok) {
    throw new Error("Não foi possível carregar o convite.");
  }

  const templateBytes = await templateResponse.arrayBuffer();
  const outputDocument = await PDFDocument.create();
  const [invitationTemplate, continuationTemplate] =
    await outputDocument.embedPdf(templateBytes, [0, 1]);
  const timesItalic = await outputDocument.embedFont(
    StandardFonts.TimesRomanItalic,
  );

  const pageWidth = 841.89;
  const pageHeight = 595.276;
  const ink = rgb(67 / 255, 42 / 255, 30 / 255);
  const names = [guestName, ...companions]
    .map((name) => name.trim())
    .filter(Boolean);
  const familyLabel =
    familySide === "groom"
      ? "Família do noivo - Djalma"
      : "Família da noiva - Victoria";
  const formattedNames =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} e ${names[1]}`
        : `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
  const paragraphs = [
    "Queridos convidados,",
    `Com muita alegria, confirmamos a presença de ${formattedNames} em nosso casamento.`,
    `Nosso encontro será no sábado, 31 de outubro de 2026, às 16h20, no Villa Garden, localizado na ${WEDDING_ADDRESS}.`,
    "Esperamos vocês para fazer parte dessa história nesse dia tão especial.",
  ];

  const addTemplatePage = (
    embeddedPage: typeof invitationTemplate,
  ) => {
    const page = outputDocument.addPage([pageWidth, pageHeight]);
    page.drawPage(embeddedPage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
    return page;
  };

  const wrapParagraph = (text: string, maximumWidth: number) => {
    const lines: string[] = [];
    let currentLine = "";
    text.split(/\s+/).forEach((word) => {
      const candidate = `${currentLine} ${word}`.trim();
      if (
        !currentLine ||
        timesItalic.widthOfTextAtSize(candidate, 14) <= maximumWidth
      ) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  const letterLines = paragraphs.flatMap((paragraph, index) => [
    ...wrapParagraph(paragraph, 450),
    ...(index < paragraphs.length - 1 ? [""] : []),
  ]);

  const drawLetterLines = (
    page: ReturnType<typeof addTemplatePage>,
    lines: string[],
    centerX: number,
  ) => {
    lines.forEach((line, index) => {
      if (!line) return;
      const width = timesItalic.widthOfTextAtSize(line, 14);
      page.drawText(line, {
        x: centerX - width / 2,
        y: 382 - index * 21,
        size: 14,
        font: timesItalic,
        color: ink,
      });
    });
  };

  const firstPage = addTemplatePage(invitationTemplate);
  const maximumLinesPerPage = 10;
  drawLetterLines(firstPage, letterLines.slice(0, maximumLinesPerPage), 305);

  let remainingLines = letterLines.slice(maximumLinesPerPage);
  while (remainingLines.length > 0) {
    const page = addTemplatePage(continuationTemplate);
    drawLetterLines(
      page,
      remainingLines.slice(0, maximumLinesPerPage),
      pageWidth / 2,
    );
    remainingLines = remainingLines.slice(maximumLinesPerPage);
  }

  outputDocument.setTitle("Djalma & Victoria - Confirmação de presença");
  outputDocument.setSubject(
    `Casamento em 31 de outubro de 2026, às 16h20, no Villa Garden. ${familyLabel}.`,
  );
  outputDocument.setAuthor("Djalma & Victoria");
  outputDocument.setCreator("Convite de casamento Djalma & Victoria");

  const pdfBytes = await outputDocument.save();
  const blob = new Blob([pdfBytes.slice().buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName =
    guestName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "convidado";
  anchor.href = url;
  anchor.download = `convite-djalma-victoria-${safeName}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function WeddingExperience() {
  const [opening, setOpening] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<
    "convite" | "local" | "mais-detalhes"
  >("convite");
  const [activeModal, setActiveModal] = useState<ModalName>(null);
  const [familySide, setFamilySide] = useState<FamilySide>(null);
  const [guestName, setGuestName] = useState("");
  const [companions, setCompanions] = useState<string[]>([]);
  const [submissionId, setSubmissionId] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [selectedGiftAmount, setSelectedGiftAmount] = useState<number | null>(
    null,
  );
  const [pixCopied, setPixCopied] = useState(false);
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
    if (!open) return;

    const preloadTimer = window.setTimeout(preloadModalAssets, 120);
    return () => window.clearTimeout(preloadTimer);
  }, [open]);

  useEffect(() => {
    const savedConfirmation = window.localStorage.getItem(
      "djalma-victoria-rsvp",
    );
    if (!savedConfirmation) return;

    try {
      const saved = JSON.parse(savedConfirmation) as {
        guestName?: string;
        companions?: string[];
        familySide?: FamilySide;
        submissionId?: string;
      };
      if (
        saved.guestName &&
        Array.isArray(saved.companions) &&
        (saved.familySide === "groom" || saved.familySide === "bride")
      ) {
        // Restores an explicitly device-local confirmation receipt.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGuestName(saved.guestName);
        setCompanions(saved.companions);
        setFamilySide(saved.familySide);
        setSubmissionId(saved.submissionId ?? "");
        setIsConfirmed(Boolean(saved.submissionId));
      }
    } catch {
      window.localStorage.removeItem("djalma-victoria-rsvp");
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const max = window.innerHeight * 1.55;
      setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);

      const marker = window.scrollY + window.innerHeight * 0.52;
      const venueTop = document.getElementById("local")?.offsetTop ?? Infinity;
      const detailsTop =
        document.getElementById("mais-detalhes")?.offsetTop ?? Infinity;

      if (marker >= detailsTop) {
        setActiveSection("mais-detalhes");
      } else if (marker >= venueTop) {
        setActiveSection("local");
      } else {
        setActiveSection("convite");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!activeModal) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveModal(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeModal]);

  const openInvitation = () => {
    if (hasOpened.current) return;
    hasOpened.current = true;
    window.scrollTo(0, 0);
    setOpening(true);
    // Start revealing the invitation just before the zoom settles so there is
    // no perceptible pause between the two scenes.
    window.setTimeout(() => setOpen(true), 820);
  };

  const chooseFamily = (side: Exclude<FamilySide, null>) => {
    setFamilySide(side);
    setDownloadError("");
    setConfirmationError("");
    if (side === "bride") {
      setCompanions((current) => current.slice(0, 1));
    }
  };

  const addCompanion = () => {
    setCompanions((current) => [...current, ""]);
  };

  const updateCompanion = (index: number, value: string) => {
    setCompanions((current) =>
      current.map((companion, companionIndex) =>
        companionIndex === index ? value : companion,
      ),
    );
  };

  const removeCompanion = (index: number) => {
    setCompanions((current) =>
      current.filter((_, companionIndex) => companionIndex !== index),
    );
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedGiftId(null);
    setSelectedGiftAmount(null);
    setPixCopied(false);
    setDownloadError("");
    setConfirmationError("");
  };

  const openGiftList = () => {
    setSelectedGiftId(null);
    setSelectedGiftAmount(null);
    setPixCopied(false);
    setActiveModal("gifts");
  };

  const selectGift = (gift: GiftItem) => {
    setSelectedGiftId(gift.id);
    setSelectedGiftAmount(gift.suggestions[1]);
    setPixCopied(false);
    window.requestAnimationFrame(() => {
      document
        .querySelector(".gift-marketplace")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const selectedGift =
    GIFT_ITEMS.find((gift) => gift.id === selectedGiftId) ?? null;

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(TEMPORARY_PIX_KEY);
      setPixCopied(true);
      window.setTimeout(() => setPixCopied(false), 2400);
    } catch {
      setPixCopied(false);
    }
  };

  const confirmedNames = [guestName, ...companions]
    .map((name) => name.trim())
    .filter(Boolean);
  const confirmedFamily =
    familySide === "groom"
      ? "Família do noivo - Djalma"
      : "Família da noiva - Victoria";
  const calendarDetails = [
    "Casamento de Djalma & Victoria.",
    `Convidados confirmados: ${confirmedNames.join(", ")}.`,
    confirmedFamily,
  ].join("\n");
  const calendarParams = new URLSearchParams({
    action: "TEMPLATE",
    text: "Casamento de Djalma & Victoria",
    dates: "20261031T192000Z/20261101T010000Z",
    details: calendarDetails,
    location: WEDDING_ADDRESS,
    ctz: "America/Fortaleza",
  });
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?${calendarParams.toString()}`;

  const submitConfirmation = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!familySide || !guestName.trim()) return;

    const cleanCompanions = companions
      .map((companion) => companion.trim())
      .filter(Boolean);
    const cleanGuestName = guestName.trim();
    const currentSubmissionId = submissionId || crypto.randomUUID();
    setIsSubmitting(true);
    setConfirmationError("");

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: currentSubmissionId,
          names: [cleanGuestName, ...cleanCompanions],
          category: familySide === "groom" ? "noivo" : "noiva",
        }),
      });
      if (!response.ok) throw new Error();

      setGuestName(cleanGuestName);
      setCompanions(cleanCompanions);
      setSubmissionId(currentSubmissionId);
      setIsConfirmed(true);
      setDownloadError("");
      window.localStorage.setItem(
        "djalma-victoria-rsvp",
        JSON.stringify({
          guestName: cleanGuestName,
          companions: cleanCompanions,
          familySide,
          submissionId: currentSubmissionId,
        }),
      );
    } catch {
      setConfirmationError(
        "Não foi possível salvar sua confirmação agora. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadInvitation = async () => {
    if (!familySide) return;
    setIsDownloading(true);
    setDownloadError("");
    try {
      await createPersonalizedInvitationPdf(
        guestName,
        companions,
        familySide,
      );
    } catch {
      setDownloadError(
        "Não foi possível gerar o convite agora. Tente novamente.",
      );
    } finally {
      setIsDownloading(false);
    }
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
          <div className="invitation-title-lockup">
            <h1>
              <span>Djalma</span>
              <span className="title-ampersand">
                <span
                  className="profile-avatar profile-avatar-djalma"
                  aria-hidden="true"
                >
                  <img src="/djalma-profile-medallion-v2.png" alt="" />
                </span>
                <i>&</i>
                <span
                  className="profile-avatar profile-avatar-victoria"
                  aria-hidden="true"
                >
                  <img src="/victoria-profile-medallion-v2.png" alt="" />
                </span>
              </span>
              <span>Victoria</span>
            </h1>
          </div>
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
            src="/envelope-cutout-olive-v1.png"
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

      <nav className="section-rail" aria-label="Navegação entre seções">
        <a
          className={`section-rail-item${activeSection === "convite" ? " is-active" : ""}`}
          href="#convite"
          aria-current={activeSection === "convite" ? "location" : undefined}
        >
          <span className="section-rail-label">Convite</span>
          <span className="section-rail-icon">
            <img src="/menu-rsvp-painted-olive-v2.webp" alt="" aria-hidden="true" />
          </span>
        </a>
        <a
          className={`section-rail-item${activeSection === "local" ? " is-active" : ""}`}
          href="#local"
          aria-current={activeSection === "local" ? "location" : undefined}
        >
          <span className="section-rail-label">Local</span>
          <span className="section-rail-icon">
            <img src="/google-maps-icon-painted-olive-v2.png" alt="" aria-hidden="true" />
          </span>
        </a>
        <a
          className={`section-rail-item${activeSection === "mais-detalhes" ? " is-active" : ""}`}
          href="#mais-detalhes"
          aria-current={activeSection === "mais-detalhes" ? "location" : undefined}
        >
          <span className="section-rail-label">
            <span className="section-label-desktop">Mais detalhes</span>
            <span className="section-label-mobile">Mais</span>
          </span>
          <span className="section-rail-icon">
            <img src="/menu-guide-painted-olive-v2.webp" alt="" aria-hidden="true" />
          </span>
        </a>
      </nav>

      <div
        id="convite"
        className="garden-scroll-space snap-section"
        aria-hidden="true"
      />

      <section
        id="local"
        className="venue-section snap-section"
        aria-labelledby="venue-title"
      >
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
                src="/map-frame-classic-olive-v1.png"
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
                  <img
                    className="route-icon route-icon-maps"
                    src="/google-maps-icon-painted-olive-v2.png"
                    alt=""
                    aria-hidden="true"
                  />
                  Traçar rota
                </a>
                <a
                  className="route-button route-secondary"
                  href="https://www.waze.com/ul?q=R.%20Dr.%20Rodrigo%20Codes%20Sandoval%2C%2076%20-%20Mondubim%2C%20Fortaleza%20-%20CE%2C%2060711-455&navigate=yes"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    className="route-icon route-icon-waze"
                    src="/waze-icon-painted-olive-v2.png"
                    alt=""
                    aria-hidden="true"
                  />
                  Abrir no Waze
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="mais-detalhes"
        className="menu-section snap-section"
        aria-labelledby="menu-title"
      >
        <img
          className="menu-floral menu-floral-top"
          src="/menu-floral-corner-painted-olive-v1.png"
          alt=""
          aria-hidden="true"
        />
        <img
          className="menu-floral menu-floral-bottom"
          src="/menu-floral-corner-painted-olive-v1.png"
          alt=""
          aria-hidden="true"
        />

        <div className="menu-inner">
          <p className="menu-eyebrow">Tudo para o grande dia</p>
          <h2 id="menu-title">Celebre conosco</h2>
          <div className="menu-ornament" aria-hidden="true">
            <span />
            ✦
            <span />
          </div>
          <p className="menu-intro">
            Reunimos aqui as informações para viver este momento ao nosso lado.
          </p>

          <div className="invitation-menu" aria-label="Opções do convite">
            <button
              className="menu-card"
              type="button"
              onClick={() => setActiveModal("rsvp")}
            >
              <img
                src="/menu-rsvp-painted-olive-v2.webp"
                alt=""
                aria-hidden="true"
              />
              <span>Confirmar presença</span>
              <small>Responder ao convite</small>
              <b aria-hidden="true">→</b>
            </button>

            <button
              className="menu-card"
              type="button"
              onClick={openGiftList}
            >
              <img
                src="/menu-gift-painted-olive-v2.webp"
                alt=""
                aria-hidden="true"
              />
              <span>Lista de presentes</span>
              <small>Escolher um carinho</small>
              <b aria-hidden="true">→</b>
            </button>

            <button
              className="menu-card"
              type="button"
              onClick={() => setActiveModal("guide")}
            >
              <img
                src="/menu-guide-painted-olive-v2.webp"
                alt=""
                aria-hidden="true"
              />
              <span>Manual do convidado</span>
              <small>Ver informações úteis</small>
              <b aria-hidden="true">→</b>
            </button>
          </div>
        </div>
      </section>

      {activeModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className={`wedding-modal wedding-modal-${activeModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${activeModal}-modal-title`}
          >
            <button
              className="modal-close"
              type="button"
              onClick={closeModal}
              aria-label="Fechar"
              autoFocus
            >
              ×
            </button>

            {activeModal === "rsvp" && !isConfirmed && (
              <div className="modal-content">
                <header className="modal-heading">
                  <img
                    src="/menu-rsvp-painted-olive-v2.webp"
                    alt=""
                    aria-hidden="true"
                  />
                  <p>Esperamos você</p>
                  <h2 id="rsvp-modal-title">Confirmar presença</h2>
                  <span aria-hidden="true">✦</span>
                </header>

                <form className="rsvp-form" onSubmit={submitConfirmation}>
                  <label className="form-field">
                    <span>Nome completo</span>
                    <input
                      type="text"
                      name="fullName"
                      autoComplete="name"
                      placeholder="Digite seu nome completo"
                      value={guestName}
                      required
                      onChange={(event) => setGuestName(event.target.value)}
                    />
                  </label>

                  <fieldset className="family-fieldset">
                    <legend>Você é da família de quem?</legend>
                    <div className="family-options">
                      <button
                        className={`family-option${familySide === "groom" ? " is-selected" : ""}`}
                        type="button"
                        onClick={() => chooseFamily("groom")}
                        aria-pressed={familySide === "groom"}
                      >
                        <img
                          src="/family-groom-painted-olive-v1.png"
                          alt=""
                          aria-hidden="true"
                        />
                        <span>Família do noivo</span>
                        <small>Djalma</small>
                      </button>
                      <button
                        className={`family-option${familySide === "bride" ? " is-selected" : ""}`}
                        type="button"
                        onClick={() => chooseFamily("bride")}
                        aria-pressed={familySide === "bride"}
                      >
                        <img
                          src="/family-bride-painted-olive-v1.png"
                          alt=""
                          aria-hidden="true"
                        />
                        <span>Família da noiva</span>
                        <small>Victoria</small>
                      </button>
                    </div>
                  </fieldset>

                  {familySide && (
                    <div className="companion-area">
                      <div className="companion-heading">
                        <div>
                          <span>Acompanhantes</span>
                          <small>
                            {familySide === "groom"
                              ? "Adicione quantos acompanhantes precisar."
                              : "É permitido adicionar um acompanhante."}
                          </small>
                        </div>
                        {(familySide === "groom" ||
                          companions.length === 0) && (
                          <button
                            className="add-companion"
                            type="button"
                            onClick={addCompanion}
                          >
                            <span aria-hidden="true">+</span>
                            Adicionar acompanhante
                          </button>
                        )}
                      </div>

                      {companions.map((companion, index) => (
                        <div className="companion-row" key={index}>
                          <label className="form-field">
                            <span>Nome completo do acompanhante</span>
                            <input
                              type="text"
                              value={companion}
                              placeholder="Digite o nome completo"
                              required
                              onChange={(event) =>
                                updateCompanion(index, event.target.value)
                              }
                            />
                          </label>
                          <button
                            className="remove-companion"
                            type="button"
                            onClick={() => removeCompanion(index)}
                            aria-label={`Remover acompanhante ${index + 1}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    className="modal-primary-action"
                    type="submit"
                    disabled={!familySide || isSubmitting}
                    title={
                      familySide
                        ? undefined
                        : "Selecione a família do noivo ou da noiva"
                    }
                  >
                    {isSubmitting
                      ? "Salvando confirmação..."
                      : "Enviar confirmação"}
                  </button>
                  {confirmationError && (
                    <p className="confirmation-form-error" role="alert">
                      {confirmationError}
                    </p>
                  )}
                </form>
              </div>
            )}

            {activeModal === "rsvp" && isConfirmed && (
              <div className="modal-content confirmation-success">
                <div className="confirmation-layout">
                  <div className="confirmation-intro">
                    <div className="confirmation-mark" aria-hidden="true">
                      ✓
                    </div>
                    <p className="confirmation-eyebrow">
                      Que alegria ter você conosco
                    </p>
                    <h2 id="rsvp-modal-title">Participação confirmada!</h2>
                    <p className="confirmation-message">
                      Sua presença tornará este dia ainda mais especial.
                    </p>
                  </div>

                  <div className="confirmation-details">
                    <div className="confirmation-summary">
                      <span>{confirmedFamily}</span>
                      <strong>{confirmedNames.join(" • ")}</strong>
                    </div>

                    <div className="confirmation-actions">
                      <button
                        className="confirmation-action confirmation-download"
                        type="button"
                        onClick={downloadInvitation}
                        disabled={isDownloading}
                      >
                        <span
                          className="confirmation-action-icon"
                          aria-hidden="true"
                        >
                          ↓
                        </span>
                        <span>
                          <b>
                            {isDownloading
                              ? "Preparando convite"
                              : "Baixar convite"}
                          </b>
                          <small>PDF personalizado</small>
                        </span>
                      </button>

                      <a
                        className="confirmation-action confirmation-calendar"
                        href={googleCalendarUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span
                          className="confirmation-action-icon calendar-icon"
                          aria-hidden="true"
                        >
                          31
                        </span>
                        <span>
                          <b>Criar lembrete</b>
                          <small>Adicionar ao Google Agenda</small>
                        </span>
                      </a>
                    </div>

                    {downloadError && (
                      <p className="download-error" role="alert">
                        {downloadError}
                      </p>
                    )}

                    <button
                      className="edit-confirmation"
                      type="button"
                      onClick={() => setIsConfirmed(false)}
                    >
                      Alterar os nomes confirmados
                    </button>
                  </div>

                  <div className="confirmation-art">
                    <img
                      className="couple-caricature"
                      src="/couple-caricature-painted-olive-v2.webp"
                      decoding="async"
                      fetchPriority="high"
                      alt="Caricatura pintada de Djalma e Victoria entre rosas"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeModal === "gifts" && (
              <div className="modal-content gift-marketplace">
                {!selectedGift && (
                  <>
                    <header className="gift-marketplace-heading">
                      <img
                        src="/menu-gift-painted-olive-v2.webp"
                        alt=""
                        aria-hidden="true"
                      />
                      <div>
                        <p>Um carinho para nossa nova história</p>
                        <h2 id="gifts-modal-title">Lista de presentes</h2>
                        <span aria-hidden="true">✦</span>
                      </div>
                    </header>

                    <p className="gift-marketplace-intro">
                      Escolha uma experiência para fazer parte da nossa
                      aventura. O roteiro continua sendo surpresa.
                    </p>

                    <div
                      className="gift-grid"
                      aria-label="Experiências disponíveis"
                    >
                      {GIFT_ITEMS.map((gift) => (
                        <button
                          className="gift-card"
                          type="button"
                          key={gift.id}
                          onClick={() => selectGift(gift)}
                        >
                          <img
                            src={gift.image}
                            alt=""
                            aria-hidden="true"
                            decoding="async"
                          />
                          <span className="gift-card-copy">
                            <strong>{gift.title}</strong>
                            <em>{gift.description}</em>
                          </span>
                          <span className="gift-card-arrow" aria-hidden="true">
                            →
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {selectedGift && (
                  <div className="gift-detail">
                    <button
                      className="gift-detail-back"
                      type="button"
                      onClick={() => {
                        setSelectedGiftId(null);
                        setSelectedGiftAmount(null);
                        setPixCopied(false);
                        window.requestAnimationFrame(() => {
                          document
                            .querySelector(".gift-marketplace")
                            ?.scrollTo({ top: 0, behavior: "smooth" });
                        });
                      }}
                    >
                      <span aria-hidden="true">←</span> Voltar à lista
                    </button>

                    <div className="gift-detail-layout">
                      <div className="gift-detail-art">
                        <img
                          src={selectedGift.image}
                          alt={`Caricatura de Djalma e Victoria para ${selectedGift.title.toLowerCase()}`}
                          decoding="async"
                        />
                        <span>Uma parte da nossa aventura</span>
                      </div>

                      <div className="gift-detail-copy">
                        <p>Presente escolhido</p>
                        <h2 id="gifts-modal-title">{selectedGift.title}</h2>
                        <p className="gift-detail-description">
                          {selectedGift.detail}
                        </p>

                        <div className="gift-range">
                          <span>Faixa de contribuição</span>
                          <strong>
                            {formatCurrency(selectedGift.minimum)}
                            <i>até</i>
                            {formatCurrency(selectedGift.maximum)}
                          </strong>
                        </div>

                        <fieldset className="gift-values">
                          <legend>Escolha uma sugestão</legend>
                          <div>
                            {selectedGift.suggestions.map((amount) => (
                              <button
                                className={
                                  selectedGiftAmount === amount
                                    ? "is-selected"
                                    : undefined
                                }
                                type="button"
                                key={amount}
                                onClick={() => setSelectedGiftAmount(amount)}
                              >
                                {formatCurrency(amount)}
                              </button>
                            ))}
                          </div>
                        </fieldset>

                        <div className="gift-pix">
                          <div className="gift-pix-data">
                            <span>Chave Pix provisória</span>
                            <code>{TEMPORARY_PIX_KEY}</code>
                            {selectedGiftAmount && (
                              <small>
                                Valor escolhido:{" "}
                                <b>{formatCurrency(selectedGiftAmount)}</b>
                              </small>
                            )}
                            <button type="button" onClick={copyPixKey}>
                              {pixCopied ? "Chave copiada!" : "Copiar chave Pix"}
                            </button>
                            <em aria-live="polite">
                              Dados fictícios para demonstração.
                            </em>
                          </div>

                          <div className="gift-qr">
                            <img
                              src="/pix-qr-placeholder.svg"
                              alt="QR code Pix fictício para demonstração"
                            />
                            <span>QR provisório</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeModal === "guide" && (
              <div className="modal-content guest-guide">
                <header className="guest-guide-heading">
                  <img
                    src="/menu-guide-painted-olive-v2.webp"
                    alt=""
                    aria-hidden="true"
                  />
                  <p>Para aproveitar cada momento</p>
                  <h2 id="guide-modal-title">Manual do convidado</h2>
                  <span aria-hidden="true">✦</span>
                  <p className="guest-guide-intro">
                    Preparamos este pequeno manual com carinho para que nosso
                    dia seja leve, organizado e inesquecível para todos.
                  </p>
                </header>

                <div className="guest-guide-list">
                  {GUIDE_TOPICS.map((topic, index) => (
                    <article className="guest-guide-card" key={topic.title}>
                      <div className="guest-guide-art">
                        <img
                          src={topic.image}
                          alt={topic.alt}
                          decoding="async"
                        />
                        <span aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="guest-guide-copy">
                        <small>Um cuidado para o grande dia</small>
                        <h3>{topic.title}</h3>
                        <p>{topic.text}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <footer className="guest-guide-closing">
                  <img
                    src="/guide-thanks-painted-v1.webp"
                    alt="Caricatura de Djalma e Victoria agradecendo aos convidados"
                    decoding="async"
                  />
                  <div>
                    <span aria-hidden="true">✦</span>
                    <p>
                      Agradecemos pela compreensão e mal podemos esperar para
                      celebrar esse grande dia ao lado de vocês!
                    </p>
                    <small>Com carinho,</small>
                    <strong>Djalma &amp; Victoria</strong>
                  </div>
                </footer>

                <button
                  className="modal-secondary-action guest-guide-back"
                  type="button"
                  onClick={closeModal}
                >
                  Voltar ao convite
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
