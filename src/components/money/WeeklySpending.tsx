import { MoneyText } from "@/components/money/MoneyText";
import { ProgressMeter } from "@/components/money/ProgressMeter";
import { StatusPill } from "@/components/money/StatusPill";
import { summarizeWeek } from "@/lib/finance/calc";
import { useApp } from "@/lib/store/app-store";
import { formatDay } from "@/lib/finance/format";

/** Weekly allowance, spent, remaining, daily average and days left. */
export function WeeklySpending() {
  const { state, month, summary } = useApp();
  const week = summarizeWeek(state, month);
  const daysLeftInWeek = Math.max(
    1,
    7 - Math.floor((Date.now() - new Date(week.weekStart).getTime()) / 86_400_000),
  );
  const dailyAverage = week.spent / Math.max(8 - daysLeftInWeek, 1);

  return (
    <section className="rounded-3xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">This week</h2>
          <p className="text-xs text-muted-foreground">
            {formatDay(week.weekStart)} – {formatDay(week.weekEnd)}
          </p>
        </div>
        <StatusPill health={week.status}>
          {week.status === "good" ? "Comfortable" : week.status === "warn" ? "Watch it" : "Over"}
        </StatusPill>
      </div>

      <p className="mt-3 text-2xl font-extrabold tabular">
        <MoneyText value={Math.max(week.remaining, 0)} />
        <span className="ml-2 align-middle text-sm font-semibold text-muted-foreground">left to spend</span>
      </p>
      <ProgressMeter
        value={week.safe > 0 ? week.spent / week.safe : 0}
        health={week.status}
        className="mt-3"
        label="Weekly spending"
      />
      <p className="mt-2 text-sm text-muted-foreground">{week.message}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Item label="Weekly allowance" value={<MoneyText value={week.safe} compact />} />
        <Item label="Spent" value={<MoneyText value={week.spent} compact />} />
        <Item label="Daily average" value={<MoneyText value={dailyAverage} compact />} />
        <Item label="Days left" value={`${daysLeftInWeek} of 7`} />
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        {summary.daysLeft} days left in {""}
        this month.
      </p>
    </section>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-muted px-3 py-2.5">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-extrabold tabular">{value}</dd>
    </div>
  );
}
