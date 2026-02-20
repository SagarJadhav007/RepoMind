import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Loader2, Upload, X, Calendar, ArrowLeft } from "lucide-react";

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
    "PostgreSQL",
    "MongoDB",
    "Git",
    "DevOps",
];

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  skills: string[] | null;
  interested_domains: string[] | null;
  created_at: string;
  updated_at: string;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [interestedDomains, setInterestedDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [skillSearch, setSkillSearch] = useState("");

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          setLoading(false);
          navigate("/auth");
          return;
        }

        const currentUser = sessionData.session.user;
        const accessToken = sessionData.session.access_token;
        setUser(currentUser);

        // Fetch profile from backend
        const response = await fetch("/user/profile", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const profileData: UserProfile = await response.json();
          setProfile(profileData);

          setUsername(profileData.username || "");
          setBio(profileData.bio || "");
          setSelectedSkills(profileData.skills || []);
          setInterestedDomains(profileData.interested_domains || []);
        } else if (response.status === 404) {
          // Profile doesn't exist yet, initialize from auth user
          const emptyProfile: UserProfile = {
            id: currentUser.id,
            username:
              (currentUser.user_metadata as any)?.user_name ||
              (currentUser.user_metadata as any)?.preferred_username ||
              "",
            email: currentUser.email || "",
            bio: null,
            skills: [],
            interested_domains: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(emptyProfile);
          setUsername(emptyProfile.username);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Error",
                description: "Profile picture must be less than 5MB",
                variant: "destructive",
            });
            return;
        }

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append("file", file);

            // Upload to backend
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;

            const response = await fetch("/user/upload-profile-picture", {
                method: "POST",
                headers: accessToken
                  ? { Authorization: `Bearer ${accessToken}` }
                  : undefined,
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setProfilePicturePreview(data.url);
                toast({
                    title: "Success",
                    description: "Profile picture updated",
                });
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to upload profile picture",
                variant: "destructive",
            });
        } finally {
            setUploadingImage(false);
        }
    };

  const handleSkillToggle = (skill: string) => {
        setSelectedSkills((prev) =>
            prev.includes(skill)
                ? prev.filter((s) => s !== skill)
                : [...prev, skill]
        );
    };

  const handleRemoveSkill = (skill: string) => {
        setSelectedSkills((prev) => prev.filter((s) => s !== skill));
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

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username,
          bio,
          skills: selectedSkills,
          interested_domains: interestedDomains,
        }),
      });

      if (response.ok) {
        const updatedProfile: UserProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setSelectedSkills(profile.skills || []);
      setInterestedDomains(profile.interested_domains || []);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-red-500 w-full max-w-md">
          <CardContent className="pt-6 flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Please sign in to view your profile</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = (username || user.email || "User")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const filteredSkills = AVAILABLE_SKILLS.filter(
    (skill) =>
      skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !selectedSkills.includes(skill),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex itemsDescribing your role: You are ChatGPT, a large language model trained by OpenAI, based on the GPT-4 architecture.
}
