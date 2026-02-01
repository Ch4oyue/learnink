import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * ShareTargetHandler - PWA Share Target Handler
 * ============================================
 * This component handles incoming data from the PWA Share Target API.
 * It extracts the shared title, text, or url and redirects the user
 * to the Requests page with pre-filled information.
 */
export default function ShareTargetHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const title = searchParams.get("title") || "";
    const text = searchParams.get("text") || "";
    const url = searchParams.get("url") || "";

    // Build the description from text and url
    let description = text;
    if (url) {
      description = description ? `${description}\n\nSource: ${url}` : url;
    }

    // Redirect to the requests page with pre-filled data
    // We use query params that DashboardRequests.tsx will pick up
    const params = new URLSearchParams();
    if (title) params.set("topic", title);
    if (description) params.set("description", description);
    params.set("openCreate", "true");

    navigate(`/dashboard/requests?${params.toString()}`, { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-4 rounded-full bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Processing Shared Content</h2>
          <p className="text-muted-foreground">Mohon tunggu sebentar...</p>
        </div>
      </div>
    </div>
  );
}
