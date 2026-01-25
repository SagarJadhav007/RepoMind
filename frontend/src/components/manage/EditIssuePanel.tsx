import { useState } from "react";
import { useParams } from "react-router-dom";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
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
import { Info, Trash2, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Issue = {
    id: number;
    title: string;
    labels: string[];
    comments: number;
};

interface EditIssuePanelProps {
    isOpen: boolean;
    onClose: () => void;
    issue: Issue | null;
    onSuccess?: () => void;
}

export function EditIssuePanel({ isOpen, onClose, issue, onSuccess }: EditIssuePanelProps) {
    const { repo: encodedRepo } = useParams<{ repo: string }>();
    const repo = encodedRepo ? decodeURIComponent(encodedRepo) : null;

    const [title, setTitle] = useState(issue?.title || "");
    const [selectedLabels, setSelectedLabels] = useState<string[]>(issue?.labels || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const suggestedLabels = ["bug", "feature", "documentation", "ui"];

    const toggleLabel = (label: string) => {
        setSelectedLabels((prev) =>
            prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
        );
    };

    const handleDelete = async () => {
        if (!issue || !repo) return;

        if (!window.confirm("Are you sure you want to delete this issue?")) {
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
                `https://repomind-577n.onrender.com/manager/issues/${issue.id}?repo=${encodeURIComponent(repo)}`,
                {
                    method: "DELETE",
                    headers,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to delete issue");
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async () => {
        if (!issue || !repo) return;

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
                `https://repomind-577n.onrender.com/manager/issues/${issue.id}/close?repo=${encodeURIComponent(repo)}`,
                {
                    method: "PATCH",
                    headers,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to close issue");
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="sm:max-w-[480px] w-full flex flex-col p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b">
                    <SheetTitle className="text-xl">Edit Issue #{issue?.id}</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Title Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="edit-title" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                                Issue Title
                            </Label>
                            <Input
                                id="edit-title"
                                placeholder="Issue title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="focus-visible:ring-primary"
                                disabled={true}
                            />
                        </div>

                        {/* Labels */}
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

                        {/* Issue Stats */}
                        <div className="grid gap-3 pt-4 border-t">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Comments</span>
                                <span className="font-semibold">{issue?.comments || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Issue ID</span>
                                <span className="font-mono text-xs">#{issue?.id}</span>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-3">
                            <Info className="h-5 w-5 text-blue-500 shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Changes made here will be synced with your GitHub repository.
                            </p>
                        </div>
                    </div>
                </div>

                <SheetFooter className="px-6 py-4 border-t flex-row gap-2 justify-between">
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={loading}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClose}
                            disabled={loading}
                            className="gap-2"
                        >
                            <Lock className="h-4 w-4" />
                            Close
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Done
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
