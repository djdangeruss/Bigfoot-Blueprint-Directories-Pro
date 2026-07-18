import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, Sun, Moon, UtensilsCrossed } from "lucide-react";
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

function ShellInner({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { data: settings } = useGetPublicSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const hasOwnerSession = Boolean(getOwnerToken());

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
        headScripts={(settings as any)?.headScripts}
        bodyScripts={(settings as any)?.bodyScripts}
      />

      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/" className="flex items-center gap-2 min-w-0 flex-shrink">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UtensilsCrossed className="h-4 w-4" />
              </span>
              <span className="font-display font-semibold text-base md:text-lg leading-none truncate">
                Colombian Restaurant<span className="text-primary"> Near Me</span>
              </span>
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
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2" aria-label="Menu">
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3">
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

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="border-t border-border bg-card mt-auto">
        <div className="toldo" aria-hidden />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} colombianrestaurantnear.me</p>
          <div className="flex items-center gap-5">
            {(settings as any)?.privacyPolicyUrl && (
              <a href={(settings as any).privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Privacy</a>
            )}
            {(settings as any)?.termsUrl && (
              <a href={(settings as any).termsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Terms</a>
            )}
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
