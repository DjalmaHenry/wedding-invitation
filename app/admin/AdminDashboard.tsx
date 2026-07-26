"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type GuestCategory = "noivo" | "noiva";

type GuestRecord = {
  id: string;
  submissionId: string;
  name: string;
  category: GuestCategory;
  isPrimary: boolean;
  createdAt: string;
};

export function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"todos" | GuestCategory>("todos");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const loadGuests = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/guests", {
        cache: "no-store",
      });
      if (response.status === 401) {
        setAuthenticated(false);
        setGuests([]);
        return;
      }
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { guests?: GuestRecord[] };
      setGuests(data.guests ?? []);
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

  const exportPdf = async () => {
    if (guests.length === 0) return;
    setIsExporting(true);
    setExportError("");
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const templateResponse = await fetch(
        "/guest-list-template.pdf?v=20260726-1",
        { cache: "no-store" },
      );
      if (!templateResponse.ok) throw new Error();

      const templateBytes = await templateResponse.arrayBuffer();
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
      const wine = rgb(120 / 255, 31 / 255, 39 / 255);
      const muted = rgb(117 / 255, 89 / 255, 70 / 255);
      const divider = rgb(196 / 255, 175 / 255, 143 / 255);
      const maximumRowsPerPage = 21;
      const sortedGuests = [...guests].sort((left, right) =>
        left.name.localeCompare(right.name, "pt-BR", {
          sensitivity: "base",
        }),
      );
      const totalPages = Math.ceil(
        sortedGuests.length / maximumRowsPerPage,
      );

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
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
            color: wine,
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

      outputDocument.setTitle(
        "Djalma & Victoria - Lista de convidados confirmados",
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
          <h1>Confirmações de presença</h1>
          <p>Uma pessoa por linha, incluindo todos os acompanhantes.</p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            onClick={exportPdf}
            disabled={guests.length === 0 || isExporting}
          >
            {isExporting ? "Preparando PDF..." : "Exportar PDF"}
          </button>
          <button type="button" className="admin-logout" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      {exportError && (
        <p className="admin-export-error" role="alert">
          {exportError}
        </p>
      )}

      <section className="admin-stats" aria-label="Resumo das confirmações">
        <article>
          <span>Total confirmado</span>
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
                  <td>
                    <button
                      className="admin-remove"
                      type="button"
                      disabled={deletingId === guest.id}
                      onClick={() => removeGuest(guest)}
                    >
                      {deletingId === guest.id ? "Removendo..." : "Remover"}
                    </button>
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
    </main>
  );
}
