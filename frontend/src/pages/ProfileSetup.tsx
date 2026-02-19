import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const AVAILABLE_SKILLS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "Go",
  "Rust",
  "React",
  "Vue.js",
  "Angular",
  "Node.js",
  "Django",
  "FastAPI",
  "Spring Boot",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Git",
  "DevOps",
  "Machine Learning",
  "Data Science",
  "UI/UX Design",
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isNewUser, setIsNewUser] = useState(true);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showSkillSearch, setShowSkillSearch] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [interestedDomains, setInterestedDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");

  // Ensure user is authenticated before showing setup
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate("/auth");
          return;
        }

        const sessionUser = data.session.user;
        setUser(sessionUser);

        const githubUsername =
          (sessionUser.user_metadata as any)?.user_name ||
          (sessionUser.user_metadata as any)?.preferred_username ||
          "";
        const githubName =
          (sessionUser.user_metadata as any)?.full_name ||
          (sessionUser.user_metadata as any)?.name ||
          "";

        if (githubUsername && !username) {
          setUsername(githubUsername);
        }

        // Prefill bio from GitHub profile README if available
        if (githubUsername) {
          try {
            const res = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(
                githubUsername,
              )}/${encodeURIComponent(githubUsername)}/readme`,
            );
            if (res.ok) {
              const json = await res.json();
              if (json?.content) {
                const decoded = atob(json.content.replace(/\s/g, ""));
                const firstParagraph =
                  decoded.split(/\n{2,}/)[0]?.trim() || decoded.trim();
                if (!bio) {
                  setBio(firstParagraph.slice(0, 600));
                }
              }
            }
          } catch (e) {
            // Failing to load README should not block onboarding
            console.error("Failed to load GitHub README", e);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    checkAuth();
  }, [navigate]);

  // If user returned from OAuth after clicking an invite link, redirect there
  useEffect(() => {
    const redirect = localStorage.getItem("post_auth_redirect");
    if (redirect) {
      localStorage.removeItem("post_auth_redirect");
      // Safety: only redirect within app
      if (redirect.startsWith("/")) {
        navigate(redirect);
      }
    }
  }, [navigate]);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (skill: string) => {
    if (!skill) return;
    if (!selectedSkills.includes(skill) && selectedSkills.length < 10) {
      setSelectedSkills((prev) => [...prev, skill]);
      setSkillSearch("");
    }
  };

  const handleAddDomain = () => {
    const value = domainInput.trim();
    if (!value) return;
    if (!interestedDomains.includes(value) && interestedDomains.length < 10) {
      setInterestedDomains((prev) => [...prev, value]);
    }
    setDomainInput("");
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!username.trim()) {
        setError("Username is required");
        setSaving(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Not authenticated");

      const response = await fetch(
        "https://repomind-577n.onrender.com/user/profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            // New schema: user_profiles table
            username,
            bio,
            skills: selectedSkills,
            interested_domains: interestedDomains,
          }),
        }
      );

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.detail || "Failed to save profile");
      }

      toast({
        title: "Success",
        description: "Profile setup complete!",
      });

      // Continue onboarding to repository selection / invite
      navigate("/select-repo");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkipSetup = () => {
    navigate("/select-repo");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredSkills = AVAILABLE_SKILLS.filter(
    (skill) =>
      !selectedSkills.includes(skill) &&
      skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl">Welcome to RepoMind!</CardTitle>
          <CardDescription>
            Complete your profile to get started. You can always update these later.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">GitHub Username *</Label>
            <Input
              id="username"
              placeholder="octocat"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself... (optional). We try to prefill this from your GitHub profile README if available."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={saving}
              rows={3}
            />
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <div>
              <Label>Skills (Max 10)</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Select skills you're proficient in to help teammates find the right person
              </p>
            </div>

            {/* Selected Skills */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1.5">
                    {skill}
                    <button
                      onClick={() =>
                        setSelectedSkills((prev) =>
                          prev.filter((s) => s !== skill)
                        )
                      }
                      className="ml-1.5 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Skill Search */}
            <div className="relative">
              <Input
                placeholder="Search or add a skill..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                onFocus={() => setShowSkillSearch(true)}
                disabled={saving || selectedSkills.length >= 10}
              />

              {/* Skill Suggestions */}
              {showSkillSearch && skillSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => {
                          handleSkillToggle(skill);
                          setSkillSearch("");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm"
                      >
                        {skill}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                      <p className="mb-2">Skill not found</p>
                      {selectedSkills.length < 10 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddCustomSkill(skillSearch)}
                        >
                          Add "{skillSearch}"
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Interested Domains */}
          <div className="space-y-3">
            <div>
              <Label>Interested Domains (Max 10)</Label>
              <p className="text-xs text-muted-foreground mt-1">
                What areas are you most interested in? (e.g. DevOps, Docs, Frontend)
              </p>
            </div>

            {interestedDomains.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interestedDomains.map((domain) => (
                  <Badge key={domain} variant="secondary" className="px-3 py-1.5">
                    {domain}
                    <button
                      onClick={() =>
                        setInterestedDomains((prev) =>
                          prev.filter((d) => d !== domain),
                        )
                      }
                      className="ml-1.5 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Add a domain (press Enter)"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDomain();
                  }
                }}
                disabled={saving || interestedDomains.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddDomain}
                disabled={saving || !domainInput.trim() || interestedDomains.length >= 10}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleSkipSetup}
              disabled={saving}
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saving || !username.trim()}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            You can update your profile anytime in settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
