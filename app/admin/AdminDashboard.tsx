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

  const exportCsv = () => {
    const rows = [
      ["Nome", "Categoria", "Tipo", "Confirmado em"],
      ...filteredGuests.map((guest) => [
        guest.name,
        guest.category === "noivo" ? "Noivo" : "Noiva",
        guest.isPrimary ? "Convidado principal" : "Acompanhante",
        new Date(guest.createdAt).toLocaleString("pt-BR", {
          timeZone: "America/Fortaleza",
        }),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "confirmados-djalma-victoria.csv";
    anchor.click();
    URL.revokeObjectURL(url);
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
          <button type="button" onClick={exportCsv}>
            Exportar CSV
          </button>
          <button type="button" className="admin-logout" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

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
