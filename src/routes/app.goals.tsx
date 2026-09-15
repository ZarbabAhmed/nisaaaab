import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PartyPopper, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Goal } from "@/lib/finance/types";
import { MoneyText } from "@/components/money/MoneyText";
import { ProgressMeter } from "@/components/money/ProgressMeter";
import { StatusPill } from "@/components/money/StatusPill";
import { CategoryIcon } from "@/components/money/CategoryIcon";
import { CurrencyInput } from "@/components/money/CurrencyInput";
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
import { etaFromDate, goalProgress } from "@/lib/finance/calc";
import { GOAL_PRESETS } from "@/lib/finance/categories";
import { achievements } from "@/lib/finance/achievements";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/goals")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Goals — Nisaab" },
      { name: "description", content: "Save toward the things you actually want, with honest timelines." },
      { property: "og:title", content: "Goals — Nisaab" },
      { property: "og:description", content: "Set a target, see what it takes each month, and track progress." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GoalsPage,
});

interface Insight {
  status: "done" | "ahead" | "ontrack" | "risk";
  label: string;
  message: string;
}

function insightFor(goal: Goal): Insight {
  const { remaining, monthsLeft } = goalProgress(goal);
  if (goal.target > 0 && goal.saved >= goal.target) {
    return { status: "done", label: "Achieved", message: "You reached this goal." };
  }
  const monthsToDate = etaFromDate(goal.targetDate);
  if (monthsToDate === null) {
    return {
      status: "ontrack",
      label: monthsLeft === null ? "No pace set" : "In progress",
      message:
        monthsLeft === null
          ? "Add a monthly contribution to see when you'll get there."
          : `At ${goal.monthlyContribution.toLocaleString()} a month you'll finish in about ${monthsLeft} months.`,
    };
  }
  if (monthsToDate === 0) {
    return { status: "risk", label: "Date reached", message: "Your target date is here — update the date or the amount." };
  }
  const required = Math.ceil(remaining / monthsToDate);
  if (goal.monthlyContribution >= required) {
    return {
      status: goal.monthlyContribution > required * 1.1 ? "ahead" : "ontrack",
      label: goal.monthlyContribution > required * 1.1 ? "Ahead of schedule" : "On track",
      message: `You need about ${required.toLocaleString()} a month and you're putting in ${goal.monthlyContribution.toLocaleString()}.`,
    };
  }
  return {
    status: "risk",
    label: "At risk",
    message: `At your current pace you'll need about ${(required - goal.monthlyContribution).toLocaleString()} more per month.`,
  };
}

