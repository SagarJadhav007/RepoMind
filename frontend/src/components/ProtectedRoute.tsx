import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const location = useLocation();
  const [status, setStatus] = useState<
    "loading" | "unauth" | "ok" | "redirect"
  >("loading");
  const [target, setTarget] = useState<string>("");

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession();

      // ❌ Not authenticated
      if (!data.session) {
        setStatus("unauth");
        return;
      }

      // ✅ Already inside workspace repo
      if (location.pathname.startsWith("/workspace/")) {
        setStatus("ok");
        return;
      }

      // ✅ Need recent repo
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
        setTarget(`/workspace/${encodeURIComponent(json.repo)}`);
        setStatus("redirect");
      } else {
        setStatus("ok");
      }
    }

    check();
  }, [location.pathname]);

  if (status === "loading") return null;

  if (status === "unauth") {
    return <Navigate to="/auth" replace />;
  }

  if (status === "redirect") {
    return <Navigate to={target} replace />;
  }

  return children;
}
