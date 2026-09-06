import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PiggyBank, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { DepositTarget } from "@/lib/finance/types";
import { MoneyText } from "@/components/money/MoneyText";
import { ProgressMeter } from "@/components/money/ProgressMeter";
import { CurrencyInput } from "@/components/money/CurrencyInput";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store/app-store";
import { emergencyProgress } from "@/lib/finance/calc";
import { formatDay, monthLabel, todayISO } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/savings")({
  head: () => ({
    meta: [
      { title: "Savings — Nisaab" },
      { name: "description", content: "Track your monthly saving, backup fund and money set aside for goals." },
      { property: "og:title", content: "Savings — Nisaab" },
      { property: "og:description", content: "See what you have set aside and how your backup fund is growing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SavingsPage,
});

function SavingsPage() {
  const { state, month, summary, actions } = useApp();
  const [adding, setAdding] = useState(false);
  const [editingFund, setEditingFund] = useState(false);

  const emergency = emergencyProgress(state);
  const general = state.savingsDeposits.filter((d) => d.target === "savings").reduce((s, d) => s + d.amount, 0);
  const towardGoals = state.goals.reduce((s, g) => s + g.saved, 0);
  const total = general + emergency.current + towardGoals;
  const thisMonth = state.savingsDeposits.filter((d) => d.month === month);
  const history = [...state.savingsDeposits].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);

  return (
    <div className="space-y-6 py-5">
      <header>
        <h1 className="text-xl font-extrabold tracking-tight">Savings</h1>
        <p className="text-sm text-muted-foreground">Money you have deliberately kept aside.</p>
      </header>

      <section className="rounded-3xl bg-gradient-hero p-6 text-white shadow-hero">
        <p className="text-xs font-bold uppercase tracking-wide text-white/75">Total saved</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">
          <MoneyText value={total} animate />
        </p>
        <p className="mt-2 text-sm text-white/80">
          <MoneyText value={thisMonth.reduce((s, d) => s + d.amount, 0)} /> added in {monthLabel(month, "short")}.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="General savings" value={general} />
        <Tile label="Backup fund" value={emergency.current} />
        <Tile label="Toward goals" value={towardGoals} />
      </div>

      <Button className="h-12 w-full rounded-2xl font-bold" onClick={() => setAdding(true)}>
        <Plus className="size-4" />
        Add savings
      </Button>

      <section className="rounded-3xl border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-bold">Emergency backup</h2>
              <p className="text-xs text-muted-foreground">For the months that surprise you.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full font-bold" onClick={() => setEditingFund(true)}>
            Manage
          </Button>
        </div>

        {emergency.target === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="size-6" />}
            title="Build your financial backup"
            description="Set a target — even three months of essentials makes a real difference."
            action={
              <Button className="rounded-2xl font-bold" onClick={() => setEditingFund(true)}>
                Start saving
              </Button>
            }
            className="mt-4 border-0 bg-transparent py-6"
          />
        ) : (
          <>
            <p className="mt-4 text-2xl font-extrabold tabular">
              <MoneyText value={emergency.current} />
              <span className="ml-2 align-middle text-sm font-semibold text-muted-foreground">
                of <MoneyText value={emergency.target} />
              </span>
            </p>
            <ProgressMeter value={emergency.progress} gradient className="mt-3" label="Emergency fund" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Mini label="Complete" value={`${Math.round(emergency.progress * 100)}%`} />
              <Mini label="Still needed" value={<MoneyText value={emergency.remaining} compact />} />
              <Mini
                label="Estimated"
                value={emergency.monthsLeft === null ? "Set a monthly amount" : `${emergency.monthsLeft} months`}
              />
            </div>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">Saving history</h2>
        {history.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="size-6" />}
            title="Nothing set aside yet"
            description="Add your first deposit and watch your total grow."
            action={
              <Button className="rounded-2xl font-bold" onClick={() => setAdding(true)}>
                Start saving
              </Button>
            }
          />
        ) : (
          <div className="divide-y rounded-3xl border bg-card px-4">
            {history.map((d) => {
              const goal = d.goalId ? state.goals.find((g) => g.id === d.goalId) : undefined;
              const label =
                d.target === "savings" ? "General savings" : d.target === "emergency" ? "Backup fund" : (goal?.name ?? "Goal");
              return (
                <div key={d.id} className="flex items-center gap-3 py-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <PiggyBank className="size-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{d.note?.trim() || label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {label} · {formatDay(d.date)}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-success tabular">
                    +<MoneyText value={d.amount} />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Saving planned for {monthLabel(month, "short")}: <MoneyText value={summary.savingsTarget} /> · added so far{" "}
        <MoneyText value={summary.savedThisMonth + summary.emergencyContributed} />.
      </p>

      <AddSavingsSheet open={adding} onOpenChange={setAdding} />

      <ResponsiveSheet
        open={editingFund}
        onOpenChange={setEditingFund}
        title="Emergency backup"
        description="A target and a monthly amount is all it takes."
      >
        <FundForm
          target={state.emergency.target}
          monthly={state.emergency.monthlyContribution}
          onSave={(t, m) => {
            actions.setEmergency({ target: t, monthlyContribution: m });
            toast.success("Backup fund updated");
            setEditingFund(false);
          }}
        />
      </ResponsiveSheet>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border bg-card px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular">
        <MoneyText value={value} />
      </p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-muted px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-extrabold tabular">{value}</p>
    </div>
  );
}

function FundForm({
  target,
  monthly,
  onSave,
}: {
  target: number;
  monthly: number;
  onSave: (target: number, monthly: number) => void;
}) {
  const [t, setT] = useState(target);
  const [m, setM] = useState(monthly);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-5">
      <CurrencyInput value={t === 0 ? "" : t} onChange={setT} size="lg" label="Target" autoFocus />
      <CurrencyInput value={m === 0 ? "" : m} onChange={setM} label="Monthly contribution" />
      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        size="lg"
        className="h-12 w-full rounded-2xl font-bold"
        onClick={() => {
          if (t < 0 || m < 0) {
            setError("Amounts can't be negative.");
            return;
          }
          onSave(t, m);
        }}
      >
        Save
      </Button>
    </div>
  );
}

function AddSavingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state, actions } = useApp();
  const [amount, setAmount] = useState(0);
  const [target, setTarget] = useState<DepositTarget>("savings");
  const [goalId, setGoalId] = useState<string>(state.goals[0]?.id ?? "");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const options: { id: DepositTarget; label: string }[] = [
    { id: "savings", label: "General savings" },
    { id: "emergency", label: "Backup fund" },
    { id: "goal", label: "A goal" },
  ];

  const save = () => {
    if (amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (target === "goal" && !goalId) {
      setError("Create a goal first, then you can send money to it.");
      return;
    }
    actions.addDeposit({
      amount,
      target,
      ...(target === "goal" ? { goalId } : {}),
      date,
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    toast.success("Savings added", { description: "Your totals and progress are updated." });
    setAmount(0);
    setNote("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Add savings" description="Where should this money go?">
      <div className="space-y-5">
        <CurrencyInput value={amount === 0 ? "" : amount} onChange={setAmount} size="lg" autoFocus label="Amount" />

        <div className="space-y-2">
          <span className="text-sm font-semibold">Put it toward</span>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setTarget(o.id)}
                aria-pressed={target === o.id}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                  target === o.id ? "border-transparent bg-gradient-brand text-white" : "text-muted-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {target === "goal" ? (
          <div className="space-y-1.5">
            <Label htmlFor="deposit-goal">Goal</Label>
            <select
              id="deposit-goal"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="h-11 w-full rounded-2xl border bg-card px-3 text-sm font-semibold"
            >
              <option value="">Choose a goal</option>
              {state.goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="deposit-date">Date</Label>
            <Input id="deposit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deposit-note">Note (optional)</Label>
            <Input id="deposit-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Month-end saving" />
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        <Button size="lg" className="h-12 w-full rounded-2xl font-bold" onClick={save}>
          Save
        </Button>
      </div>
    </ResponsiveSheet>
  );
}
