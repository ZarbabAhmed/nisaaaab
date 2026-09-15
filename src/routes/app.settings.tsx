import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  ChevronRight,
  Coins,
  Download,
  HelpCircle,
  Info,
  LogOut,
  Moon,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { CURRENCIES, getCurrency } from "@/lib/finance/currencies";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/settings")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Settings — Nisaab" },
      { name: "description", content: "Currency, appearance, security, notifications and your data." },
      { property: "og:title", content: "Settings — Nisaab" },
      { property: "og:description", content: "Control how Nisaab looks and behaves for you." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const currency = getCurrency(state.profile.currency);

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nisaab-data.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded");
    } catch {
      toast.error("We couldn't prepare the download", { description: "Please try again." });
    }
  };

  return (
    <div className="space-y-6 py-5">
      <header>
        <h1 className="text-xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Make the app work the way you do.</p>
      </header>

      <Group title="Money">
        <Row icon={<Coins className="size-[18px]" />} title="Currency" value={`${currency.name} · ${currency.prefix.trim()}`} onClick={() => setCurrencyOpen(true)} />
        <RowLink icon={<User className="size-[18px]" />} title="Profile & income" to="/app/profile" />
      </Group>

      <Group title="App">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Ico>
            <Moon className="size-[18px]" />
          </Ico>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Dark mode</p>
            <p className="text-xs text-muted-foreground">Easier on the eyes at night.</p>
          </div>
          <Switch
            checked={state.theme === "dark"}
            onCheckedChange={(v) => {
              actions.setTheme(v ? "dark" : "light");
              toast.success(v ? "Dark mode on" : "Light mode on");
            }}
            aria-label="Dark mode"
          />
        </div>
        <Row icon={<Bell className="size-[18px]" />} title="Notifications" value="Reminders & summaries" onClick={() => setNotifOpen(true)} />
        <Row icon={<Shield className="size-[18px]" />} title="Security" value={`${state.profile.pinLength}-digit PIN`} onClick={() => setSecurityOpen(true)} />
      </Group>

      <Group title="Data & privacy">
        <Row icon={<Download className="size-[18px]" />} title="Export my data" value="Download a copy" onClick={exportData} />
        <Row
          icon={<Trash2 className="size-[18px]" />}
          title="Delete my account"
          value="Removes everything"
          destructive
          onClick={() => setDeleteOpen(true)}
        />
      </Group>

      <Group title="More">
        <RowLink icon={<HelpCircle className="size-[18px]" />} title="Terms & how this works" to="/terms" />
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Ico>
            <Info className="size-[18px]" />
          </Ico>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">About Nisaab</p>
            <p className="text-xs text-muted-foreground">
              A personal budgeting companion. It never holds, moves or transfers money.
            </p>
          </div>
        </div>
      </Group>

      <Button
        variant="outline"
        className="h-12 w-full rounded-2xl font-bold"
        onClick={() => {
          actions.signOut();
          toast.success("Signed out");
          void navigate({ to: "/auth", search: { mode: "login" } });
        }}
      >
        <LogOut className="size-4" />
        Sign out
      </Button>

      <CurrencySheet open={currencyOpen} onOpenChange={setCurrencyOpen} />

      <ResponsiveSheet open={notifOpen} onOpenChange={setNotifOpen} title="Notifications" description="Choose what you'd like to be reminded about.">
        <NotificationPrefs />
      </ResponsiveSheet>

      <ResponsiveSheet open={securityOpen} onOpenChange={setSecurityOpen} title="Security" description="Keep your numbers private.">
        <SecurityPrefs onDone={() => setSecurityOpen(false)} />
      </ResponsiveSheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your plan, transactions, savings and goals are permanently removed from this device. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my account</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                actions.deleteAccount();
                toast.success("Account deleted");
                void navigate({ to: "/" });
              }}
            >
              Delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function Ico({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
      {children}
    </span>
  );
}

