import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitBranch, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const { toast } = useToast();

  const loginWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.origin + "/profile-setup",
      },
    });

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/" className="flex items-center gap-2 text-sm mb-4">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            <GitBranch className="h-8 w-8 text-primary" />
            <CardTitle>RepoMind</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-muted-foreground text-sm">
            Sign in with GitHub to continue
          </p>
        </CardContent>

        <CardFooter>
          <Button className="w-full gap-2" onClick={loginWithGithub}>
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 0c-6.626 0-12 5.373-12 12..."
              />
            </svg>
            Continue with GitHub
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
