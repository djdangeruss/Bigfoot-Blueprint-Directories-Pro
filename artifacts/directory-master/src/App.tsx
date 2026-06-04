import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import NotFound from "@/pages/not-found";
// We'll import these lazily or directly as we build them
// Setup
import SetupPage from "@/pages/setup";
// Public
import HomePage from "@/pages/home";
import BrowsePage from "@/pages/browse";
import EntryPage from "@/pages/entry";
// Admin
import LoginPage from "@/pages/admin/login";
import DashboardPage from "@/pages/admin/dashboard";
import AdminEntriesPage from "@/pages/admin/entries";
import AdminEntryFormPage from "@/pages/admin/entries/form";
import AdminCategoriesPage from "@/pages/admin/categories";
import AdminImportPage from "@/pages/admin/import";
import AdminSettingsPage from "@/pages/admin/settings";
import AdminUsersPage from "@/pages/admin/users";
import AdminSeoPage from "@/pages/admin/seo";
import AdminContactsPage from "@/pages/admin/contacts";
import BuilderPage from "@/pages/admin/builder";

const queryClient = new QueryClient();

function Router() {
  return (
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
      <Route path="/admin/builder/:page">
        <RequireAuth>
          <BuilderPage />
        </RequireAuth>
      </Route>

      {/* Public Routes */}
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

      <Route component={NotFound} />
    </Switch>
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
