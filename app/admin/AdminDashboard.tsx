"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPlanningTools } from "./AdminPlanningTools";

type GuestCategory = "noivo" | "noiva";
type AdminPage = "convidados" | "organizacao" | "financeiro";

type GuestRecord = {
  id: string;
  submissionId: string;
  name: string;
  category: GuestCategory;
  isPrimary: boolean;
  createdAt: string;
};

type InvitedGuestRecord = {
  id: string;
  firstName: string;
  normalizedFirstName: string;
  matchedGuestId: string | null;
  createdAt: string;
};

type GiftPaymentRecord = {
  id: string;
  mercadoPagoOrderId: string;
  mercadoPagoPaymentId: string | null;
  giftTitle: string;
  donorName: string;
  donorEmail: string;
  amountCents: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
};

type ServiceProviderRecord = {
  id: string;
  name: string;
  role: string;
  createdAt: string;
};

function normalizeName(value: string, maximumParts = Number.POSITIVE_INFINITY) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, maximumParts)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function fortalezaCalendarDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(value("year"), value("month") - 1, value("day"));
}

async function readResponseError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

export function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [invitedGuests, setInvitedGuests] = useState<InvitedGuestRecord[]>([]);
  const [giftPayments, setGiftPayments] = useState<GiftPaymentRecord[]>([]);
  const [deletingGiftId, setDeletingGiftId] = useState<string | null>(null);
  const [giftDeleteError, setGiftDeleteError] = useState("");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"todos" | GuestCategory>("todos");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editingGuestName, setEditingGuestName] = useState("");
  const [editingGuestBusy, setEditingGuestBusy] = useState(false);
  const [editingGuestError, setEditingGuestError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [providerCount, setProviderCount] = useState(0);
  const [activePage, setActivePage] = useState<AdminPage>("convidados");
  const [daysUntilWedding, setDaysUntilWedding] = useState<number | null>(null);
  const [invitedNamesDraft, setInvitedNamesDraft] = useState("");
  const [invitedBusy, setInvitedBusy] = useState(false);
  const [invitedError, setInvitedError] = useState("");
  const [deletingInvitedId, setDeletingInvitedId] = useState<string | null>(null);
  const [linkingInvitedId, setLinkingInvitedId] = useState<string | null>(null);
  const [linkSearch, setLinkSearch] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState("");

  const loadGuests = useCallback(async () => {
    try {
      const [guestResponse, invitedResponse, giftResponse, providerResponse] = await Promise.all([
        fetch("/api/admin/guests", { cache: "no-store" }),
        fetch("/api/admin/invited-guests", { cache: "no-store" }),
        fetch("/api/admin/gift-payments", { cache: "no-store" }),
        fetch("/api/admin/providers", { cache: "no-store" }),
      ]);
      if (
        guestResponse.status === 401 ||
        invitedResponse.status === 401 ||
        giftResponse.status === 401 ||
        providerResponse.status === 401
      ) {
        setAuthenticated(false);
        setGuests([]);
        setInvitedGuests([]);
        setGiftPayments([]);
        return;
      }
      if (
        !guestResponse.ok ||
        !invitedResponse.ok ||
        !giftResponse.ok ||
        !providerResponse.ok
      ) throw new Error();
      const guestData = (await guestResponse.json()) as {
        guests?: GuestRecord[];
      };
      const giftData = (await giftResponse.json()) as {
        payments?: GiftPaymentRecord[];
      };
      const invitedData = (await invitedResponse.json()) as {
        invitedGuests?: InvitedGuestRecord[];
      };
      const providerData = (await providerResponse.json()) as {
        providers?: Array<{ id: string }>;
      };
      setGuests(guestData.guests ?? []);
      setInvitedGuests(invitedData.invitedGuests ?? []);
      setGiftPayments(giftData.payments ?? []);
      setProviderCount(providerData.providers?.length ?? 0);
      setAuthenticated(true);
    } catch {
      setLoginError("Não foi possível carregar as confirmações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Loads the server-backed list after the client session cookie is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadGuests();
  }, [loadGuests]);

  useEffect(() => {
    const syncPageFromUrl = () => {
      const page = new URL(window.location.href).searchParams.get("pagina");
      if (page === "organizacao" || page === "financeiro" || page === "convidados") {
        setActivePage(page);
      } else {
        setActivePage("convidados");
      }
    };

    syncPageFromUrl();
    window.addEventListener("popstate", syncPageFromUrl);
    return () => window.removeEventListener("popstate", syncPageFromUrl);
  }, []);

  const navigateToPage = (page: AdminPage) => {
    if (page === activePage) return;
    const url = new URL(window.location.href);
    url.searchParams.set("pagina", page);
    window.history.pushState({}, "", url);
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const updateCountdown = () => {
      setDaysUntilWedding(
        Math.max(
          0,
          Math.round(
            (Date.UTC(2026, 9, 31) - fortalezaCalendarDay(new Date())) /
              86_400_000,
          ),
        ),
      );
    };
    const initialTimer = window.setTimeout(updateCountdown, 0);
    const interval = window.setInterval(updateCountdown, 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);

  const filteredGuests = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return guests.filter(
      (guest) =>
        (category === "todos" || guest.category === category) &&
        (!normalizedSearch ||
          guest.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch)),
    );
  }, [category, guests, search]);

  const totals = useMemo(
    () => ({
      all: guests.length,
      noivo: guests.filter((guest) => guest.category === "noivo").length,
      noiva: guests.filter((guest) => guest.category === "noiva").length,
    }),
    [guests],
  );

  const invitedRoster = useMemo(() => {
    const matchesByInvitation = new Map<string, GuestRecord>();
    const matchSources = new Map<string, "manual" | "automatico">();
    const manuallyMatchedGuestIds = new Set<string>();

    invitedGuests.forEach((invitedGuest) => {
      if (!invitedGuest.matchedGuestId) return;
      const matchedGuest = guests.find(
        (guest) => guest.id === invitedGuest.matchedGuestId,
      );
      if (!matchedGuest || manuallyMatchedGuestIds.has(matchedGuest.id)) return;
      matchesByInvitation.set(invitedGuest.id, matchedGuest);
      matchSources.set(invitedGuest.id, "manual");
      manuallyMatchedGuestIds.add(matchedGuest.id);
    });

    const availableGuests = guests.filter(
      (guest) => !manuallyMatchedGuestIds.has(guest.id),
    );

    [...invitedGuests]
      .filter((invitedGuest) => !matchesByInvitation.has(invitedGuest.id))
      .sort((first, second) => {
        const firstParts = first.normalizedFirstName.split(/\s+/).filter(Boolean).length;
        const secondParts = second.normalizedFirstName.split(/\s+/).filter(Boolean).length;
        return secondParts - firstParts;
      })
      .forEach((invitedGuest) => {
        const referenceParts = invitedGuest.normalizedFirstName
          .split(/\s+/)
          .filter(Boolean).length;
        const matchIndex = availableGuests.findIndex(
          (guest) =>
            normalizeName(guest.name, referenceParts) ===
            invitedGuest.normalizedFirstName,
        );

        if (matchIndex >= 0) {
          const [matchedGuest] = availableGuests.splice(matchIndex, 1);
          matchesByInvitation.set(invitedGuest.id, matchedGuest);
          matchSources.set(invitedGuest.id, "automatico");
        }
      });

    return invitedGuests.map((invitedGuest) => {
      return {
        ...invitedGuest,
        matchedGuest: matchesByInvitation.get(invitedGuest.id) ?? null,
        matchSource: matchSources.get(invitedGuest.id) ?? null,
      };
    });
  }, [guests, invitedGuests]);

  const invitedMatchedCount = invitedRoster.filter((item) => item.matchedGuest).length;
  const invitedPendingCount = invitedRoster.length - invitedMatchedCount;
  const invitedProgress = invitedRoster.length
    ? Math.round((invitedMatchedCount / invitedRoster.length) * 100)
    : 0;

  const linkingInvited = invitedRoster.find(
    (item) => item.id === linkingInvitedId,
  ) ?? null;
  const filteredLinkGuests = useMemo(() => {
    const normalizedSearch = normalizeName(linkSearch);
    return [...guests]
      .filter(
        (guest) =>
          !normalizedSearch || normalizeName(guest.name).includes(normalizedSearch),
      )
      .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));
  }, [guests, linkSearch]);
  const editingGuest = guests.find((guest) => guest.id === editingGuestId) ?? null;

  useEffect(() => {
    if (!linkingInvitedId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !linkBusy) {
        setLinkingInvitedId(null);
        setLinkSearch("");
        setLinkError("");
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [linkBusy, linkingInvitedId]);

  useEffect(() => {
    if (!editingGuestId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !editingGuestBusy) {
        setEditingGuestId(null);
        setEditingGuestName("");
        setEditingGuestError("");
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [editingGuestBusy, editingGuestId]);

  const occupiedSpots = totals.all + providerCount;

  const giftTotals = useMemo(() => {
    const approved = giftPayments.filter(
      (payment) => payment.status === "approved",
    );
    return {
      approved: approved.length,
      pending: giftPayments.filter((payment) =>
        ["pending", "in_process", "authorized"].includes(payment.status),
      ).length,
      receivedCents: approved.reduce(
        (total, payment) => total + payment.amountCents,
        0,
      ),
    };
  }, [giftPayments]);

  const formatCurrency = (amountCents: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amountCents / 100);

  const paymentStatusLabel = (status: string) => {
    if (status === "approved") return "Pago";
    if (["pending", "in_process", "authorized"].includes(status)) {
      return "Aguardando";
    }
    if (status === "refunded") return "Reembolsado";
    if (status === "cancelled") return "Expirado/cancelado";
    return "Não concluído";
  };

  const canDeleteGiftPayment = (status: string) =>
    ["pending", "in_process", "authorized", "cancelled"].includes(status);

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setLoginError("Senha incorreta. Tente novamente.");
        return;
      }
      setPassword("");
      await loadGuests();
    } catch {
      setLoginError("Não foi possível entrar agora.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setGuests([]);
    setInvitedGuests([]);
    setGiftPayments([]);
  };

  const addInvitedNames = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const names = invitedNamesDraft
      .split(/[\n,;]+/)
      .map((name) => name.trim())
      .filter(Boolean);
    if (names.length === 0) {
      setInvitedError("Digite ao menos um nome.");
      return;
    }
    setInvitedBusy(true);
    setInvitedError("");
    try {
      const response = await fetch("/api/admin/invited-guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names }),
      });
      if (!response.ok) {
        throw new Error(await readResponseError(response, "Não foi possível adicionar os nomes."));
      }
      const data = (await response.json()) as { invitedGuests: InvitedGuestRecord[] };
      setInvitedGuests((current) =>
        [...current, ...data.invitedGuests].sort((a, b) =>
          a.firstName.localeCompare(b.firstName, "pt-BR"),
        ),
      );
      setInvitedNamesDraft("");
    } catch (cause) {
      setInvitedError(cause instanceof Error ? cause.message : "Não foi possível adicionar os nomes.");
    } finally {
      setInvitedBusy(false);
    }
  };

  const removeInvitedName = async (item: InvitedGuestRecord) => {
    if (!window.confirm(`Remover ${item.firstName} da lista de convidados esperados?`)) return;
    setDeletingInvitedId(item.id);
    try {
      const response = await fetch(
        `/api/admin/invited-guests?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        setInvitedGuests((current) => current.filter((entry) => entry.id !== item.id));
      }
    } finally {
      setDeletingInvitedId(null);
    }
  };

  const openGuestLinker = (item: InvitedGuestRecord) => {
    setLinkingInvitedId(item.id);
    setLinkSearch("");
    setLinkError("");
  };

  const closeGuestLinker = () => {
    if (linkBusy) return;
    setLinkingInvitedId(null);
    setLinkSearch("");
    setLinkError("");
  };

  const saveInvitedGuestLink = async (guestId: string | null) => {
    if (!linkingInvited) return;
    setLinkBusy(true);
    setLinkError("");
    try {
      const response = await fetch("/api/admin/invited-guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: linkingInvited.id, guestId }),
      });
      if (!response.ok) {
        throw new Error(
          await readResponseError(response, "Não foi possível salvar o vínculo."),
        );
      }
      const data = (await response.json()) as {
        invitedGuest: InvitedGuestRecord;
      };
      setInvitedGuests((current) =>
        current.map((item) =>
          item.id === data.invitedGuest.id ? data.invitedGuest : item,
        ),
      );
      setLinkingInvitedId(null);
      setLinkSearch("");
    } catch (cause) {
      setLinkError(
        cause instanceof Error ? cause.message : "Não foi possível salvar o vínculo.",
      );
    } finally {
      setLinkBusy(false);
    }
  };

  const removeGuest = async (guest: GuestRecord) => {
    if (!window.confirm(`Remover ${guest.name} da lista de confirmados?`)) {
      return;
    }
    setDeletingId(guest.id);
    try {
      const response = await fetch(
        `/api/admin/guests?id=${encodeURIComponent(guest.id)}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        setGuests((current) =>
          current.filter((item) => item.id !== guest.id),
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const openGuestEditor = (guest: GuestRecord) => {
    setEditingGuestId(guest.id);
    setEditingGuestName(guest.name);
    setEditingGuestError("");
  };

  const closeGuestEditor = () => {
    if (editingGuestBusy) return;
    setEditingGuestId(null);
    setEditingGuestName("");
    setEditingGuestError("");
  };

  const saveGuestName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingGuest) return;
    const name = editingGuestName.trim().replace(/\s+/g, " ");
    if (name.length < 2) {
      setEditingGuestError("Informe um nome válido.");
      return;
    }

    setEditingGuestBusy(true);
    setEditingGuestError("");
    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingGuest.id, name }),
      });
      if (!response.ok) {
        throw new Error(
          await readResponseError(response, "Não foi possível alterar o nome."),
        );
      }
      const data = (await response.json()) as { guest: GuestRecord };
      setGuests((current) =>
        current.map((guest) => (guest.id === data.guest.id ? data.guest : guest)),
      );
      setEditingGuestId(null);
      setEditingGuestName("");
    } catch (cause) {
      setEditingGuestError(
        cause instanceof Error ? cause.message : "Não foi possível alterar o nome.",
      );
    } finally {
      setEditingGuestBusy(false);
    }
  };

  const removeGiftPayment = async (payment: GiftPaymentRecord) => {
    if (
      !window.confirm(
        `Apagar o pagamento de ${payment.donorName}? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setDeletingGiftId(payment.id);
    setGiftDeleteError("");
    try {
      const response = await fetch(
        `/api/admin/gift-payments?id=${encodeURIComponent(payment.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error(
          await readResponseError(response, "Não foi possível apagar o pagamento."),
        );
      }
      setGiftPayments((current) =>
        current.filter((item) => item.id !== payment.id),
      );
    } catch (cause) {
      setGiftDeleteError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível apagar o pagamento.",
      );
    } finally {
      setDeletingGiftId(null);
    }
  };

  const exportPdf = async () => {
    if (guests.length === 0) return;
    setIsExporting(true);
    setExportError("");
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const [templateResponse, providersResponse] = await Promise.all([
        fetch("/guest-list-template.pdf?v=20260726-1", {
          cache: "no-store",
        }),
        fetch("/api/admin/providers", { cache: "no-store" }),
      ]);
      if (!templateResponse.ok || !providersResponse.ok) throw new Error();

      const templateBytes = await templateResponse.arrayBuffer();
      const providersData = (await providersResponse.json()) as {
        providers?: ServiceProviderRecord[];
      };
      const sortedProviders = [...(providersData.providers ?? [])].sort(
        (left, right) =>
          left.role.localeCompare(right.role, "pt-BR", {
            sensitivity: "base",
          }) ||
          left.name.localeCompare(right.name, "pt-BR", {
            sensitivity: "base",
          }),
      );
      const outputDocument = await PDFDocument.create();
      const [firstTemplate, continuationTemplate] =
        await outputDocument.embedPdf(templateBytes, [0, 1]);
      const italic = await outputDocument.embedFont(
        StandardFonts.TimesRomanItalic,
      );
      const bold = await outputDocument.embedFont(StandardFonts.TimesRomanBold);
      const pageWidth = 595.276;
      const pageHeight = 841.89;
      const ink = rgb(67 / 255, 42 / 255, 30 / 255);
      const olive = rgb(95 / 255, 109 / 255, 63 / 255);
      const muted = rgb(117 / 255, 89 / 255, 70 / 255);
      const divider = rgb(196 / 255, 175 / 255, 143 / 255);
      const maximumRowsPerPage = 21;
      const maximumProvidersPerPage = 21;
      const sortedGuests = [...guests].sort((left, right) =>
        left.name.localeCompare(right.name, "pt-BR", {
          sensitivity: "base",
        }),
      );
      const guestPageCount = Math.ceil(
        sortedGuests.length / maximumRowsPerPage,
      );
      const providerPageCount = Math.max(
        1,
        Math.ceil(sortedProviders.length / maximumProvidersPerPage),
      );
      const totalPages = guestPageCount + providerPageCount;

      for (let pageIndex = 0; pageIndex < guestPageCount; pageIndex += 1) {
        const page = outputDocument.addPage([pageWidth, pageHeight]);
        page.drawPage(pageIndex === 0 ? firstTemplate : continuationTemplate, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
        const pageGuests = sortedGuests.slice(
          pageIndex * maximumRowsPerPage,
          (pageIndex + 1) * maximumRowsPerPage,
        );
        const summary =
          pageIndex === 0
            ? `${sortedGuests.length} convidados confirmados  •  ordem alfabética`
            : `Continuação  •  ${sortedGuests.length} convidados confirmados`;
        const summaryWidth = italic.widthOfTextAtSize(summary, 9);
        page.drawText(summary, {
          x: (pageWidth - summaryWidth) / 2,
          y: 636,
          size: 9,
          font: italic,
          color: muted,
        });

        pageGuests.forEach((guest, rowIndex) => {
          const y = 603 - rowIndex * 23;
          const absoluteIndex =
            pageIndex * maximumRowsPerPage + rowIndex + 1;
          const number = String(absoluteIndex).padStart(2, "0");
          const numberWidth = italic.widthOfTextAtSize(number, 8);
          page.drawText(number, {
            x: 82 - numberWidth,
            y,
            size: 8,
            font: italic,
            color: muted,
          });

          let nameSize = 12.5;
          while (
            nameSize > 9 &&
            italic.widthOfTextAtSize(guest.name, nameSize) > 325
          ) {
            nameSize -= 0.5;
          }
          page.drawText(guest.name, {
            x: 96,
            y,
            size: nameSize,
            font: italic,
            color: ink,
          });

          const categoryLabel =
            guest.category === "noivo" ? "NOIVO" : "NOIVA";
          const categoryWidth = bold.widthOfTextAtSize(categoryLabel, 8);
          page.drawText(categoryLabel, {
            x: 510 - categoryWidth,
            y,
            size: 8,
            font: bold,
            color: olive,
          });
          page.drawLine({
            start: { x: 72, y: y - 8 },
            end: { x: 522, y: y - 8 },
            thickness: 0.35,
            color: divider,
          });
        });

        const pageLabel = `Página ${pageIndex + 1} de ${totalPages}`;
        const pageLabelWidth = italic.widthOfTextAtSize(pageLabel, 8);
        page.drawText(pageLabel, {
          x: (pageWidth - pageLabelWidth) / 2,
          y: 78,
          size: 8,
          font: italic,
          color: muted,
        });
      }

      const teamInk = rgb(67 / 255, 42 / 255, 30 / 255);
      const teamAccent = rgb(133 / 255, 82 / 255, 60 / 255);
      const teamMuted = rgb(111 / 255, 104 / 255, 94 / 255);
      const teamHeaderPaper = rgb(242 / 255, 228 / 255, 200 / 255);
      const teamLine = rgb(205 / 255, 181 / 255, 158 / 255);

      for (
        let providerPageIndex = 0;
        providerPageIndex < providerPageCount;
        providerPageIndex += 1
      ) {
        const page = outputDocument.addPage([pageWidth, pageHeight]);
        const pageProviders = sortedProviders.slice(
          providerPageIndex * maximumProvidersPerPage,
          (providerPageIndex + 1) * maximumProvidersPerPage,
        );
        const documentPageIndex = guestPageCount + providerPageIndex;

        page.drawPage(firstTemplate, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
        page.drawRectangle({
          x: 104,
          y: 654,
          width: 387,
          height: 142,
          color: teamHeaderPaper,
        });

        const eyebrow = "EQUIPE DO CASAMENTO";
        const eyebrowWidth = bold.widthOfTextAtSize(eyebrow, 12);
        page.drawText(eyebrow, {
          x: (pageWidth - eyebrowWidth) / 2,
          y: 764,
          size: 12,
          font: bold,
          color: teamAccent,
        });
        const teamTitle =
          providerPageIndex === 0
            ? "Prestadores confirmados"
            : "Prestadores - continuação";
        const teamTitleWidth = italic.widthOfTextAtSize(teamTitle, 27);
        page.drawText(teamTitle, {
          x: (pageWidth - teamTitleWidth) / 2,
          y: 718,
          size: 27,
          font: italic,
          color: teamInk,
        });
        const teamSubtitle = "31 de outubro de 2026  •  Villa Garden";
        const teamSubtitleWidth = italic.widthOfTextAtSize(teamSubtitle, 9.5);
        page.drawText(teamSubtitle, {
          x: (pageWidth - teamSubtitleWidth) / 2,
          y: 684,
          size: 9.5,
          font: italic,
          color: teamMuted,
        });
        page.drawLine({
          start: { x: 124, y: 665 },
          end: { x: 471, y: 665 },
          thickness: 0.55,
          color: teamAccent,
        });

        const teamSummary = `${sortedProviders.length} prestadores confirmados  •  organizados por função`;
        const teamSummaryWidth = italic.widthOfTextAtSize(teamSummary, 9);
        page.drawText(teamSummary, {
          x: (pageWidth - teamSummaryWidth) / 2,
          y: 636,
          size: 9,
          font: italic,
          color: teamMuted,
        });

        if (pageProviders.length === 0) {
          const emptyMessage = "Nenhum prestador confirmado até o momento.";
          const emptyWidth = italic.widthOfTextAtSize(emptyMessage, 12);
          page.drawText(emptyMessage, {
            x: (pageWidth - emptyWidth) / 2,
            y: 570,
            size: 12,
            font: italic,
            color: teamMuted,
          });
        }

        pageProviders.forEach((provider, rowIndex) => {
          const y = 603 - rowIndex * 23;
          const absoluteIndex =
            providerPageIndex * maximumProvidersPerPage + rowIndex + 1;
          const number = String(absoluteIndex).padStart(2, "0");
          const numberWidth = italic.widthOfTextAtSize(number, 8);
          page.drawText(number, {
            x: 84 - numberWidth,
            y,
            size: 8,
            font: italic,
            color: teamAccent,
          });

          let providerNameSize = 12.5;
          while (
            providerNameSize > 9 &&
            italic.widthOfTextAtSize(provider.name, providerNameSize) > 275
          ) {
            providerNameSize -= 0.5;
          }
          page.drawText(provider.name, {
            x: 98,
            y,
            size: providerNameSize,
            font: italic,
            color: teamInk,
          });

          const roleLabel = provider.role.toLocaleUpperCase("pt-BR");
          let roleSize = 8;
          while (
            roleSize > 6.5 &&
            bold.widthOfTextAtSize(roleLabel, roleSize) > 135
          ) {
            roleSize -= 0.5;
          }
          const roleWidth = bold.widthOfTextAtSize(roleLabel, roleSize);
          page.drawText(roleLabel, {
            x: 510 - roleWidth,
            y,
            size: roleSize,
            font: bold,
            color: teamAccent,
          });
          page.drawLine({
            start: { x: 72, y: y - 8 },
            end: { x: 522, y: y - 8 },
            thickness: 0.35,
            color: teamLine,
          });
        });

        const pageLabel = `Página ${documentPageIndex + 1} de ${totalPages}`;
        const pageLabelWidth = italic.widthOfTextAtSize(pageLabel, 8);
        page.drawText(pageLabel, {
          x: (pageWidth - pageLabelWidth) / 2,
          y: 78,
          size: 8,
          font: italic,
          color: teamMuted,
        });
      }

      outputDocument.setTitle(
        "Djalma & Victoria - Convidados e prestadores confirmados",
      );
      outputDocument.setAuthor("Djalma & Victoria");
      outputDocument.setCreator("Dashboard de confirmações");
      const pdfBytes = await outputDocument.save();
      const blob = new Blob([pdfBytes.slice().buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "lista-convidados-djalma-victoria.pdf";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      setExportError("Não foi possível gerar o PDF agora.");
    } finally {
      setIsExporting(false);
    }
  };

  if (authenticated !== true) {
    return (
      <main className="admin-page admin-login-page">
        <section className="admin-login-card">
          <span className="admin-monogram" aria-hidden="true">
            D & V
          </span>
          <p className="admin-kicker">Área reservada</p>
          <h1>Lista de confirmações</h1>
          <p>
            Entre com a senha administrativa para acompanhar os convidados.
          </p>
          <form onSubmit={login}>
            <label>
              <span>Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                required
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {loginError && (
              <p className="admin-error" role="alert">
                {loginError}
              </p>
            )}
            <button type="submit" disabled={loading}>
              {loading ? "Verificando..." : "Entrar no painel"}
            </button>
          </form>
          <Link href="/">Voltar para o convite</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Djalma & Victoria</p>
          <h1>Painel do casamento</h1>
          <p>Planejamento, convidados, finanças e operação do grande dia.</p>
        </div>
        <div className="admin-countdown" aria-label={`${daysUntilWedding ?? ""} dias para o casamento`}>
          <strong>{daysUntilWedding ?? "—"}</strong>
          <span>dias para o nosso sim</span>
        </div>
        <div className="admin-header-actions">
          {activePage === "convidados" && (
            <button
              type="button"
              onClick={exportPdf}
              disabled={guests.length === 0 || isExporting}
            >
              {isExporting ? "Preparando PDF..." : "Exportar PDF"}
            </button>
          )}
          <button type="button" className="admin-logout" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <nav className="admin-primary-nav" aria-label="Páginas do dashboard">
        {([
          ["convidados", "Convidados", "Lista, confirmações e vagas"],
          ["organizacao", "Organização", "Checklist, equipe e fornecedores"],
          ["financeiro", "Financeiro", "Contribuições e despesas"],
        ] as const).map(([page, label, description]) => (
          <button
            key={page}
            type="button"
            className={activePage === page ? "is-active" : ""}
            aria-current={activePage === page ? "page" : undefined}
            onClick={() => navigateToPage(page)}
          >
            <span>{label}</span>
            <small>{description}</small>
          </button>
        ))}
      </nav>

      {exportError && (
        <p className="admin-export-error" role="alert">
          {exportError}
        </p>
      )}

      {activePage === "convidados" && (
        <div className="admin-page-view" data-page="convidados">
      <section className="admin-stats" aria-label="Resumo das confirmações">
        <article>
          <span>Vagas ocupadas</span>
          <strong>{occupiedSpots}<small>/50</small></strong>
        </article>
        <article>
          <span>Convidados confirmados</span>
          <strong>{totals.all}</strong>
        </article>
        <article>
          <span>Família do noivo</span>
          <strong>{totals.noivo}</strong>
        </article>
        <article>
          <span>Família da noiva</span>
          <strong>{totals.noiva}</strong>
        </article>
        <article>
          <span>Aguardando retorno</span>
          <strong>{invitedPendingCount}</strong>
        </article>
      </section>

      <section className="admin-guests-section">
        <div className="admin-section-heading">
          <div>
            <p className="admin-kicker">Gestão de convidados</p>
            <h2>Lista planejada e confirmações</h2>
          </div>
          <p>
            O painel cruza automaticamente o primeiro nome — e o segundo quando informado —
            com as confirmações recebidas.
          </p>
        </div>

        <div className="admin-roster-card">
          <form className="admin-roster-form" onSubmit={addInvitedNames}>
            <div>
              <span className="admin-eyebrow">Base de convidados</span>
              <h3>Adicionar nomes de referência</h3>
              <p>
                Use apenas o primeiro nome. Quando houver nomes repetidos, informe também o
                segundo. Aceitamos um registro por linha ou separado por vírgula.
              </p>
            </div>
            <label>
              <span>Primeiro nome ou primeiro e segundo</span>
              <textarea
                value={invitedNamesDraft}
                onChange={(event) => setInvitedNamesDraft(event.target.value)}
                placeholder={"Ex.:\nAna\nLuiz Fernando\nLuiz Henrique"}
                maxLength={4000}
                required
              />
            </label>
            {invitedError && <p className="admin-inline-error" role="alert">{invitedError}</p>}
            <button type="submit" disabled={invitedBusy}>
              {invitedBusy ? "Adicionando…" : "Adicionar à lista"}
            </button>
          </form>

          <div className="admin-roster-overview">
            <div className="admin-roster-summary">
              <div><strong>{invitedRoster.length}</strong><span>planejados</span></div>
              <div><strong>{invitedMatchedCount}</strong><span>confirmados</span></div>
              <div><strong>{invitedPendingCount}</strong><span>pendentes</span></div>
              <div className="admin-roster-percentage"><strong>{invitedProgress}%</strong><span>de retorno</span></div>
            </div>
            <div className="admin-progress admin-roster-progress" aria-label={`${invitedProgress}% dos convidados planejados confirmados`}>
              <i style={{ width: `${invitedProgress}%` }} />
            </div>
            <div className="admin-roster-list">
              {invitedRoster.map((item) => (
                <article className={item.matchedGuest ? "is-matched" : "is-pending"} key={item.id}>
                  <span className="admin-roster-check" aria-hidden="true">{item.matchedGuest ? "✓" : ""}</span>
                  <div>
                    <button
                      className="admin-roster-name-link"
                      type="button"
                      onClick={() => openGuestLinker(item)}
                    >
                      {item.firstName}
                    </button>
                    <small>
                      {item.matchedGuest
                        ? `Confirmado como ${item.matchedGuest.name}${item.matchSource === "manual" ? " • vínculo manual" : ""}`
                        : "Aguardando confirmação • clique para vincular"}
                    </small>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remover ${item.firstName}`}
                    disabled={deletingInvitedId === item.id}
                    onClick={() => void removeInvitedName(item)}
                  >
                    ×
                  </button>
                </article>
              ))}
              {invitedRoster.length === 0 && (
                <div className="admin-roster-empty">
                  <strong>Sua lista começa aqui</strong>
                  <p>
                    Adicione os nomes de referência para acompanhar automaticamente quem já
                    confirmou.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-list-card">
        <div className="admin-toolbar">
          <label>
            <span>Pesquisar por nome</span>
            <input
              type="search"
              placeholder="Digite um nome"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            <span>Categoria</span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as "todos" | GuestCategory)
              }
            >
              <option value="todos">Todos</option>
              <option value="noivo">Noivo</option>
              <option value="noiva">Noiva</option>
            </select>
          </label>
        </div>

        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Confirmação</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr key={guest.id}>
                  <td data-label="Nome">
                    <strong>{guest.name}</strong>
                  </td>
                  <td data-label="Categoria">
                    <span className={`admin-category ${guest.category}`}>
                      {guest.category === "noivo" ? "Noivo" : "Noiva"}
                    </span>
                  </td>
                  <td data-label="Tipo">
                    {guest.isPrimary ? "Principal" : "Acompanhante"}
                  </td>
                  <td data-label="Confirmação">
                    {new Date(guest.createdAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "America/Fortaleza",
                    })}
                  </td>
                  <td data-label="Ações">
                    <div className="admin-guest-actions">
                    <button
                      className="admin-edit"
                      type="button"
                      onClick={() => openGuestEditor(guest)}
                    >
                      Editar
                    </button>
                    <button
                      className="admin-remove"
                      type="button"
                      disabled={deletingId === guest.id}
                      onClick={() => removeGuest(guest)}
                    >
                      {deletingId === guest.id ? "Removendo..." : "Remover"}
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredGuests.length === 0 && (
            <div className="admin-empty">
              <span aria-hidden="true">✦</span>
              <p>Nenhuma confirmação encontrada.</p>
            </div>
          )}
        </div>
      </section>

        </div>
      )}

      {activePage === "organizacao" && (
        <div className="admin-page-view" data-page="organizacao">
          <AdminPlanningTools
            guestsCount={totals.all}
            onProviderCountChange={setProviderCount}
          />
        </div>
      )}

      {activePage === "financeiro" && (
        <div className="admin-page-view" data-page="financeiro">
      <section className="admin-gifts-section">
        <div className="admin-section-heading">
          <div>
            <p className="admin-kicker">Lista de presentes</p>
            <h2>Contribuições via Pix</h2>
          </div>
          <p>
            A confirmação é atualizada automaticamente pelo Mercado Pago.
          </p>
        </div>

        <div className="admin-stats admin-gift-stats">
          <article>
            <span>Presentes pagos</span>
            <strong>{giftTotals.approved}</strong>
          </article>
          <article>
            <span>Aguardando pagamento</span>
            <strong>{giftTotals.pending}</strong>
          </article>
          <article>
            <span>Total recebido</span>
            <strong className="admin-money">
              {formatCurrency(giftTotals.receivedCents)}
            </strong>
          </article>
        </div>

        <div className="admin-list-card">
          {giftDeleteError && (
            <p className="admin-export-error" role="alert">
              {giftDeleteError}
            </p>
          )}
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Convidado</th>
                  <th>Presente</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {giftPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label="Convidado">
                      <strong>{payment.donorName}</strong>
                      <small className="admin-payment-email">
                        {payment.donorEmail}
                      </small>
                    </td>
                    <td data-label="Presente">{payment.giftTitle}</td>
                    <td data-label="Valor">
                      {formatCurrency(payment.amountCents)}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`admin-payment-status ${payment.status}`}
                      >
                        {paymentStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td data-label="Data">
                      {new Date(
                        payment.paidAt ?? payment.createdAt,
                      ).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Fortaleza",
                      })}
                    </td>
                    <td data-label="Ações" className="admin-gift-action-cell">
                      {canDeleteGiftPayment(payment.status) ? (
                        <button
                          className="admin-remove"
                          type="button"
                          disabled={deletingGiftId === payment.id}
                          onClick={() => void removeGiftPayment(payment)}
                        >
                          {deletingGiftId === payment.id
                            ? "Apagando..."
                            : "Apagar"}
                        </button>
                      ) : (
                        <span className="admin-action-locked">Preservado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && giftPayments.length === 0 && (
              <div className="admin-empty">
                <span aria-hidden="true">✦</span>
                <p>Nenhuma contribuição registrada ainda.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <AdminPlanningTools
        view="finance"
        guestsCount={totals.all}
        onProviderCountChange={setProviderCount}
      />
        </div>
      )}

      {editingGuest && (
        <div
          className="admin-link-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeGuestEditor();
          }}
        >
          <section
            className="admin-link-modal admin-guest-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-guest-edit-title"
          >
            <header>
              <div>
                <span className="admin-eyebrow">Convidado confirmado</span>
                <h2 id="admin-guest-edit-title">Editar nome</h2>
                <p>A alteração será aplicada à lista de confirmados e aos vínculos planejados.</p>
              </div>
              <button
                className="admin-link-modal-close"
                type="button"
                aria-label="Fechar"
                onClick={closeGuestEditor}
              >
                ×
              </button>
            </header>

            <form className="admin-guest-edit-form" onSubmit={saveGuestName}>
              <label className="admin-link-search">
                <span>Nome completo</span>
                <input
                  type="text"
                  autoFocus
                  maxLength={100}
                  value={editingGuestName}
                  onChange={(event) => setEditingGuestName(event.target.value)}
                  required
                />
              </label>
              {editingGuestError && (
                <p className="admin-inline-error" role="alert">
                  {editingGuestError}
                </p>
              )}
              <div className="admin-guest-edit-actions">
                <button type="button" onClick={closeGuestEditor} disabled={editingGuestBusy}>
                  Cancelar
                </button>
                <button type="submit" disabled={editingGuestBusy}>
                  {editingGuestBusy ? "Salvando…" : "Salvar alteração"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {linkingInvited && (
        <div
          className="admin-link-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeGuestLinker();
          }}
        >
          <section
            className="admin-link-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-link-modal-title"
          >
            <header>
              <div>
                <span className="admin-eyebrow">Associação manual</span>
                <h2 id="admin-link-modal-title">Vincular {linkingInvited.firstName}</h2>
                <p>Selecione a pessoa correspondente na lista de confirmados.</p>
              </div>
              <button
                className="admin-link-modal-close"
                type="button"
                aria-label="Fechar"
                onClick={closeGuestLinker}
              >
                ×
              </button>
            </header>

            <label className="admin-link-search">
              <span>Pesquisar convidado confirmado</span>
              <input
                type="search"
                autoFocus
                placeholder="Digite o nome completo"
                value={linkSearch}
                onChange={(event) => setLinkSearch(event.target.value)}
              />
            </label>

            {linkError && (
              <p className="admin-inline-error" role="alert">{linkError}</p>
            )}

            <div className="admin-link-options">
              {filteredLinkGuests.map((guest) => {
                const manuallyLinkedElsewhere = invitedGuests.find(
                  (item) =>
                    item.matchedGuestId === guest.id && item.id !== linkingInvited.id,
                );
                const isSelected = linkingInvited.matchedGuestId === guest.id;
                return (
                  <button
                    type="button"
                    className={isSelected ? "is-selected" : ""}
                    disabled={linkBusy || Boolean(manuallyLinkedElsewhere)}
                    key={guest.id}
                    onClick={() => void saveInvitedGuestLink(guest.id)}
                  >
                    <span>
                      <strong>{guest.name}</strong>
                      <small>
                        Família d{guest.category === "noivo" ? "o noivo" : "a noiva"}
                        {manuallyLinkedElsewhere
                          ? ` • já vinculado a ${manuallyLinkedElsewhere.firstName}`
                          : ""}
                      </small>
                    </span>
                    <b aria-hidden="true">{isSelected ? "✓" : "Vincular"}</b>
                  </button>
                );
              })}
              {filteredLinkGuests.length === 0 && (
                <div className="admin-link-empty">
                  Nenhum convidado confirmado encontrado.
                </div>
              )}
            </div>

            {linkingInvited.matchedGuestId && (
              <button
                className="admin-link-unlink"
                type="button"
                disabled={linkBusy}
                onClick={() => void saveInvitedGuestLink(null)}
              >
                Remover vínculo manual
              </button>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
