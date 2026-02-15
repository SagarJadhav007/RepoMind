import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Australia/Melbourne",
];

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
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showSkillSearch, setShowSkillSearch] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");

  // Check if user is authenticated and has profile
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate("/auth");
          return;
        }

        setUser(data.session.user);

        // Check if user has existing profile
        const response = await fetch(
          "https://repomind-577n.onrender.com/user/profile",
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          }
        );

        if (response.ok) {
          // User already has a profile, skip setup
          setIsNewUser(false);
          navigate("/");
          return;
        }

        setIsNewUser(true);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    checkAuth();
  }, [navigate]);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Profile picture must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
    if (skill && !selectedSkills.includes(skill) && selectedSkills.length < 10) {
      setSelectedSkills((prev) => [...prev, skill]);
      setSkillSearch("");
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!fullName.trim()) {
        setError("Full name is required");
        setSaving(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Not authenticated");

      let profilePictureUrl: string | null = null;

      // Upload profile picture if provided
      if (profilePicture) {
        const formData = new FormData();
        formData.append("file", profilePicture);

        const uploadResponse = await fetch(
          "https://repomind-577n.onrender.com/user/upload-profile-picture",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: formData,
          }
        );

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          profilePictureUrl = uploadData.profile_picture_url;
        }
      }

      const response = await fetch(
        "https://repomind-577n.onrender.com/user/profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            full_name: fullName,
            bio,
            location,
            timezone,
            profile_picture_url: profilePictureUrl,
            skills: selectedSkills,
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

      // Redirect to repositories selection
      navigate("/");
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
    navigate("/");
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

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself... (optional)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={saving}
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="City, Country (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Profile Picture */}
          <div className="space-y-2">
            <Label htmlFor="profilePicture">Profile Picture</Label>
            <div className="flex items-center gap-4">
              {profilePicturePreview ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={profilePicturePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setProfilePicture(null);
                      setProfilePicturePreview(null);
                    }}
                    className="absolute top-1 right-1 bg-destructive/90 text-white rounded-full p-1 hover:bg-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No image</span>
                </div>
              )}
              <div>
                <input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  disabled={saving}
                  className="hidden"
                />
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  <label className="cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Max 5MB, JPG or PNG</p>
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone} disabled={saving}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={saving || !fullName.trim()}
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
