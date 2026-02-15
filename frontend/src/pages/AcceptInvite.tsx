import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InviteData {
  repo_full_name: string;
  role: "contributor" | "maintainer";
  inviter_name: string;
  expires_at: string;
}

export default function AcceptInvite() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!code) {
      setError("Invalid invite link");
      setLoading(false);
      return;
    }

    checkAuth().then(() => validateInvite());
  }, [code]);

  const checkAuth = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    } catch (err) {
      console.error("Auth check failed:", err);
    }
  };

  const validateInvite = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://repomind-577n.onrender.com/invite/validate?code=${code}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Invalid or expired invite");
      }

      const data = await response.json();
      setInvite(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate invite");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    try {
      setAccepting(true);
      const session = (await supabase.auth.getSession()).data.session;

      if (!session) {
        // Redirect to login if not authenticated
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `https://repomind-577n.onrender.com/invite/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            code: code,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to accept invite");
      }

      setSuccess(true);
      toast({
        title: "Success",
        description: `You've been added to ${invite?.repo_full_name} as ${invite?.role}`,
      });

      // Redirect to repository after 2 seconds
      setTimeout(() => {
        navigate(`/workspace/${encodeURIComponent(invite?.repo_full_name || "")}`);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to accept invite";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Validating invite...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-success mx-auto" />
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>You've successfully joined the repository</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              You're being redirected to {invite?.repo_full_name}...
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle>Invalid Invite</CardTitle>
            </div>
            <CardDescription>The invite link is invalid or has expired</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive/80">{error}</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle>Join Repository</CardTitle>
          <CardDescription>You've been invited to join a repository</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Repository</p>
              <p className="font-medium">{invite.repo_full_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your Role</p>
              <p className="font-medium capitalize">{invite.role}</p>
            </div>
            {invite.inviter_name && (
              <div>
                <p className="text-xs text-muted-foreground">Invited By</p>
                <p className="font-medium">{invite.inviter_name}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              disabled={accepting}
            >
              Decline
            </Button>
            <Button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="flex-1"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Invite"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
