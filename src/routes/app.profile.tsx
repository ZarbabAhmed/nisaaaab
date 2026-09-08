import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, ChevronRight, Coins, Pencil } from "lucide-react";
import { toast } from "sonner";
import { MoneyText } from "@/components/money/MoneyText";
import { CurrencyInput } from "@/components/money/CurrencyInput";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencySheet } from "@/routes/app.settings";
import { useApp } from "@/lib/store/app-store";
import { getCurrency } from "@/lib/finance/currencies";
import { ordinal } from "@/lib/finance/format";
import { achievements } from "@/lib/finance/achievements";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Nisaab" },
      { name: "description", content: "Your details, income, payday and currency preferences." },
      { property: "og:title", content: "Profile — Nisaab" },
      { property: "og:description", content: "Keep your income, payday and personal details up to date." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { state, month, summary, actions } = useApp();
  const [editing, setEditing] = useState(false);
  const [money, setMoney] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const profile = state.profile;
  const currency = getCurrency(profile.currency);
  const initials = (profile.name || "You")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const earned = achievements(state).filter((a) => a.earned).length;

  return (
    <div className="space-y-6 py-5">
      <header>
        <h1 className="text-xl font-extrabold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your details and money preferences.</p>
      </header>

      <section className="flex items-center gap-4 rounded-3xl border bg-card p-5">
        <span className="relative inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-xl font-extrabold text-white">
          {initials}
          <span className="absolute -bottom-1 -right-1 inline-flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-muted-foreground">
            <Camera className="size-3" aria-hidden />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold">{profile.name || "Add your name"}</p>
          <p className="truncate text-sm text-muted-foreground">{profile.email || profile.phone || "No contact added"}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {profile.userType === "job" ? "Salaried" : "Business owner"} · {earned} milestones reached
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-9 rounded-full" aria-label="Edit profile" onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
        </Button>
      </section>

      <Group title="Personal information">
        <Row label="Name" value={profile.name || "—"} onClick={() => setEditing(true)} />
        <Row label="Email" value={profile.email || "Not added"} onClick={() => setEditing(true)} />
        <Row label="Phone" value={profile.phone || "Not added"} onClick={() => setEditing(true)} />
        <Row label="I am" value={profile.userType === "job" ? "Salaried" : "Business owner"} onClick={() => setEditing(true)} />
      </Group>

      <Group title="Money preferences">
        <Row label="Currency" value={`${currency.name} · ${currency.prefix.trim()}`} onClick={() => setCurrencyOpen(true)} />
        <Row label="Monthly income" value={<MoneyText value={summary.plan.income} />} onClick={() => setMoney(true)} />
        <Row label="Payday" value={`${ordinal(summary.plan.salaryDay)} of every month`} onClick={() => setMoney(true)} />
        <Row label="Monthly saving" value={<MoneyText value={summary.plan.savingsTarget} />} onClick={() => setMoney(true)} />
      </Group>

      <section className="space-y-2">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">More</h2>
        <div className="divide-y overflow-hidden rounded-3xl border bg-card">
          <Link to="/app/settings" className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Coins className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-sm font-bold">Settings, security & data</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </div>
      </section>

      <ResponsiveSheet open={editing} onOpenChange={setEditing} title="Personal information" description="Only you can see this.">
        <PersonalForm onDone={() => setEditing(false)} />
      </ResponsiveSheet>

      <ResponsiveSheet
        open={money}
        onOpenChange={setMoney}
        title="Income & payday"
        description={`Applies to ${new Date(`${month}-01`).toLocaleDateString("en-US", { month: "long" })} onward.`}
      >
        <MoneyForm onDone={() => setMoney(false)} />
      </ResponsiveSheet>

      <CurrencySheet open={currencyOpen} onOpenChange={setCurrencyOpen} />
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="divide-y overflow-hidden rounded-3xl border bg-card">{children}</div>
    </section>
  );
}

function Row({ label, value, onClick }: { label: string; value: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60">
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="block truncate text-sm font-bold">{value}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}

function PersonalForm({ onDone }: { onDone: () => void }) {
  const { state, actions } = useApp();
  const [name, setName] = useState(state.profile.name);
  const [email, setEmail] = useState(state.profile.email ?? "");
  const [phone, setPhone] = useState(state.profile.phone ?? "");
  const [userType, setUserType] = useState(state.profile.userType);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="p-name">Name</Label>
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-email">Email</Label>
          <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-phone">Phone</Label>
          <Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
        </div>
      </div>
      <div className="space-y-2">
        <span className="text-sm font-semibold">I am</span>
        <div className="flex gap-2">
          {(["job", "business"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setUserType(t)}
              aria-pressed={userType === t}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                userType === t ? "border-transparent bg-gradient-brand text-white" : "text-muted-foreground",
              )}
            >
              {t === "job" ? "Salaried" : "Business owner"}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        size="lg"
        className="h-12 w-full rounded-2xl font-bold"
        onClick={() => {
          if (!name.trim()) {
            setError("Please add your name.");
            return;
          }
          if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("That email doesn't look right.");
            return;
          }
          actions.updateProfile({
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            userType,
          });
          toast.success("Profile updated");
          onDone();
        }}
      >
        Save changes
      </Button>
    </div>
  );
}

function MoneyForm({ onDone }: { onDone: () => void }) {
  const { month, summary, actions } = useApp();
  const [income, setIncome] = useState(summary.plan.income);
  const [savings, setSavings] = useState(summary.plan.savingsTarget);
  const [day, setDay] = useState(summary.plan.salaryDay);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <CurrencyInput value={income === 0 ? "" : income} onChange={setIncome} size="lg" label="Monthly income" />
      <CurrencyInput value={savings === 0 ? "" : savings} onChange={setSavings} label="Monthly saving" />
      <div className="space-y-1.5">
        <Label htmlFor="payday">Payday</Label>
        <Input
          id="payday"
          type="number"
          min={1}
          max={31}
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
        />
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        size="lg"
        className="h-12 w-full rounded-2xl font-bold"
        onClick={() => {
          if (income < 0 || savings < 0) {
            setError("Amounts can't be negative.");
            return;
          }
          if (savings > income && income > 0) {
            setError("Saving more than your income isn't possible.");
            return;
          }
          if (day < 1 || day > 31) {
            setError("Payday must be between 1 and 31.");
            return;
          }
          actions.setPlanField(month, { income, savingsTarget: savings });
          actions.updateProfile({});
          toast.success("Income updated", { description: "Your plan and safe-to-spend have been recalculated." });
          onDone();
        }}
      >
        Save
      </Button>
    </div>
  );
}
