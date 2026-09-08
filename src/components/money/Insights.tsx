import { AlertCircle, Check, Info } from "lucide-react";
import { summarizeWeek, goalProgress } from "@/lib/finance/calc";
import { formatMoney } from "@/lib/finance/format";
import { useApp } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

type Tone = "good" | "warn" | "info";

/** Short, factual notes derived only from the user's own numbers. */
export function Insights() {
  const { state, month, summary } = useApp();
  const currency = state.profile.currency;
  const money = (n: number) => formatMoney(Math.round(n), currency);
  const week = summarizeWeek(state, month);
  const notes: { id: string; tone: Tone; text: string }[] = [];

  if (summary.safeToSpend > 0) {
    notes.push({
      id: "safe",
      tone: "good",
      text: `You have ${money(summary.safeToSpend)} you can safely spend for the rest of this month.`,
    });
  } else if (summary.totalIncome > 0) {
    notes.push({
      id: "safe-over",
      tone: "warn",
      text: `You're ${money(Math.abs(summary.safeToSpend))} beyond your plan — trimming an everyday category will help.`,
    });
  }

  if (week.safe > 0) {
    const used = Math.round((week.spent / week.safe) * 100);
    if (used >= 80) {
      notes.push({
        id: "week",
        tone: used > 100 ? "warn" : "info",
        text: `You've used ${used}% of this week's spending room.`,
      });
    }
  }

  const over = summary.lines.filter((l) => l.planned > 0 && l.actual > l.planned);
  for (const l of over.slice(0, 2)) {
    notes.push({
      id: `over-${l.id}`,
      tone: "warn",
      text: `${l.name} is ${money(Math.abs(l.remaining))} over its plan this month.`,
    });
  }

  const comfortable = summary.lines
    .filter((l) => l.kind === "variable" && l.planned > 0 && l.actual / l.planned < 0.6)
    .slice(0, 1);
  for (const l of comfortable) {
    notes.push({ id: `under-${l.id}`, tone: "good", text: `You're comfortably under your ${l.name.toLowerCase()} budget.` });
  }

  const goal = state.goals[0];
  if (goal) {
    const p = goalProgress(goal);
    notes.push({
      id: "goal",
      tone: p.remaining === 0 ? "good" : "info",
      text: p.remaining === 0 ? `${goal.name} is fully funded.` : `${goal.name}: ${money(p.remaining)} to go — ${p.etaLabel.toLowerCase()}.`,
    });
  }

  if (notes.length === 0) return null;

  return (
    <section className="rounded-3xl border bg-card p-5">
      <h2 className="text-base font-bold">What this means</h2>
      <ul className="mt-3 space-y-3">
        {notes.slice(0, 4).map((n) => {
          const Icon = n.tone === "good" ? Check : n.tone === "warn" ? AlertCircle : Info;
          return (
            <li key={n.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full",
                  n.tone === "good" && "bg-success/12 text-success",
                  n.tone === "warn" && "bg-destructive/12 text-destructive",
                  n.tone === "info" && "bg-accent text-accent-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="text-sm">{n.text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
