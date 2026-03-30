import { useState } from "react";
import { useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TagModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectionCount: number;
    selectedIssueIds?: number[];
    onSuccess?: () => void;
}

export function TagModal({
    isOpen,
    onClose,
    selectionCount,
    selectedIssueIds = [],
    onSuccess,
}: TagModalProps) {
    const { repo: encodedRepo } = useParams<{ repo: string }>();
    const repo = encodedRepo ? decodeURIComponent(encodedRepo) : null;

    const recommendations = ["v2-blocker", "needs-review", "documentation", "ui-polish"];
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allTags = [...new Set([...recommendations, ...selectedTags])];

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const addCustomTag = () => {
        if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
            setSelectedTags((prev) => [...prev, customTag.trim()]);
            setCustomTag("");
        }
    };

    const handleApply = async () => {
        if (selectedTags.length === 0 || !repo || selectedIssueIds.length === 0) {
            setError("Please select at least one tag and issue");
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
                `https://repomind-577n.onrender.com/manager/issues/batch-tags?repo=${encodeURIComponent(repo)}`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        issue_ids: selectedIssueIds,
                        tags: selectedTags,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to apply tags");
            }

            // Reset and close
            setSelectedTags([]);
            setCustomTag("");
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tag {selectionCount} Selected Issues</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500">
                            <Sparkles className="h-3 w-3" /> AI RECOMMENDATIONS
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {recommendations.map((tag) => (
                                <Button
                                    key={tag}
                                    variant={selectedTags.includes(tag) ? "default" : "secondary"}
                                    size="sm"
                                    className="h-7 text-[11px] rounded-md"
                                    onClick={() => toggleTag(tag)}
                                    disabled={loading}
                                >
                                    {selectedTags.includes(tag) ? "✓ " : ""}{tag}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            CUSTOM TAGS
                        </label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter custom tag..."
                                value={customTag}
                                onChange={(e) => setCustomTag(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        addCustomTag();
                                    }
                                }}
                                className="h-9"
                                disabled={loading}
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={addCustomTag}
                                disabled={loading || !customTag.trim()}
                            >
                                Add
                            </Button>
                        </div>
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedTags.map((tag) => (
                                    <Button
                                        key={tag}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[11px] rounded-md"
                                        onClick={() => toggleTag(tag)}
                                        disabled={loading}
                                    >
                                        ✕ {tag}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply} disabled={loading || selectedTags.length === 0}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Applying...
                            </>
                        ) : (
                            "Apply Tags"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}