import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, Sun, Moon } from "lucide-react";
import { useGetPublicSettings } from "@workspace/api-client-react";
import { ScriptInjector } from "@/components/layout/ScriptInjector";
import { I18nProvider, useI18n } from "@/i18n";
import { ThemeProvider, useTheme } from "@/hooks/use-theme";
import { getOwnerToken } from "@/lib/ownerApi";
import { trackEvent } from "@/lib/colrest";

// Public shell for the colrest instance. The language pill and theme toggle sit
// together in the header — equal-weight core controls, not buried in a menu.

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center rounded-full border border-border overflow-hidden text-xs font-bold" role="group" aria-label="Language">
      {(["es", "en"] as const).map(l => (
        <button
          key={l}
          onClick={() => { setLang(l); trackEvent("language_toggle", { language: l }); }}
          className={`px-2.5 py-1.5 uppercase tracking-wide transition-colors ${
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function HeaderBrand() {
  return (
    <>
      <span className="sm:hidden">
        <img src="/brand/brand-avatar-256.png" alt="Colombian Restaurant Near Me" className="h-10 w-10 rounded-xl object-cover shadow-sm" width="40" height="40" />
      </span>
      <span className="hidden min-w-0 sm:block">
        <img src="/brand/logo-header-light.png" alt="Colombian Restaurant Near Me" className="h-auto w-[210px] object-contain dark:hidden lg:w-[315px]" width="1600" height="180" />
        <img src="/brand/logo-header-dark.png" alt="Colombian Restaurant Near Me" className="hidden h-auto w-[210px] object-contain dark:block lg:w-[315px]" width="1600" height="176" />
      </span>
    </>
  );
}

function FooterBrand() {
  return (
    <>
      <img src="/brand/logo-primary-light.png" alt="Colombian Restaurant Near Me" className="h-auto w-full max-w-[310px] object-contain dark:hidden" width="1200" height="485" loading="lazy" />
      <img src="/brand/logo-header-dark.png" alt="Colombian Restaurant Near Me" className="hidden h-auto w-full max-w-[360px] object-contain dark:block" width="1600" height="176" loading="lazy" />
    </>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { data: settings } = useGetPublicSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const [analyticsConsent, setAnalyticsConsent] = useState<"accepted" | "essential" | null>(() => {
    const saved = localStorage.getItem("colrest.analyticsConsent");
    return saved === "accepted" || saved === "essential" ? saved : null;
  });
  const hasOwnerSession = Boolean(getOwnerToken());

  const chooseConsent = (value: "accepted" | "essential") => {
    const requiresCleanReload = localStorage.getItem("colrest.analyticsConsent") === "accepted" && value === "essential";
    localStorage.setItem("colrest.analyticsConsent", value);
    setAnalyticsConsent(value);
    window.dispatchEvent(new CustomEvent("colrest-consent", { detail: value }));
    if (requiresCleanReload) window.location.reload();
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(q)}`);
      trackEvent("directory_search", { search_term: q });
      setMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ScriptInjector
        headScripts={analyticsConsent === "accepted" ? (settings as any)?.headScripts : undefined}
        bodyScripts={analyticsConsent === "accepted" ? (settings as any)?.bodyScripts : undefined}
      />

      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-card focus:px-4 focus:py-3 focus:shadow-lg">
        {t.common.skipToContent}
      </a>

      <header className="sticky top-0 z-50 border-b border-border/75 bg-card/88 shadow-[0_10px_40px_-34px_rgba(36,24,18,.75)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/" className="flex min-w-0 flex-shrink items-center" aria-label="Colombian Restaurant Near Me home">
              <HeaderBrand />
            </Link>

            <form onSubmit={submitSearch} className="relative hidden md:block flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={t.nav.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </form>

            <nav className="hidden md:flex items-center gap-3">
              <Link href="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t.nav.browse}
              </Link>
              <Link href={hasOwnerSession ? "/owner" : "/owner/login"} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {hasOwnerSession ? t.nav.dashboard : t.nav.ownerLogin}
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <LangToggle />
                <ThemeToggle />
              </div>
            </nav>

            <div className="flex md:hidden items-center gap-2">
              <LangToggle />
              <ThemeToggle />
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-3 -mr-2" aria-label="Menu" aria-expanded={menuOpen} aria-controls="mobile-directory-menu">
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-directory-menu" className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3">
            <form onSubmit={submitSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={t.nav.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </form>
            <Link href="/browse" onClick={() => setMenuOpen(false)} className="block py-1.5 text-sm font-medium">
              {t.nav.browse}
            </Link>
            <Link href={hasOwnerSession ? "/owner" : "/owner/login"} onClick={() => setMenuOpen(false)} className="block py-1.5 text-sm font-medium">
              {hasOwnerSession ? t.nav.dashboard : t.nav.ownerLogin}
            </Link>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1 flex flex-col">{children}</main>

      {analyticsConsent === null && (
        <aside role="dialog" aria-label={t.consent.title} aria-live="polite" className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-3xl rounded-[1.35rem] border border-card-border bg-card/96 p-5 shadow-2xl backdrop-blur-xl sm:bottom-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">{t.consent.title}</h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{t.consent.body} <Link href="/privacy" className="font-bold text-secondary hover:underline">{t.consent.learn}</Link></p>
            </div>
            <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
              <button onClick={() => chooseConsent("essential")} className="min-h-11 rounded-full border border-border px-4 text-sm font-bold text-foreground hover:border-primary/40">{t.consent.essential}</button>
              <button onClick={() => chooseConsent("accepted")} className="min-h-11 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground">{t.consent.accept}</button>
            </div>
          </div>
        </aside>
      )}

      <footer className="mt-auto border-t border-border bg-card">
        <div className="h-1.5 bg-gradient-to-r from-[var(--fonda-cazuela)] via-[var(--fonda-panela)] to-[var(--fonda-hoja)]" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="inline-flex" aria-label="Colombian Restaurant Near Me home">
                <FooterBrand />
              </Link>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">{t.footer.independent}</p>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-[.14em] text-foreground">{t.footer.explore}</h2>
              <nav className="mt-4 space-y-3 text-sm text-muted-foreground">
                <Link href="/browse" className="block hover:text-primary">{t.nav.browse}</Link>
                <Link href="/about" className="block hover:text-primary">{t.footer.about}</Link>
                <Link href="/accessibility" className="block hover:text-primary">{t.footer.accessibility}</Link>
              </nav>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-[.14em] text-foreground">{t.footer.trust}</h2>
              <nav className="mt-4 space-y-3 text-sm text-muted-foreground">
                <Link href="/methodology" className="block hover:text-primary">{t.footer.methodology}</Link>
                <Link href="/corrections" className="block hover:text-primary">{t.footer.corrections}</Link>
                <Link href="/privacy" className="block hover:text-primary">{t.footer.privacy}</Link>
                <Link href="/terms" className="block hover:text-primary">{t.footer.terms}</Link>
                <button onClick={() => setAnalyticsConsent(null)} className="block text-left hover:text-primary">{t.footer.cookiePreferences}</button>
              </nav>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-[.14em] text-foreground">{t.footer.owners}</h2>
              <nav className="mt-4 space-y-3 text-sm text-muted-foreground">
                <Link href={hasOwnerSession ? "/owner" : "/owner/login"} className="block hover:text-primary">{hasOwnerSession ? t.nav.dashboard : t.nav.ownerLogin}</Link>
                <Link href="/owner-terms" className="block hover:text-primary">{t.footer.ownerTerms}</Link>
                <Link href="/browse" className="block hover:text-primary">{t.entry.claimCta}</Link>
              </nav>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} colombianrestaurantnear.me</p>
            <p>{t.footer.closing}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function ColrestShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ShellInner>{children}</ShellInner>
      </I18nProvider>
    </ThemeProvider>
  );
}
