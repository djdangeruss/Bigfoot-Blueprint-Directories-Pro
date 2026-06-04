import { useLocation } from "wouter";
import { useGetSetupStatus } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export function SetupGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: status, isLoading } = useGetSetupStatus();

  useEffect(() => {
    if (status && !status.installed) {
      setLocation("/setup");
    }
  }, [status, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status && !status.installed) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
