"use client";

import { useEffect, useRef, useState } from "react";
import { GIFT_ITEMS, type GiftItem } from "../lib/gifts";

const WEDDING_DATE = new Date("2026-10-31T16:30:00-03:00").getTime();

type ModalName = "rsvp" | "gifts" | "guide" | null;
type FamilySide = "groom" | "bride" | null;
type PixPayment = {
  orderId: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string | null;
  expiresAt: string | null;
};
type GuideTopic = {
  title: string;
  text: string;
  image: string;
  alt: string;
};

const WEDDING_ADDRESS =
  "R. Dr. Rodrigo Codes Sandoval, 76 - Mondubim, Fortaleza - CE, 60711-455";

const MUSIC_START_TIME = 2.95;
const MUSIC_INITIAL_VOLUME = 0.11;
const MUSIC_TARGET_VOLUME = 0.26;

const GUIDE_TOPICS: GuideTopic[] = [
  {
    title: "Confirme sua presença",
    text: "Pedimos, com muito carinho, que confirme sua presença até o dia 22 de agosto de 2026. Assim, poderemos organizar cada detalhe da melhor maneira e garantir o conforto de todos durante a celebração.",
    image: "/guide-rsvp-painted-v4.png",
    alt: "Caricatura de Djalma e Victoria recebendo uma confirmação de presença",
  },
  {
    title: "Chegue com tranquilidade",
    text: "Nossa cerimônia terá início pontualmente às 17:00. Para que todos possam se acomodar com tranquilidade e acompanhar esse momento desde o início, pedimos a gentileza de chegar por volta das 16:30, evitando atrasos.",
    image: "/guide-arrival-painted-v2.webp",
    alt: "Caricatura dos convidados chegando com antecedência à cerimônia",
  },
  {
    title: "Traje: esporte fino",
    text: "Escolhemos o esporte fino para unir elegância e conforto nesse dia tão especial. Para os homens, o paletó não é obrigatório; uma camisa social bem escolhida já compõe o traje com elegância. Prefira peças bem alinhadas, tecidos leves e calçados confortáveis para celebrar conosco.",
    image: "/guide-attire-painted-v2.webp",
    alt: "Caricatura com exemplos de trajes esporte fino",
  },
  {
    title: "Cores reservadas",
    text: "Solicitamos gentilmente que não utilizem trajes nas cores branco, off-white, tons de bege e verde-oliva, pois essa paleta foi reservada para os noivos e para os elementos da decoração que darão vida ao nosso dia tão especial.",
    image: "/guide-colors-painted-v2.webp",
    alt: "Caricatura orientando sobre as cores reservadas para o casamento",
  },
  {
    title: "Sobre as bebidas",
    text: "Com carinho, informamos que não haverá serviço de bebidas alcoólicas durante o evento. Caso deseje brindar conosco com sua bebida de preferência, fique à vontade para levá-la. Também será permitida a entrada de gelo e cooler, para que tudo permaneça bem acondicionado durante a celebração.",
    image: "/guide-drinks-painted-v1.png",
    alt: "Caricatura de um convidado chegando à celebração com bebida, gelo e cooler",
  },
  {
    title: "Registre e celebre",
    text: "Tirem muitas fotos, divirtam-se, celebrem conosco e aproveitem cada momento desse dia tão especial! Sua presença fará parte de uma das lembranças mais bonitas da nossa história.",
    image: "/guide-celebrate-painted-v2.webp",
    alt: "Caricatura dos noivos e convidados fotografando e celebrando juntos",
  },
  {
    title: "Um convite especial para você",
    text: "Este convite foi preparado com muito carinho e é destinado especialmente a você. Por isso, pedimos gentilmente que não leve acompanhantes que não tenham sido informados no ato da confirmação de presença, para que possamos manter a organização e o conforto de todos.",
    image: "/guide-invitation-painted-v2.webp",
    alt: "Caricatura de uma convidada conferindo seu nome na lista da celebração",
  },
  {
    title: "Durante o nosso sim",
    text: "Para vivermos a celebração com toda a emoção que ela merece, pedimos apenas que mantenha o celular no silencioso. Fique à vontade para tirar fotos e filmar os momentos que desejar.",
    image: "/guide-silent-painted-v2.webp",
    alt: "Caricatura de um convidado colocando o celular no silencioso durante a cerimônia",
  },
];

