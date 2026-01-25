import { useState } from "react";
import { useParams } from "react-router-dom";
import {
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
    onSuccess?: () => void;
    onClose?: () => void;
};

export function IssueForm({ onSuccess, onClose }: Props) {
    const { repo: encodedRepo } = useParams<{ repo: string }>();
    const repo = encodedRepo ? decodeURIComponent(encodedRepo) : null;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const suggestedLabels = ["bug", "feature", "documentation", "ui"];

    const toggleLabel = (label: string) => {
        setSelectedLabels((prev) =>
            prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !repo) {
            setError("Title is required");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
                setError("Not authenticated");
                setLoading(false);
                return;
            }

            const headers = {
                Authorization: `Bearer ${sessionData.session.access_token}`,
                "Content-Type": "application/json",
            };

            const response = await fetch(
                `https://repomind-577n.onrender.com/manager/issues?repo=${encodeURIComponent(repo)}`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        title: title.trim(),
                        description: description.trim(),
                        labels: selectedLabels,
                        priority,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to create issue");
            }

            const result = await response.json();

            // Reset form
            setTitle("");
            setDescription("");
            setPriority("medium");
            setSelectedLabels([]);

            // Call callbacks
            onSuccess?.();
            onClose?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SheetContent side="right" className="sm:max-w-[480px] w-full flex flex-col p-0">
            <SheetHeader className="px-6 pt-6 pb-4 border-b space-y-1">
                <SheetTitle className="text-xl">Create New Issue</SheetTitle>
                <SheetDescription>
                    Fill in the details below to track a new task or bug.
                </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="grid gap-6 py-6 px-6 flex-1 overflow-y-auto">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title Field */}
                    <div className="grid gap-2">
                        <Label htmlFor="title" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                            Issue Title
                        </Label>
                        <Input
                            id="title"
                            placeholder="e.g., [UI] Fix broken padding on mobile"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="focus-visible:ring-primary"
                            disabled={loading}
                        />
                    </div>

                    {/* Description Field */}
                    <div className="grid gap-2">
                        <Label htmlFor="desc" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                            Description
                        </Label>
                        <Textarea
                            id="desc"
                            placeholder="Describe the issue, steps to reproduce, or expected behavior..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[150px] resize-none"
                            disabled={loading}
                        />
                    </div>

                    {/* Metadata Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                                Priority
                            </Label>
                            <Select value={priority} onValueChange={setPriority} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                                Assignee
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                className="justify-start font-normal gap-2 border-dashed"
                                disabled={true}
                            >
                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                                <span>Add Assignee</span>
                            </Button>
                        </div>
                    </div>

                    {/* Labels Preview */}
                    <div className="grid gap-2">
                        <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                            Labels
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {suggestedLabels.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant={selectedLabels.includes(tag) ? "default" : "outline"}
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                    onClick={() => toggleLabel(tag)}
                                >
                                    {selectedLabels.includes(tag) ? "✓ " : "+ "}{tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-muted/50 px-6 py-3 flex gap-3 border-t">
                    <Info className="h-5 w-5 text-blue-500 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Issues created here will be synced with your repository and visible to all contributors.
                    </p>
                </div>

                <SheetFooter className="px-6 py-4 border-t flex-row gap-2 sm:justify-end">
                    <Button
                        variant="ghost"
                        type="button"
                        className="flex-1 sm:flex-none"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 sm:flex-none"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Issue"
                        )}
                    </Button>
                </SheetFooter>
            </form>
        </SheetContent>
    );
}
