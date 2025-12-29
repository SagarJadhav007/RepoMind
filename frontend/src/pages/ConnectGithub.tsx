import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function ConnectGithub() {
  const connect = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Not authenticated");
      return;
    }

    const userId = session.user.id;

    window.location.href =
      `https://github.com/apps/RepoMind-App/installations/new?state=${userId}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Button onClick={connect}>
        Connect GitHub Repositories
      </Button>
    </div>
  );
}