const CORE_ASSET_URLS = [
  "/garden-painted-olive-v1.png",
  "/envelope-floral-background-olive-v1.png",
  "/envelope-cutout-olive-v1.png",
  "/djalma-profile-medallion-v2.png",
  "/victoria-profile-medallion-v2.png",
  "/map-frame-classic-olive-v1.png",
  "/menu-floral-corner-painted-olive-v1.png",
  "/menu-rsvp-painted-olive-v1.png",
  "/menu-gift-painted-olive-v1.png",
  "/menu-guide-painted-olive-v1.png",
  "/google-maps-icon-painted-olive-v2.png",
  "/waze-icon-painted-olive-v2.png",
];

const MODAL_ASSET_GROUPS: Record<Exclude<ModalName, null>, string[]> = {
  rsvp: [
    "/menu-rsvp-painted-olive-v1.png",
    "/family-groom-painted-olive-v1.png",
    "/family-bride-painted-olive-v1.png",
    "/couple-caricature-painted-olive-v1.png",
  ],
  gifts: [
    "/menu-gift-painted-olive-v1.png",
    ...GIFT_ITEMS.map((gift) => gift.image),
  ],
  guide: [
    "/menu-guide-painted-olive-v1.png",
    ...GUIDE_TOPICS.map((topic) => topic.image),
    "/guide-thanks-painted-v2.webp",
  ],
};

const imageLoadCache = new Map<string, Promise<void>>();

function preloadImage(
  src: string,
  priority: "high" | "low" = "low",
): Promise<void> {
  const cached = imageLoadCache.get(src);
  if (cached) return cached;

  const request = new Promise<void>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = priority;
    image.onload = () => {
      void image
        .decode()
        .catch(() => undefined)
        .finally(resolve);
    };
    image.onerror = () => resolve();
    image.src = src;
  });

  imageLoadCache.set(src, request);
  return request;
}

