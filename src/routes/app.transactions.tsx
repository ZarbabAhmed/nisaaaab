import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Receipt, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Transaction } from "@/lib/finance/types";
import { MoneyText } from "@/components/money/MoneyText";
import { CurrencyInput } from "@/components/money/CurrencyInput";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { useQuickAdd } from "@/components/transactions/QuickAdd";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp } from "@/lib/store/app-store";
import { monthKey, monthLabel, shiftMonth } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/transactions")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Activity — Nisaab" },
      { name: "description", content: "Every income and expense you have recorded, searchable and filterable." },
      { property: "og:title", content: "Activity — Nisaab" },
      { property: "og:description", content: "Search, filter and edit everything you have recorded." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TransactionsPage,
});

type KindFilter = "all" | "income" | "expense";
type RangeFilter = "this" | "last" | "custom" | "everything";

function TransactionsPage() {
  const { state } = useApp();
  const { openExpense } = useQuickAdd();
  const [kind, setKind] = useState<KindFilter>("all");
  const [range, setRange] = useState<RangeFilter>("this");
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);

  const current = monthKey(new Date());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.transactions
      .filter((t) => (kind === "all" ? true : t.type === kind))
      .filter((t) => (category === "all" ? true : t.categoryId === category))
      .filter((t) => {
        if (range === "this") return t.date.slice(0, 7) === current;
        if (range === "last") return t.date.slice(0, 7) === shiftMonth(current, -1);
        if (range === "custom") return (!from || t.date >= from) && (!to || t.date <= to);
        return true;
      })
      .filter((t) => {
        if (!q) return true;
        const name = state.categories.find((c) => c.id === t.categoryId)?.name ?? t.categoryId;
        return `${t.note ?? ""} ${name} ${t.amount}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.transactions, state.categories, kind, category, range, from, to, query, current]);

  const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const spent = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="space-y-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Activity</h1>
          <p className="text-sm text-muted-foreground">Everything you have recorded.</p>
        </div>
        <Button className="h-11 rounded-2xl font-bold" onClick={openExpense}>
          <Plus className="size-4" />
          Add transaction
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Money in</p>
          <p className="mt-0.5 text-lg font-extrabold text-success tabular">
            <MoneyText value={income} />
          </p>
        </div>
        <div className="rounded-2xl border bg-card px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Money out</p>
          <p className="mt-0.5 text-lg font-extrabold tabular">
            <MoneyText value={spent} />
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, categories or amounts"
            className="h-11 rounded-2xl pl-10"
            aria-label="Search transactions"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            ["all", "All"],
            ["income", "Income"],
            ["expense", "Expenses"],
          ] as const).map(([id, label]) => (
            <Pill key={id} active={kind === id} onClick={() => setKind(id)}>
              {label}
            </Pill>
          ))}
          <span className="mx-1 w-px self-stretch bg-border" aria-hidden />
          {([
            ["this", monthLabel(current, "short")],
            ["last", monthLabel(shiftMonth(current, -1), "short")],
            ["custom", "Custom dates"],
            ["everything", "All time"],
          ] as const).map(([id, label]) => (
            <Pill key={id} active={range === id} onClick={() => setRange(id)}>
              {label}
            </Pill>
          ))}
        </div>

        {range === "custom" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Pill active={category === "all"} onClick={() => setCategory("all")}>
            Every category
          </Pill>
          {state.categories.map((c) => (
            <Pill key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.name}
            </Pill>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-6" />}
          title="No transactions yet"
          description="Record what you spend and earn — every screen updates from it."
          action={
            <Button className="rounded-2xl font-bold" onClick={openExpense}>
              Add your first transaction
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, list]) => (
            <section key={date} className="rounded-3xl border bg-card p-4">
              <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {new Date(date).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long" })}
              </h2>
              <div className="divide-y">
                {list.map((t) => (
                  <TransactionRow key={t.id} txn={t} onSelect={setEditing} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <EditTransactionSheet txn={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
        active ? "border-transparent bg-gradient-brand text-white" : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EditTransactionSheet({ txn, onClose }: { txn: Transaction | null; onClose: () => void }) {
  const { state, actions } = useApp();
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (txn && loadedFor !== txn.id) {
    setLoadedFor(txn.id);
    setAmount(txn.amount);
    setDate(txn.date);
    setNote(txn.note ?? "");
    setCategoryId(txn.categoryId);
    setError(null);
  }

  const close = () => {
    setLoadedFor(null);
    onClose();
  };

  const save = () => {
    if (!txn) return;
    if (amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!date) {
      setError("Pick a valid date.");
      return;
    }
    actions.updateTransaction(txn.id, {
      amount,
      date,
      categoryId,
      note: note.trim() ? note.trim() : undefined,
    });
    toast.success("Transaction updated", { description: "Your budget and totals have been recalculated." });
    close();
  };

  return (
    <>
      <ResponsiveSheet
        open={txn !== null}
        onOpenChange={(v) => !v && close()}
        title="Edit transaction"
        description="Changes update your budget and totals right away."
      >
        <div className="space-y-5">
          <CurrencyInput value={amount === 0 ? "" : amount} onChange={setAmount} size="lg" label="Amount" />

          {txn?.type === "expense" ? (
            <div className="space-y-1.5">
              <Label htmlFor="edit-category">Category</Label>
              <select
                id="edit-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-11 w-full rounded-2xl border bg-card px-3 text-sm font-semibold"
              >
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-date">Date</Label>
              <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-note">Note</Label>
              <Input id="edit-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {error ? (
            <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex gap-3">
            <Button variant="outline" className="h-12 rounded-2xl font-bold text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" />
              Delete
            </Button>
            <Button size="lg" className="h-12 flex-1 rounded-2xl font-bold" onClick={save}>
              Save changes
            </Button>
          </div>
        </div>
      </ResponsiveSheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from your history and your totals will be recalculated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (txn) {
                  actions.deleteTransaction(txn.id);
                  toast.success("Transaction deleted");
                }
                setConfirmDelete(false);
                close();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