function Row({
  icon,
  title,
  value,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60">
      <Ico>{icon}</Ico>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm font-bold", destructive && "text-destructive")}>{title}</span>
        {value ? <span className="block truncate text-xs text-muted-foreground">{value}</span> : null}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}

function RowLink({ icon, title, to }: { icon: React.ReactNode; title: string; to: "/app/profile" | "/terms" }) {
  return (
    <Link to={to} className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60">
      <Ico>{icon}</Ico>
      <span className="min-w-0 flex-1 text-sm font-bold">{title}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

export function CurrencySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state, actions } = useApp();
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pick = (code: string) => {
    actions.updateProfile({ currency: code });
    toast.success("Currency updated", { description: "All amounts now show in your chosen currency." });
    onOpenChange(false);
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Currency"
      description="Your amounts stay the same — only how they're shown changes."
    >
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => pick(c.code)}
              aria-pressed={state.profile.currency === c.code}
              className={cn(
                "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
                state.profile.currency === c.code ? "border-primary bg-accent" : "hover:border-primary/40",
              )}
            >
              <span>
                <span className="block text-sm font-bold">{c.code}</span>
                <span className="block text-xs text-muted-foreground">{c.name}</span>
              </span>
              <span className="text-sm font-extrabold">{c.prefix.trim()}</span>
            </button>
          ))}
        </div>

        <div className="space-y-1.5 rounded-2xl border border-dashed p-4">
          <Label htmlFor="custom-currency">Write your own</Label>
          <div className="flex gap-2">
            <Input
              id="custom-currency"
              value={custom}
              onChange={(e) => setCustom(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. QAR"
            />
            <Button
              className="rounded-2xl font-bold"
              onClick={() => {
                if (custom.trim().length < 2) {
                  setError("Enter at least two characters.");
                  return;
                }
                setError(null);
                pick(custom.trim());
              }}
            >
              Use
            </Button>
          </div>
          {error ? (
            <p role="alert" className="text-xs font-semibold text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </ResponsiveSheet>
  );
}

function NotificationPrefs() {
  const [prefs, setPrefs] = useState({ weekly: true, overspend: true, payday: true, goals: false });
  const items: { key: keyof typeof prefs; title: string; detail: string }[] = [
    { key: "weekly", title: "Weekly check-in", detail: "A short summary of what you spent." },
    { key: "overspend", title: "Overspending alerts", detail: "When a category passes its plan." },
    { key: "payday", title: "Payday reminder", detail: "A nudge to plan the month." },
    { key: "goals", title: "Goal updates", detail: "When a goal hits a milestone." },
  ];
  return (
    <div className="divide-y">
      {items.map((i) => (
        <div key={i.key} className="flex items-center gap-3 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{i.title}</p>
            <p className="text-xs text-muted-foreground">{i.detail}</p>
          </div>
          <Switch
            checked={prefs[i.key]}
            onCheckedChange={(v) => {
              setPrefs((p) => ({ ...p, [i.key]: v }));
              toast.success(v ? `${i.title} on` : `${i.title} off`);
            }}
            aria-label={i.title}
          />
        </div>
      ))}
    </div>
  );
}

function SecurityPrefs({ onDone }: { onDone: () => void }) {
  const { state, actions } = useApp();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const length = state.profile.pinLength;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl border p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Unlock with fingerprint or face</p>
          <p className="text-xs text-muted-foreground">Uses your device's own security when available.</p>
        </div>
        <Switch
          checked={state.profile.biometric}
          onCheckedChange={(v) => {
            actions.updateProfile({ biometric: v });
            toast.success(v ? "Device unlock on" : "Device unlock off");
          }}
          aria-label="Device unlock"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-bold">Change your {length}-digit PIN</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-pin">New PIN</Label>
            <Input
              id="new-pin"
              inputMode="numeric"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, length))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pin">Confirm PIN</Label>
            <Input
              id="confirm-pin"
              inputMode="numeric"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, length))}
            />
          </div>
        </div>
        {error ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}
        <Button
          className="h-12 w-full rounded-2xl font-bold"
          onClick={() => {
            if (pin.length !== length) {
              setError(`Your PIN needs ${length} digits.`);
              return;
            }
            if (pin !== confirm) {
              setError("Both PINs must match.");
              return;
            }
            setError(null);
            setPin("");
            setConfirm("");
            toast.success("PIN updated");
            onDone();
          }}
        >
          Save PIN
        </Button>
      </div>
    </div>
  );
}
