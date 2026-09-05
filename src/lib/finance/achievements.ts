import type { AppState } from "./types";
import { getPlan, summarize } from "./calc";
import { monthKey, shiftMonth } from "./format";

export interface Achievement {
  id: string;
  label: string;
  detail: string;
  earned: boolean;
}

/** Quiet, factual milestones derived only from real data. */
export function achievements(state: AppState): Achievement[] {
  const current = monthKey(new Date());
  const plan = getPlan(state, current);
  const plannedAny = Object.values(plan.planned).some((v) => v > 0);
  const totalSaved =
    state.savingsDeposits.reduce((s, d) => s + d.amount, 0) + state.emergency.current;
  const monthsWithSaving = new Set(state.savingsDeposits.map((d) => d.month));
  const lastThree = [current, shiftMonth(current, -1), shiftMonth(current, -2)];
  const consistent = lastThree.every((m) => monthsWithSaving.has(m));
  const previous = shiftMonth(current, -1);
  const prevSummary = state.plans.some((p) => p.month === previous)
    ? summarize(state, previous)
    : null;

  return [
    {
      id: "first-budget",
      label: "First plan created",
      detail: "You set monthly amounts for your categories.",
      earned: plannedAny,
    },
    {
      id: "first-transaction",
      label: "First entry recorded",
      detail: "Tracking is what makes the numbers real.",
      earned: state.transactions.length > 0,
    },
    {
      id: "saved-10k",
      label: "First 10,000 saved",
      detail: "Money set aside across savings, backup and goals.",
      earned: totalSaved >= 10000,
    },
    {
      id: "emergency-started",
      label: "Backup fund started",
      detail: "You have money set aside for surprises.",
      earned: state.emergency.current > 0,
    },
    {
      id: "month-complete",
      label: "First month completed",
      detail: "A full month of income, spending and saving.",
      earned: prevSummary !== null,
    },
    {
      id: "under-budget",
      label: "Stayed within plan",
      detail: "Last month you spent less than you planned.",
      earned: prevSummary !== null && prevSummary.totalSpent <= prevSummary.fixedPlanned + prevSummary.variablePlanned,
    },
    {
      id: "consistent-saver",
      label: "Saved three months running",
      detail: "Consistency beats big one-off deposits.",
      earned: consistent,
    },
    {
      id: "goal-completed",
      label: "Goal reached",
      detail: "You finished something you saved for.",
      earned: state.goals.some((g) => g.target > 0 && g.saved >= g.target),
    },
  ];
}
