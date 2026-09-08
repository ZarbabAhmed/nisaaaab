import { useState } from "react";
import { Info } from "lucide-react";
import { MoneyText } from "@/components/money/MoneyText";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { useApp } from "@/lib/store/app-store";

/** Explains, line by line, why the safe-to-spend number is what it is. */
export function SafeToSpendDetail() {
  const [open, setOpen] = useState(false);
  const { summary } = useApp();

  const fixedLeft = Math.max(summary.fixedPlanned - summary.fixedActual, 0);
  const savingLeft = Math.max(summary.savingsTarget - summary.savedThisMonth - summary.emergencyContributed, 0);
  const goalLeft = Math.max(summary.goalAllocation - summary.goalContributed, 0);

  const rows = [
    { label: "Money you have this month", value: summary.totalIncome, sign: "+" as const },
    { label: "Already spent", value: summary.totalSpent, sign: "−" as const },
    {
      label: "Already set aside",
      value: summary.savedThisMonth + summary.emergencyContributed + summary.goalContributed,
      sign: "−" as const,
    },
    { label: "Bills still due", value: fixedLeft, sign: "−" as const },
    { label: "Saving still planned", value: savingLeft, sign: "−" as const },
    { label: "Goal money still planned", value: goalLeft, sign: "−" as const },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/25"
      >
        <Info className="size-3.5" aria-hidden />
        Why this number?
      </button>

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title="How this is worked out"
        description="Safe to spend is what's left once everything you've promised is covered."
      >
        <div className="space-y-1">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 border-b py-3 last:border-0">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <span className="shrink-0 text-sm font-bold tabular">
                {r.sign}
                <MoneyText value={r.value} />
              </span>
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-accent px-4 py-3.5 text-accent-foreground">
            <span className="text-sm font-bold">Safe to spend</span>
            <span className="text-lg font-extrabold tabular">
              <MoneyText value={summary.safeToSpend} />
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            That's roughly <MoneyText value={Math.max(summary.dailySafe, 0)} /> a day for the {summary.daysLeft} days
            left. Spending it doesn't touch your bills, your saving, or your goals.
          </p>
        </div>
      </ResponsiveSheet>
    </>
  );
}