function GoalsPage() {
  const { state, actions } = useApp();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [removing, setRemoving] = useState<Goal | null>(null);
  const [depositFor, setDepositFor] = useState<Goal | null>(null);

  const earned = achievements(state).filter((a) => a.earned);

  return (
    <div className="space-y-6 py-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Goals</h1>
          <p className="text-sm text-muted-foreground">Things you're saving toward.</p>
        </div>
        <Button className="h-11 rounded-2xl font-bold" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New goal
        </Button>
      </header>

      {state.goals.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title="Start working toward something"
          description="A car, a laptop, a trip — name it and we'll show you exactly what it takes each month."
          action={
            <Button className="rounded-2xl font-bold" onClick={() => setCreating(true)}>
              Create a goal
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {state.goals.map((goal) => {
            const p = goalProgress(goal);
            const insight = insightFor(goal);
            const monthsToDate = etaFromDate(goal.targetDate);
            const done = insight.status === "done";
            return (
              <section key={goal.id} className={cn("rounded-3xl border bg-card p-5", done && "border-success/40")}>
                <div className="flex items-start gap-3">
                  <CategoryIcon icon={goal.icon} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.targetDate
                        ? `Target ${new Date(goal.targetDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
                        : "No target date"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full text-muted-foreground"
                    aria-label={`Edit ${goal.name}`}
                    onClick={() => setEditing(goal)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full text-muted-foreground"
                    aria-label={`Delete ${goal.name}`}
                    onClick={() => setRemoving(goal)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {done ? (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-success/10 px-4 py-3 text-success">
                    <PartyPopper className="size-5 shrink-0" aria-hidden />
                    <p className="text-sm font-bold">Goal achieved — {goal.name} is fully funded.</p>
                  </div>
                ) : null}

                <p className="mt-4 text-2xl font-extrabold tabular">
                  <MoneyText value={goal.saved} />
                  <span className="ml-2 align-middle text-sm font-semibold text-muted-foreground">
                    of <MoneyText value={goal.target} />
                  </span>
                </p>
                <ProgressMeter value={p.progress} gradient className="mt-3" label={goal.name} />

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusPill health={insight.status === "risk" ? "warn" : "good"}>{insight.label}</StatusPill>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {Math.round(p.progress * 100)}% complete
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{insight.message}</p>

                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Mini label="Remaining" value={<MoneyText value={p.remaining} compact />} />
                  <Mini label="Monthly" value={<MoneyText value={goal.monthlyContribution} compact />} />
                  <Mini
                    label="Months left"
                    value={monthsToDate !== null ? `${monthsToDate}` : p.monthsLeft !== null ? `${p.monthsLeft}` : "—"}
                  />
                  <Mini
                    label="Needed monthly"
                    value={
                      monthsToDate && monthsToDate > 0 ? (
                        <MoneyText value={Math.ceil(p.remaining / monthsToDate)} compact />
                      ) : (
                        "—"
                      )
                    }
                  />
                </dl>

                {p.nextMilestone !== null ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Next milestone: <MoneyText value={p.nextMilestone} />
                  </p>
                ) : null}

                {!done ? (
                  <Button className="mt-4 h-11 w-full rounded-2xl font-bold" onClick={() => setDepositFor(goal)}>
                    <Plus className="size-4" />
                    Add money to this goal
                  </Button>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      {earned.length > 0 ? (
        <section className="rounded-3xl border bg-card p-5">
          <h2 className="text-base font-bold">Milestones reached</h2>
          <ul className="mt-3 space-y-2">
            {earned.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>
                  <span className="block text-sm font-bold">{a.label}</span>
                  <span className="block text-xs text-muted-foreground">{a.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <GoalSheet
        open={creating || editing !== null}
        goal={editing}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />

      <ResponsiveSheet
        open={depositFor !== null}
        onOpenChange={(v) => !v && setDepositFor(null)}
        title={`Add to ${depositFor?.name ?? "goal"}`}
        description="This also counts toward your savings total."
      >
        <DepositForm
          onSave={(amount) => {
            if (depositFor) {
              actions.addDeposit({ amount, target: "goal", goalId: depositFor.id, note: `Toward ${depositFor.name}` });
              toast.success("Added to your goal", { description: "Progress and savings totals are updated." });
            }
            setDepositFor(null);
          }}
        />
      </ResponsiveSheet>

      <AlertDialog open={removing !== null} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The goal and its progress are removed. Money already recorded stays in your savings history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removing) {
                  actions.deleteGoal(removing.id);
                  toast.success("Goal deleted");
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

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-muted px-3 py-2.5">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-extrabold tabular">{value}</dd>
    </div>
  );
}

function DepositForm({ onSave }: { onSave: (amount: number) => void }) {
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-5">
      <CurrencyInput value={amount === 0 ? "" : amount} onChange={setAmount} size="lg" autoFocus label="Amount" />
      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        size="lg"
        className="h-12 w-full rounded-2xl font-bold"
        onClick={() => {
          if (amount <= 0) {
            setError("Enter an amount greater than zero.");
            return;
          }
          onSave(amount);
        }}
      >
        Add
      </Button>
    </div>
  );
}

function GoalSheet({
  open,
  goal,
  onOpenChange,
}: {
  open: boolean;
  goal: Goal | null;
  onOpenChange: (v: boolean) => void;
}) {
  const { actions } = useApp();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("sparkles");
  const [target, setTarget] = useState(0);
  const [saved, setSaved] = useState(0);
  const [monthly, setMonthly] = useState(0);
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<"high" | "normal">("normal");
  const [error, setError] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const key = goal?.id ?? "__new";
  if (open && loadedFor !== key) {
    setLoadedFor(key);
    setName(goal?.name ?? "");
    setIcon(goal?.icon ?? "sparkles");
    setTarget(goal?.target ?? 0);
    setSaved(goal?.saved ?? 0);
    setMonthly(goal?.monthlyContribution ?? 0);
    setTargetDate(goal?.targetDate ?? "");
    setError(null);
  }

  const close = () => {
    setLoadedFor(null);
    onOpenChange(false);
  };

  const save = () => {
    if (!name.trim()) {
      setError("Give your goal a name.");
      return;
    }
    if (target <= 0) {
      setError("The target must be greater than zero.");
      return;
    }
    if (saved > target) {
      setError("Amount already saved can't be more than the target.");
      return;
    }
    if (monthly < 0) {
      setError("Monthly contribution can't be negative.");
      return;
    }
    if (targetDate && targetDate < new Date().toISOString().slice(0, 10)) {
      setError("Pick a target date in the future.");
      return;
    }
    if (goal) {
      actions.updateGoal(goal.id, {
        name: name.trim(),
        icon,
        target,
        saved,
        monthlyContribution: monthly,
        targetDate: targetDate || undefined,
      });
      toast.success("Goal updated");
    } else {
      actions.addGoal({
        name: name.trim(),
        icon,
        target,
        saved,
        monthlyContribution: monthly,
        ...(targetDate ? { targetDate } : {}),
      });
      toast.success("Goal created", { description: "You can add money to it any time." });
    }
    close();
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(v) => (v ? onOpenChange(true) : close())}
      title={goal ? "Edit goal" : "New goal"}
      description="Name it, set a target, and we'll do the maths."
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="goal-name">Goal name</Label>
          <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="New laptop" maxLength={60} />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold">Pick an icon</span>
          <div className="grid grid-cols-4 gap-2">
            {GOAL_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setIcon(p.icon);
                  if (!name.trim() && p.id !== "custom") setName(p.name);
                }}
                aria-pressed={icon === p.icon}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-colors",
                  icon === p.icon ? "border-primary bg-accent" : "hover:border-primary/40",
                )}
              >
                <CategoryIcon icon={p.icon} className="size-8 rounded-lg" />
                <span className="text-[11px] font-semibold">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <CurrencyInput value={target === 0 ? "" : target} onChange={setTarget} size="lg" label="Target amount" />
        <div className="grid gap-3 sm:grid-cols-2">
          <CurrencyInput value={saved === 0 ? "" : saved} onChange={setSaved} label="Already saved" />
          <CurrencyInput value={monthly === 0 ? "" : monthly} onChange={setMonthly} label="Monthly contribution" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="goal-date">Target date (optional)</Label>
            <Input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <span className="text-sm font-semibold">Priority</span>
            <div className="flex gap-2">
              {(["high", "normal"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  aria-pressed={priority === p}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                    priority === p ? "border-transparent bg-gradient-brand text-white" : "text-muted-foreground",
                  )}
                >
                  {p === "high" ? "Important" : "Normal"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        <Button size="lg" className="h-12 w-full rounded-2xl font-bold" onClick={save}>
          {goal ? "Save changes" : "Create goal"}
        </Button>
      </div>
    </ResponsiveSheet>
  );
}
