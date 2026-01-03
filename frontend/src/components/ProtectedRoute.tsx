import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const location = useLocation();

  useEffect(() => {
    async function run() {
      const { data } = await supabase.auth.getSession();

      // ❌ Not authenticated → auth
      if (!data.session) {
        setRedirectTo("/auth");
        setLoading(false);
        return;
      }

      // ✅ Already in workspace with repo → allow
      if (location.pathname.startsWith("/workspace/")) {
        setLoading(false);
        return;
      }

      // ✅ Authenticated → try to get recent repo
      const res = await fetch(
        "https://repomind-577n.onrender.com/user/recent-repo",
        {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        }
      );

      const json = await res.json();

      if (json.repo) {
        setRedirectTo(`/workspace/${encodeURIComponent(json.repo)}`);
      }

      setLoading(false);
    }

    run();
  }, [location.pathname]);

  if (loading) return null;
  if (redirectTo) return <Navigate to={redirectTo} replace />;

  return children;
}
