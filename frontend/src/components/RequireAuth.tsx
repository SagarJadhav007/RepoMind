import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setOk(!!data.session);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6">Checking session…</div>;
  if (!ok) return <Navigate to="/auth" replace />;

  return children;
}
