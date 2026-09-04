import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, X, ShieldCheck, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Admin review queue: ownership claims + tier upgrade requests.
// Backed by /api/claims (admin bearer auth).

async function adminFetch(token: string | null, method: string, path: string, body?: unknown) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function AdminClaimsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: claims, isLoading: loadingClaims } = useQuery({
    queryKey: ["admin-claims"],
    queryFn: () => adminFetch(token, "GET", "/claims?status=pending"),
    enabled: !!token,
  });
  const { data: upgrades, isLoading: loadingUpgrades } = useQuery({
    queryKey: ["admin-upgrade-requests"],
    queryFn: () => adminFetch(token, "GET", "/claims/upgrade-requests"),
    enabled: !!token,
  });

  const pendingUpgrades = (upgrades ?? []).filter((u: any) => u.status === "pending");

  const act = async (kind: "claim" | "upgrade", id: number, action: "approve" | "reject") => {
    setBusyId(`${kind}-${id}`);
    try {
      const path = kind === "claim" ? `/claims/${id}` : `/claims/upgrade-requests/${id}`;
      await adminFetch(token, "PATCH", path, { action });
      toast({ title: `${kind === "claim" ? "Claim" : "Upgrade"} ${action}d` });
      qc.invalidateQueries({ queryKey: ["admin-claims"] });
      qc.invalidateQueries({ queryKey: ["admin-upgrade-requests"] });
    } catch (err) {
      toast({ title: "Action failed", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-5xl">
      <section>
        <h1 className="text-2xl font-bold mb-1">Ownership Claims</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Approving links the owner account to the listing and sets it to claimed/free.
        </p>
        {loadingClaims ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : !claims?.length ? (
          <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-6 text-center">Nothing pending.</p>
        ) : (
          <div className="space-y-3">
            {claims.map((c: any) => (
              <div key={c.id} className="rounded-lg border p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{c.entryTitle}</span>
                    {c.method === "domain-match" ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 gap-1">
                        <ShieldCheck className="h-3 w-3" /> domain match
                      </Badge>
                    ) : (
                      <Badge variant="secondary">manual review</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                    <Mail className="h-3.5 w-3.5" /> {c.ownerName} · {c.businessEmail}
                    {c.phone ? ` · ${c.phone}` : ""}
                    {c.entryWebsite ? ` · site: ${c.entryWebsite}` : ""}
                  </p>
                  {c.message && <p className="text-sm mt-1.5 italic">"{c.message}"</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" disabled={busyId === `claim-${c.id}`} onClick={() => act("claim", c.id, "approve")}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={busyId === `claim-${c.id}`} onClick={() => act("claim", c.id, "reject")}>
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-1">Upgrade Requests</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Approving sets the listing's subscriptionTier (premium also flags it featured). Billing is handled off-platform for now.
        </p>
        {loadingUpgrades ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : !pendingUpgrades.length ? (
          <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-6 text-center">Nothing pending.</p>
        ) : (
          <div className="space-y-3">
            {pendingUpgrades.map((u: any) => (
              <div key={u.id} className="rounded-lg border p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{u.entryTitle}</span>
                    <Badge>{u.requestedTier}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{u.ownerName} · {u.ownerEmail}</p>
                  {u.message && <p className="text-sm mt-1.5 italic">"{u.message}"</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" disabled={busyId === `upgrade-${u.id}`} onClick={() => act("upgrade", u.id, "approve")}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={busyId === `upgrade-${u.id}`} onClick={() => act("upgrade", u.id, "reject")}>
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
