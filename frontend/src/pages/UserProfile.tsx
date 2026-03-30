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
import { MapPin, Clock } from "lucide-react";
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
    "Australia/Sydney",
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
    "PostgreSQL",
    "MongoDB",
    "Git",
    "DevOps",
];

interface UserProfile {
    id: string;
    full_name: string;
    username: string;
    email: string;
    bio: string | null;
    location: string | null;
    timezone: string | null;
    skills: string[] | null;
    profile_picture_url: string | null;
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
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [timezone, setTimezone] = useState("UTC");
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
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
                setUser(currentUser);

                // Fetch profile from backend
                const response = await fetch("/user/profile", {
                    headers: {
                        "Authorization": `Bearer ${currentUser.user_metadata?.access_token || ""}`,
                    },
                });

                if (response.ok) {
                    const profileData = await response.json();
                    setProfile(profileData);

                    // Set form values
                    setFullName(profileData.full_name || "");
                    setBio(profileData.bio || "");
                    setLocation(profileData.location || "");
                    setTimezone(profileData.timezone || "UTC");
                    setSelectedSkills(profileData.skills || []);
                    setProfilePicturePreview(profileData.profile_picture_url || null);
                } else if (response.status === 404) {
                    // Profile doesn't exist yet, create empty profile with user info
                    setProfile({
                        id: currentUser.id,
                        full_name: "",
                        username: currentUser.user_metadata?.username || "",
                        email: currentUser.email || "",
                        bio: null,
                        location: null,
                        timezone: null,
                        skills: null,
                        profile_picture_url: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });
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
            const response = await fetch("/user/upload-profile-picture", {
                method: "POST",
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

    const handleSaveProfile = async () => {
        try {
            setSaving(true);

            const response = await fetch("/user/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    full_name: fullName,
                    bio,
                    location,
                    timezone,
                    skills: selectedSkills,
                    profile_picture_url: profilePicturePreview,
                }),
            });

            if (response.ok) {
                const updatedProfile = await response.json();
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
            setFullName(profile.full_name);
            setBio(profile.bio || "");
            setLocation(profile.location || "");
            setTimezone(profile.timezone || "UTC");
            setSelectedSkills(profile.skills || []);
            setProfilePicturePreview(profile.profile_picture_url || null);
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

    const initials = (fullName || user.email || "User")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const filteredSkills = AVAILABLE_SKILLS.filter(
        (skill) =>
            skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
            !selectedSkills.includes(skill)
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto py-8">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
                                <p className="text-muted-foreground">Manage your account and personal information</p>
                            </div>
                        </div>
                        {!isEditing && (
                            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                        )}
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Profile Card */}
                        <Card className="md:col-span-1">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="relative">
                                        <Avatar className="h-24 w-24">
                                            <AvatarImage src={profilePicturePreview || undefined} alt="User" />
                                            <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
                                        </Avatar>
                                        {isEditing && (
                                            <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                                                <Upload className="h-4 w-4" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleProfilePictureChange}
                                                    disabled={uploadingImage}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-semibold text-foreground">{fullName || "No name set"}</h2>
                                        <p className="text-sm text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>

                                    {location && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>{location}</span>
                                        </div>
                                    )}

                                    {timezone && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{timezone}</span>
                                        </div>
                                    )}

                                    {profile?.created_at && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    <Separator className="w-full" />

                                    {selectedSkills.length > 0 && (
                                        <div className="w-full">
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedSkills.map((skill) => (
                                                    <Badge key={skill} variant="secondary" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Settings Card */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>
                                    {isEditing ? "Edit Profile" : "Profile Information"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        disabled={!isEditing}
                                        placeholder="Your full name"
                                    />
                                </div>

                                {/* Email (Read-only) */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={user?.email || ""}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>

                                {/* Bio */}
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        disabled={!isEditing}
                                        placeholder="Tell us about yourself..."
                                        className="resize-none"
                                        rows={4}
                                    />
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        disabled={!isEditing}
                                        placeholder="City, Country"
                                    />
                                </div>

                                {/* Timezone */}
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select value={timezone} onValueChange={setTimezone} disabled={!isEditing}>
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
                                {isEditing && (
                                    <div className="space-y-3">
                                        <Label>Skills</Label>

                                        {/* Selected Skills */}
                                        {selectedSkills.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedSkills.map((skill) => (
                                                    <Badge key={skill} variant="default" className="px-3 py-1">
                                                        {skill}
                                                        <button
                                                            onClick={() => handleRemoveSkill(skill)}
                                                            className="ml-1 hover:text-foreground"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {/* Skill Search */}
                                        <Input
                                            placeholder="Search and add skills..."
                                            value={skillSearch}
                                            onChange={(e) => setSkillSearch(e.target.value)}
                                        />

                                        {/* Available Skills Dropdown */}
                                        {skillSearch && filteredSkills.length > 0 && (
                                            <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                                                {filteredSkills.slice(0, 10).map((skill) => (
                                                    <button
                                                        key={skill}
                                                        onClick={() => {
                                                            handleSkillToggle(skill);
                                                            setSkillSearch("");
                                                        }}
                                                        className="w-full text-left px-2 py-1 hover:bg-accent rounded text-sm"
                                                    >
                                                        + {skill}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Display Skills (non-editing) */}
                                {!isEditing && selectedSkills.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Skills</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSkills.map((skill) => (
                                                <Badge key={skill} variant="secondary">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {isEditing && (
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={handleCancel}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                        >
                                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Account Info Card */}
                    {profile && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                                        <p className="text-lg font-semibold">
                                            {new Date(profile.created_at).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                        <p className="text-lg font-semibold">
                                            {new Date(profile.updated_at).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Account ID</p>
                                        <p className="text-sm font-mono text-muted-foreground break-all">{profile.id}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Email Status</p>
                                        <Badge className="w-fit">Verified</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
