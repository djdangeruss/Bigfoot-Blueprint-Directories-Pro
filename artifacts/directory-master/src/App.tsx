import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/auth/require-auth";
import { RequireAdmin } from "@/components/auth/require-admin";
import { SetupGuard } from "@/components/setup/setup-guard";

// Layouts
import { PublicLayout } from "@/components/layout/public-layout";
import { AdminLayout } from "@/components/layout/admin-layout";

// Pages
const NotFound = lazy(() => import("@/pages/not-found"));
const SetupPage = lazy(() => import("@/pages/setup"));
const HomePage = lazy(() => import("@/pages/home"));
const BrowsePage = lazy(() => import("@/pages/browse"));
const EntryPage = lazy(() => import("@/pages/entry"));
const LoginPage = lazy(() => import("@/pages/admin/login"));
const DashboardPage = lazy(() => import("@/pages/admin/dashboard"));
const AdminEntriesPage = lazy(() => import("@/pages/admin/entries"));
const AdminEntryFormPage = lazy(() => import("@/pages/admin/entries/form"));
const AdminCategoriesPage = lazy(() => import("@/pages/admin/categories"));
const AdminImportPage = lazy(() => import("@/pages/admin/import"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/settings"));
const AdminUsersPage = lazy(() => import("@/pages/admin/users"));
const AdminSeoPage = lazy(() => import("@/pages/admin/seo"));
const AdminContactsPage = lazy(() => import("@/pages/admin/contacts"));
const AdminClaimsPage = lazy(() => import("@/pages/admin/claims"));
const BuilderPage = lazy(() => import("@/pages/admin/builder"));

// colrest instance: bespoke public experience, gated at build time so sibling
// instances' bundles are untouched (dead branches tree-shake out).
const IS_COLREST = import.meta.env.VITE_THEME === "colrest-fonda";
import { ColrestShell } from "@/components/colrest/ColrestShell";
const ColrestHome = lazy(() => import("@/pages/colrest/home"));
const ColrestBrowse = lazy(() => import("@/pages/colrest/browse"));
const ColrestEntry = lazy(() => import("@/pages/colrest/entry"));
const ColrestClaim = lazy(() => import("@/pages/colrest/claim"));
const OwnerLogin = lazy(() => import("@/pages/colrest/owner-login"));
const OwnerDashboard = lazy(() => import("@/pages/colrest/owner-dashboard"));
const ColrestInfoPage = lazy(() => import("@/pages/colrest/info"));

const queryClient = new QueryClient();

function Router() {
  return (
    <Suspense fallback={<div className="flex min-h-48 items-center justify-center" role="status">Loading…</div>}>
    <Switch>
      {/* Setup Route */}
      <Route path="/setup" component={SetupPage} />

      {/* Admin Routes */}
      <Route path="/admin/login" component={LoginPage} />
      
      <Route path="/admin">
        <RequireAuth>
          <AdminLayout>
            <DashboardPage />
          </AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/entries">
        <RequireAuth>
          <AdminLayout>
            <AdminEntriesPage />
          </AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/entries/new">
        <RequireAuth>
          <AdminLayout>
            <AdminEntryFormPage />
          </AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/entries/:id/edit">
        <RequireAuth>
          <AdminLayout>
            <AdminEntryFormPage />
          </AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/categories">
        <RequireAuth>
          <AdminLayout>
            <AdminCategoriesPage />
          </AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/import">
        <RequireAuth>
          <AdminLayout>
            <AdminImportPage />
          </AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/settings">
        <RequireAuth>
          <AdminLayout>
            <AdminSettingsPage />
          </AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/users">
        <RequireAuth>
          <AdminLayout>
            <AdminUsersPage />
          </AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/seo">
        <RequireAuth>
          <AdminLayout>
            <AdminSeoPage />
          </AdminLayout>
        </RequireAuth>
      </Route>
      <Route path="/admin/contacts">
        <RequireAdmin>
          <AdminLayout>
            <AdminContactsPage />
          </AdminLayout>
        </RequireAdmin>
      </Route>
      <Route path="/admin/claims">
        <RequireAdmin>
          <AdminLayout>
            <AdminClaimsPage />
          </AdminLayout>
        </RequireAdmin>
      </Route>
      <Route path="/admin/builder/:page">
        <RequireAuth>
          <BuilderPage />
        </RequireAuth>
      </Route>

      {/* Public Routes — colrest builds get the bespoke fonda experience */}
      {IS_COLREST ? (
        <>
          <Route path="/">
            <SetupGuard><ColrestShell><ColrestHome /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/browse">
            <SetupGuard><ColrestShell><ColrestBrowse /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/browse/:category">
            <SetupGuard><ColrestShell><ColrestBrowse /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/entry/:id">
            <SetupGuard><ColrestShell><ColrestEntry /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/claim/:id">
            <SetupGuard><ColrestShell><ColrestClaim /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/owner/login">
            <SetupGuard><ColrestShell><OwnerLogin /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/owner">
            <SetupGuard><ColrestShell><OwnerDashboard /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/about">
            <SetupGuard><ColrestShell><ColrestInfoPage page="about" /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/methodology">
            <SetupGuard><ColrestShell><ColrestInfoPage page="methodology" /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/privacy">
            <SetupGuard><ColrestShell><ColrestInfoPage page="privacy" /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/terms">
            <SetupGuard><ColrestShell><ColrestInfoPage page="terms" /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/owner-terms">
            <SetupGuard><ColrestShell><ColrestInfoPage page="owner-terms" /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/accessibility">
            <SetupGuard><ColrestShell><ColrestInfoPage page="accessibility" /></ColrestShell></SetupGuard>
          </Route>
          <Route path="/corrections">
            <SetupGuard><ColrestShell><ColrestInfoPage page="corrections" /></ColrestShell></SetupGuard>
          </Route>
        </>
      ) : (
        <>
          <Route path="/">
            <SetupGuard>
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            </SetupGuard>
          </Route>
          <Route path="/browse">
            <SetupGuard>
              <PublicLayout>
                <BrowsePage />
              </PublicLayout>
            </SetupGuard>
          </Route>
          <Route path="/browse/:category">
            <SetupGuard>
              <PublicLayout>
                <BrowsePage />
              </PublicLayout>
            </SetupGuard>
          </Route>
          <Route path="/entry/:id">
            <SetupGuard>
              <PublicLayout>
                <EntryPage />
              </PublicLayout>
            </SetupGuard>
          </Route>
        </>
      )}

      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
