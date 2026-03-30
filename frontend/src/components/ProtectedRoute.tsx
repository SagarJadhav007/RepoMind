import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Status = "loading" | "unauth" | "ok" | "redirect";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const location = useLocation();
  const [status, setStatus] = useState<Status>("loading");
  const [target, setTarget] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const handleAuthenticated = async (session: any) => {
      if (!isMounted) return;

      // Already inside workspace repo
      if (location.pathname.startsWith("/workspace/")) {
        setStatus("ok");
        return;
      }

      try {
        const res = await fetch(
          "https://repomind-577n.onrender.com/user/recent-repo",
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const json = await res.json();

        if (json?.repo) {
          setTarget(`/workspace/${encodeURIComponent(json.repo)}`);
          setStatus("redirect");
        } else {
          setStatus("ok");
        }
      } catch (err) {
        console.error("Recent repo fetch failed:", err);
        setStatus("ok");
      }
    };

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session) {
        await handleAuthenticated(session);
      } else {
        setStatus("unauth");
      }
    };

    // Listen for auth changes (VERY IMPORTANT for OAuth redirect)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;

        if (session) {
          handleAuthenticated(session);
        } else {
          setStatus("unauth");
        }
      }
    );

    init();

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [location.pathname]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // Not authenticated
  if (status === "unauth") {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to recent repo
  if (status === "redirect") {
    return <Navigate to={target} replace />;
  }

  return children;
}
