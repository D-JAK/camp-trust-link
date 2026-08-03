import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUp, LifeBuoy, Languages, MapPinned, Moon, PhoneCall, Plus, Sun, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useOnline } from "@/lib/useGeolocation";
import { formatIst } from "@/lib/format";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", labelKey: "nav.camps", icon: MapPinned },
  { to: "/report", labelKey: "nav.report", icon: Plus },
  { to: "/helplines", labelKey: "nav.help", icon: LifeBuoy },
] as const;

function Toggles() {
  const { locale, setLocale, t } = useI18n();
  const { theme, toggle } = useTheme();
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setLocale(locale === "en" ? "ml" : "en")}
        aria-label={t("lang.toggle")}
        className="tap-target inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
      >
        <Languages className="size-4" />
        {locale === "en" ? "മലയാളം" : "English"}
      </button>
      <button
        type="button"
        onClick={toggle}
        aria-label={t("theme.toggle")}
        className="tap-target inline-flex items-center justify-center rounded-lg border border-border transition-colors hover:bg-secondary"
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </div>
  );
}

function Wordmark() {
  const { t } = useI18n();
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
        <LifeBuoy className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-base font-bold leading-tight">{t("app.name")}</span>
        <span className="block truncate text-[0.7rem] text-muted-foreground">{t("app.tagline")}</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const online = useOnline();
  const [showTop, setShowTop] = useState(false);
  const [updatedAt] = useState(() => new Date());
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop / tablet sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface p-4 lg:flex">
        <Wordmark />
        <nav className="mt-6 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "tap-target flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <a
          href="tel:1077"
          className="tap-target mt-4 flex items-center justify-center gap-2 rounded-lg bg-critical px-3 text-sm font-bold text-critical-foreground"
        >
          <PhoneCall className="size-4" />
          1077
        </a>
        <p className="mt-auto text-[0.7rem] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">{t("disclaimer.title")}.</span> {t("disclaimer.body")}
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
            <Wordmark />
            <a
              href="tel:1077"
              className="tap-target inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-critical px-3 text-sm font-bold text-critical-foreground"
            >
              <PhoneCall className="size-4" />
              1077
            </a>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2">
            <span className="truncate text-[0.7rem] text-muted-foreground">
              {t("freshness.updated", { time: formatIst(updatedAt) })}
            </span>
            <Toggles />
          </div>
        </header>

        {/* Desktop header */}
        <header className="sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-border bg-surface/95 px-6 py-3 backdrop-blur lg:flex">
          <span className="text-xs text-muted-foreground">
            {t("freshness.updated", { time: formatIst(updatedAt) })}
          </span>
          <Toggles />
        </header>

        {!online ? (
          <div className="flex items-center gap-2 bg-unverified-soft px-4 py-2 text-sm text-unverified">
            <WifiOff className="size-4 shrink-0" />
            <span>
              {t("offline.title")} — {t("offline.cached", { time: formatIst(updatedAt) })}
            </span>
          </div>
        ) : null}

        {/* GUARD-3: persistent, non-dismissible */}
        <p className="border-b border-border bg-secondary px-4 py-2 text-[0.72rem] leading-relaxed text-secondary-foreground lg:hidden">
          <span className="font-semibold">{t("disclaimer.title")}.</span> {t("disclaimer.body")}
        </p>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 sm:px-6 lg:pb-12">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-surface/98 backdrop-blur lg:hidden">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2.5 text-[0.7rem] font-medium",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {showTop ? (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={t("action.backToTop")}
            className="tap-target fixed bottom-20 right-4 z-30 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-panel lg:bottom-6"
          >
            <ArrowUp className="size-5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
