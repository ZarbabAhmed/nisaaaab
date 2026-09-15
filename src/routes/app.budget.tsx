import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/lib/finance/types";
import { MonthSelector } from "@/components/money/MonthSelector";
import { MoneyText } from "@/components/money/MoneyText";
import { ProgressMeter } from "@/components/money/ProgressMeter";
import { StatusPill } from "@/components/money/StatusPill";
import { CategoryIcon } from "@/components/money/CategoryIcon";
import { CurrencyInput } from "@/components/money/CurrencyInput";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { EmptyState } from "@/components/common/EmptyState";
import { WeeklySpending } from "@/components/money/WeeklySpending";
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
import { monthLabel } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/budget")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Budget — Nisaab" },
      { name: "description", content: "Plan each category for the month and see planned versus actual spending." },
      { property: "og:title", content: "Budget — Nisaab" },
      { property: "og:description", content: "Set monthly amounts per category and watch your plan stay on track." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BudgetPage,
});

function BudgetPage() {
  const { state, month, summary, actions } = useApp();
  const [editing, setEditing] = useState<{ id: string; name: string; planned: number } | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Category | null>(null);

  const totalPlanned = summary.fixedPlanned + summary.variablePlanned;
  const progress = totalPlanned > 0 ? summary.totalSpent / totalPlanned : 0;
  const planned = summary.lines.filter((l) => l.planned > 0);

  const groups: { key: "fixed" | "variable"; title: string; hint: string }[] = [
    { key: "fixed", title: "Fixed commitments", hint: "Same amount every month" },
    { key: "variable", title: "Everyday spending", hint: "Changes month to month" },
  ];

  return (
    <div className="space-y-6 py-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Budget</h1>
          <p className="text-sm text-muted-foreground">{monthLabel(month)}</p>
        </div>
        <MonthSelector compact />
      </header>

      <section className="rounded-3xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Left to spend this month</p>
            <p className="mt-1 text-3xl font-extrabold tabular">
              <MoneyText value={summary.remaining} />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              of <MoneyText value={summary.totalIncome} /> coming in
            </p>
          </div>
          <StatusPill health={summary.status}>{summary.statusLabel}</StatusPill>
        </div>
        <ProgressMeter value={progress} health={summary.status} className="mt-4" label="Budget used" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini label="Income" value={summary.totalIncome} />
          <Mini label="Planned" value={totalPlanned} />
          <Mini label="Spent" value={summary.totalSpent} />
          <Mini label="Saving" value={summary.savingsTarget + summary.goalAllocation} />
        </div>
      </section>

      <WeeklySpending />

      <div className="flex flex-wrap gap-3">
        <Button className="h-12 flex-1 rounded-2xl font-bold" onClick={() => setAdding(true)}>
          <Plus className="size-4" />
          Add budget
        </Button>
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-2xl font-bold"
          onClick={() =>
            setEditing({ id: "__income", name: "Monthly income", planned: summary.plan.income })
          }
        >
          <Pencil className="size-4" />
          Edit income &amp; saving
        </Button>
      </div>

      {planned.length === 0 ? (
        <EmptyState
          icon={<Wallet className="size-6" />}
          title="Create your monthly plan"
          description="Give each category an amount so you always know what's left."
          action={
            <Button className="rounded-2xl font-bold" onClick={() => setAdding(true)}>
              Create budget
            </Button>
          }
        />
      ) : (
        groups.map((group) => {
          const lines = summary.lines.filter((l) => l.kind === group.key);
          if (lines.length === 0) return null;
          return (
            <section key={group.key} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-bold">{group.title}</h2>
                <span className="text-xs text-muted-foreground">{group.hint}</span>
              </div>
              <div className="space-y-2">
                {lines.map((line) => {
                  const category = state.categories.find((c) => c.id === line.id);
                  return (
                    <div key={line.id} className="rounded-3xl border bg-card p-4">
                      <div className="flex items-center gap-3">
                        <CategoryIcon icon={line.icon} />
                        <button
                          type="button"
                          onClick={() => setEditing({ id: line.id, name: line.name, planned: line.planned })}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block truncate text-sm font-bold">{line.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {line.planned > 0 ? (
                              <>
                                Planned <MoneyText value={line.planned} /> · Spent <MoneyText value={line.actual} />
                              </>
                            ) : (
                              "No amount planned yet"
                            )}
                          </span>
                        </button>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-extrabold tabular",
                            line.remaining < 0 ? "text-destructive" : "text-foreground",
                          )}
                        >
                          {line.remaining < 0 ? "−" : ""}
                          <MoneyText value={Math.abs(line.remaining)} />
                        </span>
                        {category?.custom ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full text-muted-foreground"
                            aria-label={`Delete ${line.name}`}
                            onClick={() => setRemoving(category)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                      <ProgressMeter value={line.progress} health={line.health} className="mt-3" label={line.name} />
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">
                        {line.planned === 0
                          ? "Tap to set an amount"
                          : line.remaining < 0
                            ? `Over by ${""}`
                            : `${Math.round((line.actual / line.planned) * 100)}% used`}
                        {line.remaining < 0 ? <MoneyText value={Math.abs(line.remaining)} className="text-destructive" /> : null}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      <EditAmountSheet editing={editing} onClose={() => setEditing(null)} />
      <AddBudgetSheet open={adding} onOpenChange={setAdding} />

      <AlertDialog open={removing !== null} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The category and its planned amount are removed. Past entries stay in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removing) {
                  actions.removeCategory(removing.id);
                  toast.success(`${removing.name} deleted`);
                }
                setRemoving(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-extrabold tabular">
        <MoneyText value={value} compact />
      </p>
    </div>
  );
}

function EditAmountSheet({
  editing,
  onClose,
}: {
  editing: { id: string; name: string; planned: number } | null;
  onClose: () => void;
}) {
  const { month, summary, actions } = useApp();
  const [amount, setAmount] = useState(0);
  const [savings, setSavings] = useState(0);
  const [goalAlloc, setGoalAlloc] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const isIncome = editing?.id === "__income";

  if (editing && loadedFor !== editing.id) {
    setLoadedFor(editing.id);
    setAmount(editing.planned);
    setSavings(summary.plan.savingsTarget);
    setGoalAlloc(summary.plan.goalAllocation);
    setError(null);
  }

  const save = () => {
    if (!editing) return;
    if (amount < 0 || savings < 0 || goalAlloc < 0) {
      setError("Amounts can't be negative.");
      return;
    }
    if (isIncome) {
      actions.setPlanField(month, { income: amount, savingsTarget: savings, goalAllocation: goalAlloc });
      toast.success("Plan updated");
    } else {
      actions.setPlanned(month, editing.id, amount);
      toast.success(`${editing.name} budget saved`);
    }
    setLoadedFor(null);
    onClose();
  };

  return (
    <ResponsiveSheet
      open={editing !== null}
      onOpenChange={(v) => {
        if (!v) {
          setLoadedFor(null);
          onClose();
        }
      }}
      title={isIncome ? "Income & saving" : `${editing?.name ?? ""} budget`}
      description={isIncome ? "Used for this month onward." : "Set what you plan to spend this month."}
    >
      <div className="space-y-5">
        <CurrencyInput
          value={amount === 0 ? "" : amount}
          onChange={setAmount}
          size="lg"
          autoFocus
          label={isIncome ? "Monthly income" : "Planned amount"}
        />
        {isIncome ? (
          <>
            <CurrencyInput value={savings === 0 ? "" : savings} onChange={setSavings} label="Monthly saving" />
            <CurrencyInput value={goalAlloc === 0 ? "" : goalAlloc} onChange={setGoalAlloc} label="Toward goals" />
          </>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex gap-3">
          {!isIncome && editing ? (
            <Button
              variant="outline"
              className="h-12 rounded-2xl font-bold"
              onClick={() => {
                actions.setPlanned(month, editing.id, 0);
                toast.success("Amount cleared");
                setLoadedFor(null);
                onClose();
              }}
            >
              Clear
            </Button>
          ) : null}
          <Button size="lg" className="h-12 flex-1 rounded-2xl font-bold" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}

function AddBudgetSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state, month, summary, actions } = useApp();
  const [categoryId, setCategoryId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [kind, setKind] = useState<"fixed" | "variable">("variable");
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const unplanned = summary.lines.filter((l) => l.planned === 0);

  const save = () => {
    if (amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (categoryId === "__new") {
      if (!newName.trim()) {
        setError("Give the category a name.");
        return;
      }
      actions.addCategory(newName.trim(), kind);
      // The new category id is generated in the store; plan it on the next tick.
      const name = newName.trim();
      setTimeout(() => {
        const created = [...state.categories].find((c) => c.name === name);
        if (created) actions.setPlanned(month, created.id, amount);
      }, 0);
      toast.success(`${name} added`, { description: "Set its amount from the list if it looks empty." });
    } else if (categoryId) {
      actions.setPlanned(month, categoryId, amount);
      toast.success("Budget added");
    } else {
      setError("Pick a category first.");
      return;
    }
    setAmount(0);
    setNewName("");
    setCategoryId("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Add budget" description="Choose a category and a monthly amount.">
      <div className="space-y-5">
        <div className="space-y-2">
          <span className="text-sm font-semibold">Category</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {unplanned.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setCategoryId(l.id)}
                aria-pressed={categoryId === l.id}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition-colors",
                  categoryId === l.id ? "border-primary bg-accent" : "hover:border-primary/40",
                )}
              >
                <CategoryIcon icon={l.icon} className="size-8 rounded-lg" />
                <span className="line-clamp-1 text-[11px] font-semibold">{l.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCategoryId("__new")}
              aria-pressed={categoryId === "__new"}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed p-2.5 text-center transition-colors",
                categoryId === "__new" ? "border-primary bg-accent" : "hover:border-primary/40",
              )}
            >
              <Plus className="size-5" />
              <span className="text-[11px] font-semibold">New</span>
            </button>
          </div>
        </div>

        {categoryId === "__new" ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Category name</Label>
              <Input id="cat-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Gym" maxLength={40} />
            </div>
            <div className="flex gap-2">
              {(["fixed", "variable"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  aria-pressed={kind === k}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                    kind === k ? "border-transparent bg-gradient-brand text-white" : "text-muted-foreground",
                  )}
                >
                  {k === "fixed" ? "Same every month" : "Changes monthly"}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <CurrencyInput value={amount === 0 ? "" : amount} onChange={setAmount} size="lg" label="Monthly amount" />

        {error ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        <Button size="lg" className="h-12 w-full rounded-2xl font-bold" onClick={save}>
          Save budget
        </Button>
      </div>
    </ResponsiveSheet>
  );
}
