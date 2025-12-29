import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export default function ConnectGithub() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/auth");
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Button
        onClick={() => {
          window.location.href =
            "https://github.com/apps/RepoMind-App/installations/new";
        }}
      >
        Connect GitHub Repositories
      </Button>
    </div>
  );
}
