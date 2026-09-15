import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BarChart3 } from "lucide-react";
import { MoneyText } from "@/components/money/MoneyText";
import { ProgressMeter } from "@/components/money/ProgressMeter";
import { StatusPill } from "@/components/money/StatusPill";
import { CategoryIcon } from "@/components/money/CategoryIcon";
import { EmptyState } from "@/components/common/EmptyState";
import { MonthSelector } from "@/components/money/MonthSelector";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store/app-store";
import { summarize } from "@/lib/finance/calc";
import { monthKey, monthLabel, shiftMonth } from "@/lib/finance/format";

export const Route = createFileRoute("/app/review")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Monthly review — Nisaab" },
      { name: "description", content: "How the month went: income, spending, saving and what to change next." },
      { property: "og:title", content: "Monthly review — Nisaab" },
      { property: "og:description", content: "A clear month-end summary with a comparison to last month." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { state, month, summary, setMonth } = useApp();
  const previousKey = shiftMonth(month, -1);
  const hasPrevious = state.plans.some((p) => p.month === previousKey) || state.transactions.some((t) => t.date.slice(0, 7) === previousKey);
  const previous = hasPrevious ? summarize(state, previousKey) : null;

  const saved = summary.savedThisMonth + summary.emergencyContributed + summary.goalContributed;
  const spentLines = [...summary.lines].filter((l) => l.actual > 0).sort((a, b) => b.actual - a.actual);
  const biggest = spentLines[0];
  const over = summary.lines.filter((l) => l.planned > 0 && l.actual > l.planned);
  const nextMonth = shiftMonth(month, 1);
  const canAdvance = nextMonth <= monthKey(new Date());

  if (summary.totalIncome === 0 && summary.totalSpent === 0) {
    return (
      <div className="space-y-6 py-5">
        <Header month={month} />
        <EmptyState
          icon={<BarChart3 className="size-6" />}
          title="Nothing to review yet"
          description="Once you record income and spending for this month, your summary appears here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-5">
      <Header month={month} />

      <section className="rounded-3xl bg-gradient-hero p-6 text-white shadow-hero">
        <p className="text-xs font-bold uppercase tracking-wide text-white/75">{monthLabel(month)} summary</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">
          <MoneyText value={saved} animate />
        </p>
        <p className="mt-2 text-sm text-white/80">saved this month</p>
        <div className="mt-4">
          <StatusPill health={summary.status} onDark>
            {summary.statusLabel}
          </StatusPill>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cell label="Income" value={summary.totalIncome} compare={previous?.totalIncome} />
        <Cell label="Spent" value={summary.totalSpent} compare={previous?.totalSpent} />
        <Cell label="Saved" value={saved} compare={previous ? previous.savedThisMonth + previous.emergencyContributed + previous.goalContributed : undefined} />
        <Cell label="Remaining" value={summary.remaining} compare={previous?.remaining} />
      </section>

      <section className="rounded-3xl border bg-card p-5">
        <h2 className="text-base font-bold">Budget performance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You planned <MoneyText value={summary.fixedPlanned + summary.variablePlanned} /> and spent{" "}
          <MoneyText value={summary.totalSpent} />.
        </p>
        <ProgressMeter
          value={
            summary.fixedPlanned + summary.variablePlanned > 0
              ? summary.totalSpent / (summary.fixedPlanned + summary.variablePlanned)
              : 0
          }
          health={summary.status}
          className="mt-4"
          label="Budget used"
        />
        {biggest ? (
          <p className="mt-4 text-sm">
            Biggest category: <span className="font-bold">{biggest.name}</span> at <MoneyText value={biggest.actual} />.
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border bg-card p-5">
        <h2 className="text-base font-bold">Where the money went</h2>
        <div className="mt-4 space-y-4">
          {spentLines.slice(0, 6).map((line) => (
            <div key={line.id} className="flex items-center gap-3">
              <CategoryIcon icon={line.icon} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-bold">{line.name}</span>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular">
                    <MoneyText value={line.actual} />
                  </span>
                </div>
                <ProgressMeter
                  value={summary.totalSpent > 0 ? line.actual / summary.totalSpent : 0}
                  health={line.health}
                  className="mt-2"
                  label={line.name}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {over.length > 0 ? (
        <section className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="text-base font-bold text-destructive">Over plan</h2>
          <ul className="mt-3 space-y-2">
            {over.map((l) => (
              <li key={l.id} className="flex items-center justify-between text-sm">
                <span className="font-semibold">{l.name}</span>
                <span className="font-extrabold text-destructive tabular">
                  +<MoneyText value={Math.abs(l.remaining)} /> over
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {state.goals.length > 0 ? (
        <section className="rounded-3xl border bg-card p-5">
          <h2 className="text-base font-bold">Goals progress</h2>
          <div className="mt-4 space-y-4">
            {state.goals.map((g) => (
              <div key={g.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-bold">{g.name}</span>
                  <span className="text-xs font-semibold text-muted-foreground tabular">
                    <MoneyText value={g.saved} /> / <MoneyText value={g.target} />
                  </span>
                </div>
                <ProgressMeter value={g.target > 0 ? g.saved / g.target : 0} gradient className="mt-2" label={g.name} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {previous ? (
        <section className="rounded-3xl border bg-card p-5">
          <h2 className="text-base font-bold">Compared with {monthLabel(previousKey, "short")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You spent{" "}
            <span className="font-bold text-foreground">
              <MoneyText value={Math.abs(summary.totalSpent - previous.totalSpent)} />
            </span>{" "}
            {summary.totalSpent >= previous.totalSpent ? "more" : "less"} and saved{" "}
            <span className="font-bold text-foreground">
              <MoneyText
                value={Math.abs(saved - (previous.savedThisMonth + previous.emergencyContributed + previous.goalContributed))}
              />
            </span>{" "}
            {saved >= previous.savedThisMonth + previous.emergencyContributed + previous.goalContributed ? "more" : "less"}.
          </p>
        </section>
      ) : null}

      {canAdvance ? (
        <Button className="h-12 w-full rounded-2xl font-bold" onClick={() => setMonth(nextMonth)}>
          Continue to {monthLabel(nextMonth, "short")}
          <ArrowRight className="size-4" />
        </Button>
      ) : (
        <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Your fixed commitments, income and saving plan carry into next month automatically. One-off spending does not
          repeat, and this month's history stays exactly as it is.
        </p>
      )}
    </div>
  );
}

function Header({ month }: { month: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Monthly review</h1>
        <p className="text-sm text-muted-foreground">{monthLabel(month)}</p>
      </div>
      <MonthSelector compact />
    </header>
  );
}

function Cell({ label, value, compare }: { label: string; value: number; compare?: number | undefined }) {
  const diff = compare === undefined ? null : value - compare;
  return (
    <div className="rounded-2xl border bg-card px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-extrabold tabular">
        <MoneyText value={value} compact />
      </p>
      {diff !== null ? (
        <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
          {diff === 0 ? "Same as last month" : `${diff > 0 ? "+" : "−"}${Math.abs(diff).toLocaleString()} vs last month`}
        </p>
      ) : null}
    </div>
  );
}
