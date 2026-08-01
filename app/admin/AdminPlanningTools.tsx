"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type {
  ChecklistRecord,
  ExpenseCategoryRecord,
  ExpensePaymentType,
  ExpenseRecord,
  FinanceBudgetRecord,
  ServiceProviderRecord,
  TimelineRecord,
} from "../../db/admin-dashboard";

type ToolTab = "finance" | "checklist" | "timeline" | "providers";

const EMPTY_EXPENSE = {
  description: "",
  category: "Local",
  paymentType: "pix_paid" as ExpensePaymentType,
  amount: "",
  installmentsTotal: "2",
  installmentsPaid: "0",
  dueDate: "",
};

function money(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

function parseMoneyToCents(value: string) {
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

function centsToInput(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

function fortalezaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function checklistDeadline(item: ChecklistRecord) {
  if (item.completed) return { tone: "is-complete", label: "Concluída" };
  if (!item.dueDate) return { tone: "is-undated", label: "Defina uma data-limite" };
  const today = new Date(`${fortalezaDateKey(new Date())}T12:00:00-03:00`);
  const due = new Date(`${item.dueDate}T12:00:00-03:00`);
  const difference = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (difference < 0) {
    const days = Math.abs(difference);
    return { tone: "is-danger", label: `Atrasada há ${days} ${days === 1 ? "dia" : "dias"}` };
  }
  if (difference === 0) return { tone: "is-danger", label: "Vence hoje" };
  if (difference <= 7) {
    return { tone: "is-warning", label: `Vence em ${difference} ${difference === 1 ? "dia" : "dias"}` };
  }
  return {
    tone: "is-neutral",
    label: `Prazo em ${due.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Fortaleza" })}`,
  };
}

function sortChecklist(items: ChecklistRecord[]) {
  return [...items].sort((left, right) => {
    if (left.completed !== right.completed) return left.completed ? 1 : -1;
    if (left.dueDate && right.dueDate) return left.dueDate.localeCompare(right.dueDate);
    if (left.dueDate) return -1;
    if (right.dueDate) return 1;
    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function AdminPlanningTools({
  guestsCount,
  onProviderCountChange,
}: {
  guestsCount: number;
  onProviderCountChange(count: number): void;
}) {
  const [activeTab, setActiveTab] = useState<ToolTab>("finance");
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryRecord[]>([]);
  const [checklist, setChecklist] = useState<ChecklistRecord[]>([]);
  const [timeline, setTimeline] = useState<TimelineRecord[]>([]);
  const [providers, setProviders] = useState<ServiceProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [expenseDraft, setExpenseDraft] = useState(EMPTY_EXPENSE);
  const [checklistTitle, setChecklistTitle] = useState("");
  const [checklistDueDate, setChecklistDueDate] = useState("");
  const [timelineDraft, setTimelineDraft] = useState({
    time: "08:00",
    title: "",
    details: "",
  });
  const [providerDraft, setProviderDraft] = useState({ name: "", role: "" });
  const [exportingTimeline, setExportingTimeline] = useState(false);
  const [plannedBudgetCents, setPlannedBudgetCents] = useState(0);
  const [plannedBudgetInput, setPlannedBudgetInput] = useState("");
  const [budgetBusy, setBudgetBusy] = useState(false);

  const loadPlanningData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [expenseResponse, categoryResponse, budgetResponse, checklistResponse, timelineResponse, providerResponse] =
        await Promise.all([
          fetch("/api/admin/expenses", { cache: "no-store" }),
          fetch("/api/admin/expense-categories", { cache: "no-store" }),
          fetch("/api/admin/finance-budget", { cache: "no-store" }),
          fetch("/api/admin/checklist", { cache: "no-store" }),
          fetch("/api/admin/timeline", { cache: "no-store" }),
          fetch("/api/admin/providers", { cache: "no-store" }),
        ]);
      if (
        !expenseResponse.ok ||
        !categoryResponse.ok ||
        !budgetResponse.ok ||
        !checklistResponse.ok ||
        !timelineResponse.ok ||
        !providerResponse.ok
      ) {
        throw new Error();
      }
      const [expenseData, categoryData, budgetData, checklistData, timelineData, providerData] =
        (await Promise.all([
          expenseResponse.json(),
          categoryResponse.json(),
          budgetResponse.json(),
          checklistResponse.json(),
          timelineResponse.json(),
          providerResponse.json(),
        ])) as [
          { expenses?: ExpenseRecord[] },
          { categories?: ExpenseCategoryRecord[] },
          { budget?: FinanceBudgetRecord },
          { items?: ChecklistRecord[] },
          { items?: TimelineRecord[] },
          { providers?: ServiceProviderRecord[] },
        ];
      setExpenses(expenseData.expenses ?? []);
      setExpenseCategories(categoryData.categories ?? []);
      const loadedBudget = budgetData.budget?.totalPlannedCents ?? 0;
      setPlannedBudgetCents(loadedBudget);
      setPlannedBudgetInput(loadedBudget > 0 ? centsToInput(loadedBudget) : "");
      setChecklist(checklistData.items ?? []);
      setTimeline(timelineData.items ?? []);
      setProviders(providerData.providers ?? []);
    } catch {
      setError("Não foi possível carregar os dados de planejamento.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Loads the authenticated planning workspace when the dashboard mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPlanningData();
  }, [loadPlanningData]);

  useEffect(() => {
    onProviderCountChange(providers.length);
  }, [onProviderCountChange, providers.length]);

  const finances = useMemo(() => {
    const paidPix = expenses
      .filter((expense) => expense.paymentType === "pix_paid")
      .reduce((sum, expense) => sum + expense.amountCents, 0);
    const installments = expenses
      .filter((expense) => expense.paymentType === "installments")
      .reduce((sum, expense) => sum + expense.amountCents, 0);
    const futurePix = expenses
      .filter((expense) => expense.paymentType === "pix_pending")
      .reduce((sum, expense) => sum + expense.amountCents, 0);
    const installmentsPaid = expenses
      .filter((expense) => expense.paymentType === "installments")
      .reduce(
        (sum, expense) =>
          sum +
          Math.round(
            expense.amountCents *
              (expense.installmentsTotal > 0
                ? expense.installmentsPaid / expense.installmentsTotal
                : 0),
          ),
        0,
      );
    return {
      total: paidPix + installments + futurePix,
      paidPix,
      installments,
      installmentsPaid,
      futurePix,
      paid: paidPix + installmentsPaid,
      pending: futurePix + installments - installmentsPaid,
    };
  }, [expenses]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    expenses.forEach((expense) => {
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amountCents);
    });
    return [...totals.entries()]
      .map(([category, amountCents]) => ({ category, amountCents }))
      .sort((left, right) => right.amountCents - left.amountCents);
  }, [expenses]);

  const budgetRemaining = plannedBudgetCents - finances.total;
  const budgetProgress = plannedBudgetCents
    ? Math.min((finances.total / plannedBudgetCents) * 100, 100)
    : 0;

  const completedChecklist = checklist.filter((item) => item.completed).length;
  const pendingChecklist = checklist.filter((item) => !item.completed);
  const completedChecklistItems = checklist.filter((item) => item.completed);
  const checklistProgress = checklist.length
    ? Math.round((completedChecklist / checklist.length) * 100)
    : 0;
  const occupied = guestsCount + providers.length;
  const capacityPercent = Math.min((occupied / 50) * 100, 100);

  const addExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountCents = parseMoneyToCents(expenseDraft.amount);
    if (amountCents <= 0) {
      setError("Informe um valor válido para a despesa.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...expenseDraft,
          amountCents,
          installmentsTotal: Number(expenseDraft.installmentsTotal),
          installmentsPaid: Number(expenseDraft.installmentsPaid),
        }),
      });
      if (!response.ok) throw new Error(await readError(response, "Não foi possível salvar a despesa."));
      const data = (await response.json()) as { expense: ExpenseRecord };
      setExpenses((current) => [data.expense, ...current]);
      setExpenseDraft(EMPTY_EXPENSE);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a despesa.");
    } finally {
      setBusy(false);
    }
  };

  const savePlannedBudget = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const totalPlannedCents = parseMoneyToCents(plannedBudgetInput);
    if (totalPlannedCents <= 0) {
      setError("Informe um valor válido para o orçamento planejado.");
      return;
    }
    setBudgetBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/finance-budget", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalPlannedCents }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Não foi possível salvar o orçamento."));
      }
      const data = (await response.json()) as { budget: FinanceBudgetRecord };
      setPlannedBudgetCents(data.budget.totalPlannedCents);
      setPlannedBudgetInput(centsToInput(data.budget.totalPlannedCents));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o orçamento.");
    } finally {
      setBudgetBusy(false);
    }
  };

  const addExpenseCategory = async () => {
    const name = newCategoryName.trim().replace(/\s+/g, " ");
    if (name.length < 2) {
      setError("Informe um nome válido para a nova categoria.");
      return;
    }
    setCategoryBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Não foi possível criar a categoria."));
      }
      const data = (await response.json()) as { category: ExpenseCategoryRecord };
      setExpenseCategories((current) =>
        [...current, data.category].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      );
      setExpenseDraft((current) => ({ ...current, category: data.category.name }));
      setNewCategoryName("");
      setAddingCategory(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar a categoria.");
    } finally {
      setCategoryBusy(false);
    }
  };

  const deleteExpenseItem = async (id: string) => {
    if (!window.confirm("Remover esta despesa do planejamento?")) return;
    const response = await fetch(`/api/admin/expenses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (response.ok) setExpenses((current) => current.filter((item) => item.id !== id));
  };

  const setPaidInstallments = async (expense: ExpenseRecord, nextValue: number) => {
    if (nextValue < 0 || nextValue > expense.installmentsTotal) return;
    const response = await fetch("/api/admin/expenses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: expense.id, installmentsPaid: nextValue }),
    });
    if (response.ok) {
      setExpenses((current) =>
        current.map((item) =>
          item.id === expense.id ? { ...item, installmentsPaid: nextValue } : item,
        ),
      );
    }
  };

  const addChecklistItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: checklistTitle, dueDate: checklistDueDate }),
      });
      if (!response.ok) throw new Error(await readError(response, "Não foi possível adicionar o item."));
      const data = (await response.json()) as { item: ChecklistRecord };
      setChecklist((current) => sortChecklist([data.item, ...current]));
      setChecklistTitle("");
      setChecklistDueDate("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível adicionar o item.");
    } finally {
      setBusy(false);
    }
  };

  const updateChecklistDeadline = async (item: ChecklistRecord, dueDate: string) => {
    const response = await fetch("/api/admin/checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, dueDate }),
    });
    if (response.ok) {
      setChecklist((current) =>
        sortChecklist(
          current.map((entry) => (entry.id === item.id ? { ...entry, dueDate } : entry)),
        ),
      );
    } else {
      setError("Não foi possível atualizar o prazo da tarefa.");
    }
  };

  const toggleChecklistItem = async (item: ChecklistRecord) => {
    const completed = !item.completed;
    const response = await fetch("/api/admin/checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, completed }),
    });
    if (response.ok) {
      setChecklist((current) =>
        sortChecklist(
          current.map((entry) => (entry.id === item.id ? { ...entry, completed } : entry)),
        ),
      );
    }
  };

  const removeChecklistItem = async (id: string) => {
    const response = await fetch(`/api/admin/checklist?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (response.ok) setChecklist((current) => current.filter((item) => item.id !== id));
  };

  const addTimelineItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timelineDraft),
      });
      if (!response.ok) throw new Error(await readError(response, "Não foi possível adicionar a etapa."));
      const data = (await response.json()) as { item: TimelineRecord };
      setTimeline((current) => [...current, data.item].sort((a, b) => a.time.localeCompare(b.time)));
      setTimelineDraft((current) => ({ ...current, title: "", details: "" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível adicionar a etapa.");
    } finally {
      setBusy(false);
    }
  };

  const removeTimelineItem = async (id: string) => {
    const response = await fetch(`/api/admin/timeline?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (response.ok) setTimeline((current) => current.filter((item) => item.id !== id));
  };

  const exportTimelinePdf = async () => {
    setExportingTimeline(true);
    setError("");
    try {
      const { createTimelinePdf } = await import("../../lib/timeline-pdf");
      const bytes = await createTimelinePdf(timeline);
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "cronograma-cerimonialista-djalma-victoria.pdf";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      setError("Não foi possível gerar o PDF do cronograma agora.");
    } finally {
      setExportingTimeline(false);
    }
  };

  const addProvider = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(providerDraft),
      });
      if (!response.ok) throw new Error(await readError(response, "Não foi possível adicionar o prestador."));
      const data = (await response.json()) as { provider: ServiceProviderRecord };
      setProviders((current) => [...current, data.provider].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setProviderDraft({ name: "", role: "" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível adicionar o prestador.");
    } finally {
      setBusy(false);
    }
  };

  const removeProvider = async (id: string) => {
    const response = await fetch(`/api/admin/providers?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (response.ok) setProviders((current) => current.filter((item) => item.id !== id));
  };

  const statusChart = finances.total
    ? `conic-gradient(#5f6d3f 0 ${(finances.paidPix / finances.total) * 360}deg, #a8895f ${(finances.paidPix / finances.total) * 360}deg ${((finances.paidPix + finances.installments) / finances.total) * 360}deg, #d6bd8f ${((finances.paidPix + finances.installments) / finances.total) * 360}deg 360deg)`
    : "conic-gradient(#d8c7a8 0 360deg)";

  return (
    <section className="admin-planning-section">
      <div className="admin-section-heading">
        <div>
          <p className="admin-kicker">Planejamento central</p>
          <h2>Organização do casamento</h2>
        </div>
        <p>Finanças, pendências, equipe e roteiro do grande dia em um só lugar.</p>
      </div>

      <nav className="admin-tool-tabs" aria-label="Áreas do planejamento">
        {([
          ["finance", "Financeiro"],
          ["checklist", `Checklist ${completedChecklist}/${checklist.length}`],
          ["timeline", "Cronograma da cerimonialista"],
          ["providers", `Prestadores ${providers.length}`],
        ] as [ToolTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "is-active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && <p className="admin-inline-error" role="alert">{error}</p>}
      {loading && <div className="admin-tool-loading">Preparando o planejamento…</div>}

      {!loading && activeTab === "finance" && (
        <div className="admin-tool-panel">
          <section className="admin-budget-card">
            <form onSubmit={savePlannedBudget}>
              <div><small>Orçamento geral</small><h3>Total planejado</h3><p>Defina quanto vocês pretendem investir no casamento.</p></div>
              <div className="admin-budget-input"><span>R$</span><input required inputMode="decimal" value={plannedBudgetInput} onChange={(event) => setPlannedBudgetInput(event.target.value)} placeholder="0,00" aria-label="Total planejado para o casamento" /><button type="submit" disabled={budgetBusy}>{budgetBusy ? "Salvando…" : plannedBudgetCents ? "Atualizar" : "Salvar"}</button></div>
            </form>
            <div className="admin-budget-overview">
              <div><span>Orçamento</span><strong>{plannedBudgetCents ? money(plannedBudgetCents) : "Não definido"}</strong></div>
              <div><span>Gastos lançados</span><strong>{money(finances.total)}</strong></div>
              <div className={budgetRemaining < 0 ? "is-over-budget" : ""}><span>{budgetRemaining < 0 ? "Acima do orçamento" : "Ainda disponível"}</span><strong>{plannedBudgetCents ? money(Math.abs(budgetRemaining)) : "—"}</strong></div>
              <div className="admin-budget-progress" aria-label={`${Math.round(budgetProgress)}% do orçamento comprometido`}><i style={{ width: `${budgetProgress}%` }} /></div>
            </div>
          </section>

          <div className="admin-finance-stats">
            <article><span>Total lançado</span><strong>{money(finances.total)}</strong></article>
            <article><span>Pago no Pix</span><strong>{money(finances.paidPix)}</strong></article>
            <article><span>Em parcelas</span><strong>{money(finances.installments)}</strong><small>{money(finances.installmentsPaid)} já pago</small></article>
            <article><span>Pix futuro</span><strong>{money(finances.futurePix)}</strong></article>
          </div>

          <div className="admin-finance-grid">
            <article className="admin-chart-card">
              <div className="admin-card-title"><div><small>Resumo</small><h3>Destino dos valores</h3></div></div>
              <div className="admin-donut-wrap">
                <div className="admin-donut" style={{ background: statusChart }}><span>{money(finances.total)}</span></div>
                <ul className="admin-chart-legend">
                  <li><i className="paid" />Pix pago <strong>{money(finances.paidPix)}</strong></li>
                  <li><i className="installments" />Parcelado <strong>{money(finances.installments)}</strong></li>
                  <li><i className="future" />Pix futuro <strong>{money(finances.futurePix)}</strong></li>
                </ul>
              </div>
              <div className="admin-finance-balance"><span>Já desembolsado <strong>{money(finances.paid)}</strong></span><span>A desembolsar <strong>{money(finances.pending)}</strong></span></div>
            </article>

            <article className="admin-chart-card">
              <div className="admin-card-title"><div><small>Categorias</small><h3>Distribuição dos gastos</h3></div></div>
              <div className="admin-category-chart">
                {categoryTotals.map((item) => (
                  <div key={item.category}>
                    <p><span>{item.category}</span><strong>{money(item.amountCents)}</strong></p>
                    <i><b style={{ width: `${finances.total ? (item.amountCents / Math.max(...categoryTotals.map((entry) => entry.amountCents))) * 100 : 0}%` }} /></i>
                  </div>
                ))}
                {categoryTotals.length === 0 && <p className="admin-muted-copy">Cadastre a primeira despesa para visualizar o gráfico.</p>}
              </div>
            </article>
          </div>

          <form className="admin-entry-form admin-expense-form" onSubmit={addExpense}>
            <div className="admin-card-title"><div><small>Novo lançamento</small><h3>Adicionar despesa</h3></div></div>
            <label><span>Descrição</span><input required maxLength={120} value={expenseDraft.description} onChange={(event) => setExpenseDraft({ ...expenseDraft, description: event.target.value })} placeholder="Ex.: Fotografia do casamento" /></label>
            <div className="admin-category-field">
              <label><span>Categoria</span><select value={expenseDraft.category} onChange={(event) => setExpenseDraft({ ...expenseDraft, category: event.target.value })}>{expenseCategories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
              {!addingCategory && <button className="admin-add-category" type="button" onClick={() => setAddingCategory(true)}>+ Adicionar nova categoria</button>}
              {addingCategory && <div className="admin-new-category"><input autoFocus maxLength={60} value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addExpenseCategory(); } }} placeholder="Nome da nova categoria" aria-label="Nome da nova categoria" /><button type="button" disabled={categoryBusy} onClick={() => void addExpenseCategory()}>{categoryBusy ? "Salvando…" : "Adicionar"}</button><button className="admin-cancel-category" type="button" aria-label="Cancelar nova categoria" onClick={() => { setAddingCategory(false); setNewCategoryName(""); }}>×</button></div>}
            </div>
            <label><span>Valor total</span><input required inputMode="decimal" value={expenseDraft.amount} onChange={(event) => setExpenseDraft({ ...expenseDraft, amount: event.target.value })} placeholder="0,00" /></label>
            <label><span>Forma de pagamento</span><select value={expenseDraft.paymentType} onChange={(event) => setExpenseDraft({ ...expenseDraft, paymentType: event.target.value as ExpensePaymentType })}><option value="pix_paid">Já pago no Pix</option><option value="installments">Pagamento parcelado</option><option value="pix_pending">Pix a pagar futuramente</option></select></label>
            {expenseDraft.paymentType === "installments" && <><label><span>Total de parcelas</span><input type="number" min="1" max="120" required value={expenseDraft.installmentsTotal} onChange={(event) => setExpenseDraft({ ...expenseDraft, installmentsTotal: event.target.value })} /></label><label><span>Parcelas já pagas</span><input type="number" min="0" max={expenseDraft.installmentsTotal} required value={expenseDraft.installmentsPaid} onChange={(event) => setExpenseDraft({ ...expenseDraft, installmentsPaid: event.target.value })} /></label></>}
            {expenseDraft.paymentType === "pix_pending" && <label><span>Previsão de pagamento</span><input type="date" value={expenseDraft.dueDate} onChange={(event) => setExpenseDraft({ ...expenseDraft, dueDate: event.target.value })} /></label>}
            <button type="submit" disabled={busy}>Salvar despesa</button>
          </form>

          <div className="admin-list-card admin-tool-list"><div className="admin-table-wrap"><table><thead><tr><th>Despesa</th><th>Categoria</th><th>Valor</th><th>Situação</th><th aria-label="Ações" /></tr></thead><tbody>{expenses.map((expense) => <tr key={expense.id}><td data-label="Despesa"><strong>{expense.description}</strong>{expense.dueDate && <small className="admin-payment-email">Previsto para {new Date(`${expense.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}</small>}</td><td data-label="Categoria">{expense.category}</td><td data-label="Valor">{money(expense.amountCents)}</td><td data-label="Situação">{expense.paymentType === "pix_paid" && <span className="admin-payment-status approved">Pix pago</span>}{expense.paymentType === "pix_pending" && <span className="admin-payment-status pending">Pix futuro</span>}{expense.paymentType === "installments" && <div className="admin-installment-control"><button type="button" aria-label="Diminuir parcelas pagas" onClick={() => void setPaidInstallments(expense, expense.installmentsPaid - 1)}>−</button><span>{expense.installmentsPaid}/{expense.installmentsTotal} pagas</span><button type="button" aria-label="Aumentar parcelas pagas" onClick={() => void setPaidInstallments(expense, expense.installmentsPaid + 1)}>+</button></div>}</td><td><button className="admin-remove" type="button" onClick={() => void deleteExpenseItem(expense.id)}>Remover</button></td></tr>)}</tbody></table>{expenses.length === 0 && <div className="admin-empty"><p>Nenhuma despesa cadastrada.</p></div>}</div></div>
        </div>
      )}

      {!loading && activeTab === "checklist" && (
        <div className="admin-tool-panel admin-checklist-panel">
          <form className="admin-entry-form admin-checklist-form" onSubmit={addChecklistItem}>
            <div className="admin-card-title"><div><small>Nova pendência</small><h3>Adicionar ao checklist</h3></div></div>
            <label><span>O que precisa ser feito?</span><input required maxLength={160} value={checklistTitle} onChange={(event) => setChecklistTitle(event.target.value)} placeholder="Ex.: Confirmar decoração do altar" /></label>
            <label><span>Data-limite</span><input type="date" required value={checklistDueDate} onChange={(event) => setChecklistDueDate(event.target.value)} /></label>
            <button type="submit" disabled={busy}>Adicionar item</button>
          </form>
          <div className="admin-checklist-card">
            <div className="admin-card-title"><div><small>{checklistProgress}% concluído</small><h3>Checklist do casamento</h3></div><strong>{completedChecklist}/{checklist.length}</strong></div>
            <div className="admin-progress"><i style={{ width: `${checklistProgress}%` }} /></div>
            <div className="admin-checklist-list">
              {pendingChecklist.map((item) => {
                const deadline = checklistDeadline(item);
                return (
                  <div className={deadline.tone} key={item.id}>
                    <button className="admin-check-button" type="button" aria-label={`Concluir ${item.title}`} onClick={() => void toggleChecklistItem(item)} />
                    <div className="admin-checklist-content"><strong>{item.title}</strong><small>{deadline.label}</small></div>
                    <label className="admin-checklist-date"><span>Prazo</span><input type="date" value={item.dueDate ?? ""} onChange={(event) => void updateChecklistDeadline(item, event.target.value)} aria-label={`Prazo de ${item.title}`} /></label>
                    <button className="admin-icon-remove" type="button" aria-label={`Remover ${item.title}`} onClick={() => void removeChecklistItem(item.id)}>×</button>
                  </div>
                );
              })}
              {pendingChecklist.length === 0 && <p className="admin-muted-copy">{checklist.length === 0 ? "Nenhum item adicionado ainda." : "Tudo em dia por aqui."}</p>}
            </div>
            {completedChecklistItems.length > 0 && (
              <details className="admin-checklist-completed">
                <summary><span>Concluídos</span><strong>{completedChecklistItems.length}</strong></summary>
                <div className="admin-checklist-list">
                  {completedChecklistItems.map((item) => {
                    const deadline = checklistDeadline(item);
                    return (
                      <div className={`${deadline.tone} is-complete`} key={item.id}>
                        <button className="admin-check-button" type="button" aria-label={`Desmarcar ${item.title}`} onClick={() => void toggleChecklistItem(item)}>✓</button>
                        <div className="admin-checklist-content"><strong>{item.title}</strong><small>{deadline.label}</small></div>
                        <label className="admin-checklist-date"><span>Prazo</span><input type="date" value={item.dueDate ?? ""} onChange={(event) => void updateChecklistDeadline(item, event.target.value)} aria-label={`Prazo de ${item.title}`} /></label>
                        <button className="admin-icon-remove" type="button" aria-label={`Remover ${item.title}`} onClick={() => void removeChecklistItem(item.id)}>×</button>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      {!loading && activeTab === "timeline" && (
        <div className="admin-tool-panel admin-two-column-tool">
          <form className="admin-entry-form" onSubmit={addTimelineItem}><div className="admin-card-title"><div><small>Nova etapa</small><h3>Montar cronograma da cerimonialista</h3></div></div><label><span>Horário</span><input type="time" required value={timelineDraft.time} onChange={(event) => setTimelineDraft({ ...timelineDraft, time: event.target.value })} /></label><label><span>Tarefa</span><input required maxLength={120} value={timelineDraft.title} onChange={(event) => setTimelineDraft({ ...timelineDraft, title: event.target.value })} placeholder="Ex.: Receber equipe de decoração" /></label><label><span>Orientações para a cerimonialista</span><textarea maxLength={500} value={timelineDraft.details} onChange={(event) => setTimelineDraft({ ...timelineDraft, details: event.target.value })} placeholder="Responsáveis, contatos ou observações importantes" /></label><button type="submit" disabled={busy}>Adicionar ao cronograma</button></form>
          <div className="admin-timeline-card"><div className="admin-card-title"><div><small>31 de outubro</small><h3>Cronograma da cerimonialista</h3></div><button className="admin-small-action" type="button" disabled={exportingTimeline} onClick={() => void exportTimelinePdf()}>{exportingTimeline ? "Gerando…" : "Exportar PDF"}</button></div><div className="admin-timeline-list">{timeline.map((item) => <article key={item.id}><time>{item.time}</time><div><strong>{item.title}</strong>{item.details && <p>{item.details}</p>}</div><button className="admin-icon-remove" type="button" aria-label={`Remover ${item.title}`} onClick={() => void removeTimelineItem(item.id)}>×</button></article>)}{timeline.length === 0 && <p className="admin-muted-copy">Adicione os primeiros horários para montar o roteiro.</p>}</div></div>
        </div>
      )}

      {!loading && activeTab === "providers" && (
        <div className="admin-tool-panel admin-two-column-tool">
          <form className="admin-entry-form" onSubmit={addProvider}><div className="admin-card-title"><div><small>Equipe do evento</small><h3>Adicionar prestador</h3></div></div><label><span>Nome completo</span><input required maxLength={120} value={providerDraft.name} onChange={(event) => setProviderDraft({ ...providerDraft, name: event.target.value })} placeholder="Nome da pessoa" /></label><label><span>Função</span><input required maxLength={100} value={providerDraft.role} onChange={(event) => setProviderDraft({ ...providerDraft, role: event.target.value })} placeholder="Ex.: Cerimonialista" /></label><button type="submit" disabled={busy || occupied >= 50}>Adicionar prestador</button>{occupied >= 50 && <p className="admin-form-note">As 50 vagas estão ocupadas.</p>}</form>
          <div className="admin-provider-card"><div className="admin-card-title"><div><small>Capacidade do evento</small><h3>{occupied} de 50 vagas ocupadas</h3></div><strong>{Math.max(50 - occupied, 0)}</strong></div><div className="admin-progress capacity"><i style={{ width: `${capacityPercent}%` }} /></div><p className="admin-capacity-copy">{guestsCount} convidados + {providers.length} prestadores de serviço</p><div className="admin-provider-list">{providers.map((provider) => <article key={provider.id}><span aria-hidden="true">✦</span><div><strong>{provider.name}</strong><small>{provider.role}</small></div><button className="admin-icon-remove" type="button" aria-label={`Remover ${provider.name}`} onClick={() => void removeProvider(provider.id)}>×</button></article>)}{providers.length === 0 && <p className="admin-muted-copy">Nenhum prestador adicionado ainda.</p>}</div></div>
        </div>
      )}
    </section>
  );
}
