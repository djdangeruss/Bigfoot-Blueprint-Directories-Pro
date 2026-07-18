import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ownerApi, setOwnerToken, OwnerApiError } from "@/lib/ownerApi";
import { useI18n } from "@/i18n";

export default function OwnerLogin() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await ownerApi.login(email, password);
      setOwnerToken(res.token ?? "cookie-session");
      setLocation("/owner");
    } catch (err) {
      setError(err instanceof OwnerApiError ? err.message : t.common.error);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="max-w-md mx-auto px-4 py-16 w-full">
      <div className="rounded-lg border border-card-border bg-card overflow-hidden">
        <div className="toldo" aria-hidden />
        <div className="p-8">
          <h1 className="font-display text-2xl font-semibold">{t.owner.loginTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{t.owner.loginSubtitle}</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="owner-email" className="block text-sm font-medium mb-1.5">{t.owner.email}</label>
              <input id="owner-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="owner-password" className="block text-sm font-medium mb-1.5">{t.owner.password}</label>
              <input id="owner-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {busy ? t.owner.signingIn : t.owner.signIn}
            </button>
          </form>

          <p className="text-xs text-muted-foreground mt-6 text-center">
            <Link href="/browse" className="hover:text-foreground underline underline-offset-2">{t.owner.noAccount}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