function preloadImages(
  sources: string[],
  priority: "high" | "low" = "low",
) {
  return Promise.all(sources.map((src) => preloadImage(src, priority))).then(
    () => undefined,
  );
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
    `Nosso encontro será no sábado, 31 de outubro de 2026, às 16h30, no Villa Garden, localizado na ${WEDDING_ADDRESS}.`,
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
    `Casamento em 31 de outubro de 2026, às 16h30, no Villa Garden. ${familyLabel}.`,
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<
    "convite" | "local" | "mais-detalhes"
  >("convite");
  const [activeModal, setActiveModal] = useState<ModalName>(null);
  const [modalAssetsReady, setModalAssetsReady] = useState(true);
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
  const [giftDonorName, setGiftDonorName] = useState("");
  const [giftDonorEmail, setGiftDonorEmail] = useState("");
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null);
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [pixError, setPixError] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const hasOpened = useRef(false);
  const modalLoadRequest = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicFadeFrame = useRef<number | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void preloadImages(CORE_ASSET_URLS, "high").finally(() => {
      if (isCurrent) setIsInitialLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const prepareOpening = () => {
      if (audio.currentTime < MUSIC_START_TIME) {
        audio.currentTime = MUSIC_START_TIME;
      }
    };

    audio.load();
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      prepareOpening();
    } else {
      audio.addEventListener("loadedmetadata", prepareOpening, { once: true });
    }

    return () => audio.removeEventListener("loadedmetadata", prepareOpening);
  }, []);

  useEffect(() => {
    const updateCountdown = () => setTimeLeft(getTimeLeft());
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(
    () => () => {
      if (musicFadeFrame.current !== null) {
        window.cancelAnimationFrame(musicFadeFrame.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;

    const modalSources = Object.values(MODAL_ASSET_GROUPS).flat();
    const preloadTimer = window.setTimeout(() => {
      void preloadImages(modalSources);
    }, 300);
    return () => window.clearTimeout(preloadTimer);
  }, [open]);

  useEffect(() => {
    if (
      activeModal !== "gifts" ||
      !pixPayment ||
      !["pending", "in_process", "authorized"].includes(pixPayment.status)
    ) {
      return;
    }

    let isCurrent = true;
    const checkPayment = async () => {
      try {
        const response = await fetch(
          `/api/gifts/pix?orderId=${encodeURIComponent(pixPayment.orderId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const data = (await response.json()) as { status?: string };
        if (isCurrent && data.status) {
          setPixPayment((current) =>
            current && current.status !== data.status
              ? { ...current, status: data.status as string }
              : current,
          );
        }
      } catch {
        // A temporary polling error does not invalidate the QR code.
      }
    };

    const timer = window.setInterval(() => void checkPayment(), 5_000);
    void checkPayment();
    return () => {
      isCurrent = false;
      window.clearInterval(timer);
    };
  }, [activeModal, pixPayment]);

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
      if (event.key === "Escape") {
        modalLoadRequest.current += 1;
        setModalAssetsReady(true);
        setActiveModal(null);
      }
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

    const audio = audioRef.current;
    if (audio) {
      if (musicFadeFrame.current !== null) {
        window.cancelAnimationFrame(musicFadeFrame.current);
      }
      audio.currentTime = MUSIC_START_TIME;
      audio.muted = false;
      audio.volume = MUSIC_INITIAL_VOLUME;
      setMusicMuted(false);

      void audio
        .play()
        .then(() => {
          const startedAt = window.performance.now();
          const fadeDuration = 900;
          const fadeIn = (now: number) => {
            const progress = Math.min((now - startedAt) / fadeDuration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            audio.volume =
              MUSIC_INITIAL_VOLUME +
              (MUSIC_TARGET_VOLUME - MUSIC_INITIAL_VOLUME) * easedProgress;
            if (progress < 1) {
              musicFadeFrame.current = window.requestAnimationFrame(fadeIn);
            } else {
              musicFadeFrame.current = null;
            }
          };
          musicFadeFrame.current = window.requestAnimationFrame(fadeIn);
        })
        .catch(() => undefined);
    }

    // Start revealing the invitation just before the zoom settles so there is
    // no perceptible pause between the two scenes.
    window.setTimeout(() => setOpen(true), 820);
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    const nextMuted = !musicMuted;
    setMusicMuted(nextMuted);

    if (!audio) return;
    audio.muted = nextMuted;
    if (!nextMuted) {
      void audio.play().catch(() => undefined);
    }
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

  const openModal = (modal: Exclude<ModalName, null>) => {
    const requestId = modalLoadRequest.current + 1;
    modalLoadRequest.current = requestId;
    setModalAssetsReady(false);
    setActiveModal(modal);

    void preloadImages(MODAL_ASSET_GROUPS[modal], "high").finally(() => {
      if (modalLoadRequest.current === requestId) {
        setModalAssetsReady(true);
      }
    });
  };

  const closeModal = () => {
    modalLoadRequest.current += 1;
    setModalAssetsReady(true);
    setActiveModal(null);
    setSelectedGiftId(null);
    setSelectedGiftAmount(null);
    setPixPayment(null);
    setPixError("");
    setIsCreatingPix(false);
    setPixCopied(false);
    setDownloadError("");
    setConfirmationError("");
  };

  const openGiftList = () => {
    setSelectedGiftId(null);
    setSelectedGiftAmount(null);
    setPixPayment(null);
    setPixError("");
    setPixCopied(false);
    openModal("gifts");
  };

  const selectGift = (gift: GiftItem) => {
    setSelectedGiftId(gift.id);
    setSelectedGiftAmount(gift.suggestions[1]);
    setPixPayment(null);
    setPixError("");
    setPixCopied(false);
    window.requestAnimationFrame(() => {
      document
        .querySelector(".gift-marketplace")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const selectedGift =
    GIFT_ITEMS.find((gift) => gift.id === selectedGiftId) ?? null;
  const pixIsPending =
    pixPayment &&
    ["pending", "in_process", "authorized"].includes(pixPayment.status);

  const resetPixPayment = () => {
    setPixPayment(null);
    setPixError("");
    setPixCopied(false);
  };

  const copyPixCode = async () => {
    if (!pixPayment?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pixPayment.qrCode);
      setPixCopied(true);
      window.setTimeout(() => setPixCopied(false), 2400);
    } catch {
      setPixCopied(false);
    }
  };

  const createPixPayment = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!selectedGift || !selectedGiftAmount) return;

    setIsCreatingPix(true);
    setPixError("");
    setPixPayment(null);
    setPixCopied(false);
    try {
      const response = await fetch("/api/gifts/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId: selectedGift.id,
          amount: selectedGiftAmount,
          donorName: giftDonorName.trim(),
          donorEmail: giftDonorEmail.trim(),
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | (PixPayment & { error?: string })
        | null;
      if (!response.ok || !data?.orderId) {
        throw new Error(
          data?.error || "Não foi possível gerar o Pix agora.",
        );
      }
      setPixPayment(data);
    } catch (error) {
      setPixError(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o Pix agora.",
      );
    } finally {
      setIsCreatingPix(false);
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
    dates: "20261031T193000Z/20261101T010000Z",
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
    transform: `scale(${(opening ? 1.04 : 1.24) + progress * 0.42}) translateY(${progress * 3.5}%)`,
  };

  return (
    <main
      className={`storybook${opening ? " is-opening" : ""}${open ? " is-open" : ""}`}
    >
      <audio
        ref={audioRef}
        src="/salut-damour-elgar.mp3"
        preload="auto"
        loop
        aria-hidden="true"
      />
      {isInitialLoading && (
        <div
          className="quality-loader quality-loader-site"
          role="status"
          aria-live="polite"
          aria-label="Carregando o convite em alta resolução"
        >
          <div className="quality-loader-card">
            <span className="quality-loader-seal" aria-hidden="true">
              D&amp;V
            </span>
            <strong>Preparando nosso convite</strong>
            <small>Carregando cada detalhe em alta resolução…</small>
            <i aria-hidden="true" />
          </div>
        </div>
      )}

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
              <strong>16:30</strong>
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
            <img src="/menu-rsvp-painted-olive-v1.png" alt="" aria-hidden="true" />
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
            <img src="/menu-guide-painted-olive-v1.png" alt="" aria-hidden="true" />
          </span>
        </a>
      </nav>

      <div className="music-controller">
        <button
          type="button"
          className={`music-control${musicMuted ? " is-muted" : ""}`}
          onClick={toggleMusic}
          aria-label={
            musicMuted
              ? "Ativar música do convite"
              : "Silenciar música do convite"
          }
          aria-pressed={musicMuted}
          title={
            musicMuted
              ? "Ativar Salut d’Amour"
              : "Silenciar Salut d’Amour"
          }
        >
          <img
            className="music-control-icon"
            src={
              musicMuted
                ? "/sound-muted-painted-olive-v1.png"
                : "/sound-on-painted-olive-v1.png"
            }
            alt=""
            aria-hidden="true"
          />
          <span className="visually-hidden">
            Salut d’Amour, de Edward Elgar, interpretada por Emanuel Salvador
            e Pau Casan, sob licença Creative Commons Attribution 3.0.
          </span>
        </button>
      </div>

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
              onClick={() => openModal("rsvp")}
            >
              <img
                src="/menu-rsvp-painted-olive-v1.png"
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
                src="/menu-gift-painted-olive-v1.png"
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
              onClick={() => openModal("guide")}
            >
              <img
                src="/menu-guide-painted-olive-v1.png"
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

            {!modalAssetsReady && (
              <div
                className="quality-loader quality-loader-modal"
                role="status"
                aria-live="polite"
              >
                <div className="quality-loader-card">
                  <span className="quality-loader-seal" aria-hidden="true">
                    D&amp;V
                  </span>
                  <strong>Preparando os detalhes</strong>
                  <small>Carregando as ilustrações em alta resolução…</small>
                  <i aria-hidden="true" />
                </div>
              </div>
            )}

            {activeModal === "rsvp" && !isConfirmed && (
              <div className="modal-content">
                <header className="modal-heading">
                  <img
                    src="/menu-rsvp-painted-olive-v1.png"
                    alt=""
                    aria-hidden="true"
                  />
                  <p>Esperamos você</p>
                  <h2 id="rsvp-modal-title">Confirmar presença</h2>
                  <span aria-hidden="true">✦</span>
                  <p className="rsvp-deadline">
                    Para prepararmos cada detalhe com carinho, pedimos que sua
                    presença seja confirmada até o dia 22 de agosto de 2026.
                  </p>
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
                      src="/couple-caricature-painted-olive-v1.png"
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
                        src="/menu-gift-painted-olive-v1.png"
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
                          setPixPayment(null);
                          setPixError("");
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
                                onClick={() => {
                                  setSelectedGiftAmount(amount);
                                  resetPixPayment();
                                }}
                              >
                                {formatCurrency(amount)}
                              </button>
                            ))}
                          </div>
                        </fieldset>

                        {!pixPayment && (
                          <form
                            className="gift-pix-form"
                            onSubmit={createPixPayment}
                          >
                            <div className="gift-pix-form-heading">
                              <span>Gerar Pix</span>
                              <strong>
                                {selectedGiftAmount
                                  ? formatCurrency(selectedGiftAmount)
                                  : ""}
                              </strong>
                            </div>
                            <label>
                              <span>Seu nome</span>
                              <input
                                type="text"
                                autoComplete="name"
                                maxLength={120}
                                required
                                value={giftDonorName}
                                onChange={(event) =>
                                  setGiftDonorName(event.target.value)
                                }
                                placeholder="Nome completo"
                              />
                            </label>
                            <label>
                              <span>Seu e-mail</span>
                              <input
                                type="email"
                                autoComplete="email"
                                maxLength={180}
                                required
                                value={giftDonorEmail}
                                onChange={(event) =>
                                  setGiftDonorEmail(event.target.value)
                                }
                                placeholder="voce@exemplo.com"
                              />
                            </label>
                            <small>
                              O e-mail é usado somente para gerar e identificar
                              esta contribuição.
                            </small>
                            {pixError && (
                              <p className="gift-pix-error" role="alert">
                                {pixError}
                              </p>
                            )}
                            <button type="submit" disabled={isCreatingPix}>
                              {isCreatingPix
                                ? "Gerando Pix..."
                                : "Gerar QR Code Pix"}
                            </button>
                          </form>
                        )}

                        {pixPayment && (
                          <div
                            className={`gift-pix gift-pix-${pixPayment.status}`}
                          >
                            {pixPayment.status === "approved" ? (
                              <div className="gift-pix-success" role="status">
                                <span aria-hidden="true">✓</span>
                                <div>
                                  <strong>Presente confirmado!</strong>
                                  <p>
                                    Recebemos seu carinho. Muito obrigado por
                                    fazer parte da nossa história.
                                  </p>
                                </div>
                              </div>
                            ) : pixIsPending ? (
                              <>
                                <div className="gift-pix-data">
                                  <span>Pix Copia e Cola</span>
                                  <small>
                                    Valor:{" "}
                                    <b>
                                      {selectedGiftAmount
                                        ? formatCurrency(selectedGiftAmount)
                                        : ""}
                                    </b>
                                  </small>
                                  <button type="button" onClick={copyPixCode}>
                                    {pixCopied
                                      ? "Código copiado!"
                                      : "Copiar código Pix"}
                                  </button>
                                  {pixPayment.ticketUrl && (
                                    <a
                                      href={pixPayment.ticketUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Abrir página de pagamento
                                    </a>
                                  )}
                                  <em aria-live="polite">
                                    Aguardando a confirmação do pagamento…
                                  </em>
                                </div>

                                <div className="gift-qr">
                                  <img
                                    src={`data:image/png;base64,${pixPayment.qrCodeBase64}`}
                                    alt={`QR Code Pix no valor de ${
                                      selectedGiftAmount
                                        ? formatCurrency(selectedGiftAmount)
                                        : ""
                                    }`}
                                  />
                                  <span>Escaneie para pagar</span>
                                </div>
                              </>
                            ) : (
                              <div className="gift-pix-failed" role="alert">
                                <strong>Este Pix não está mais disponível.</strong>
                                <p>
                                  Gere um novo QR Code para concluir o presente.
                                </p>
                              </div>
                            )}
                            {pixPayment.status !== "approved" && (
                              <button
                                className="gift-pix-change"
                                type="button"
                                onClick={resetPixPayment}
                              >
                                Alterar dados ou valor
                              </button>
                            )}
                          </div>
                        )}
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
                    src="/menu-guide-painted-olive-v1.png"
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
                      </div>
                      <div className="guest-guide-copy">
                        <div className="guest-guide-kicker">
                          <span aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <small>Um cuidado para o grande dia</small>
                        </div>
                        <h3>{topic.title}</h3>
                        <p>{topic.text}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <footer className="guest-guide-closing">
                  <img
                    src="/guide-thanks-painted-v2.webp"
                    alt="Caricatura de Djalma e Victoria agradecendo aos convidados"
                    decoding="async"
                  />
                  <div>
                    <span aria-hidden="true">✦</span>
                    <p>
                      Agradecemos pela compreensão e esperamos você para
                      celebrar esse grande dia ao nosso lado!
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
