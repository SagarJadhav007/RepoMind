import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Tag, CheckCircle2 } from "lucide-react";
import { IssueTable } from "@/components/manage/IssueTable";
import { PRTable } from "@/components/manage/PRTable";
import { TagModal } from "@/components/manage/TagModal";
import { IssueForm } from "@/components/manage/IssueForm";
import { EditIssuePanel } from "@/components/manage/EditIssuePanel";

import { supabase } from "@/lib/supabase";

/* ---------- TYPES ---------- */

type Issue = {
  id: number;
  title: string;
  labels: string[];
  comments: number;
  assignees?: string[];
};

type PR = {
  id: number;
  title: string;
  author: string;
  labels: string[];
  files_changed?: number;
  risk?: "low" | "medium" | "high";
};

/* ---------- COMPONENT ---------- */

export default function Manage() {
  const { repo: encodedRepo } = useParams<{ repo: string }>();
  const repo = encodedRepo ? decodeURIComponent(encodedRepo) : null;

  const [view, setView] = useState<"issues" | "prs">("issues");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIssues, setSelectedIssues] = useState<number[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);

  const editingIssue = issues.find((i) => i.id === editingIssueId) || null;

  /* ---------- FETCH DATA ---------- */

  useEffect(() => {
    if (!repo) return;

    async function loadManagerData() {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;

        const headers = {
          Authorization: `Bearer ${data.session.access_token}`,
        };

        const [issueRes, prRes] = await Promise.all([
          fetch(
            `https://repomind-577n.onrender.com/manager/issues?repo=${encodeURIComponent(repo)}`,
            { headers }
          ),
          fetch(
            `https://repomind-577n.onrender.com/manager/pull-requests?repo=${encodeURIComponent(repo)}`,
            { headers }
          ),
        ]);

        const issueJson = await issueRes.json();
        const prJson = await prRes.json();

        setIssues(issueJson.issues ?? []);
        setPrs(prJson.pull_requests ?? []);
      } catch (err) {
        console.error("Manager fetch failed", err);
        setIssues([]);
        setPrs([]);
      } finally {
        setLoading(false);
      }
    }

    loadManagerData();
  }, [repo]);

  /* ---------- HELPERS ---------- */

  const toggleSelect = (id: number) => {
    setSelectedIssues((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const refreshIssues = async () => {
    if (!repo) return;

    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const headers = {
        Authorization: `Bearer ${data.session.access_token}`,
      };

      const issueRes = await fetch(
        `https://repomind-577n.onrender.com/manager/issues?repo=${encodeURIComponent(repo)}`,
        { headers }
      );

      const issueJson = await issueRes.json();
      setIssues(issueJson.issues ?? []);
      setSelectedIssues([]);
    } catch (err) {
      console.error("Failed to refresh issues", err);
    }
  };

  /* ---------- STATES ---------- */

  if (!repo) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-muted-foreground">Invalid repository</div>
      </WorkspaceLayout>
    );
  }

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="p-6">Loading manager console…</div>
      </WorkspaceLayout>
    );
  }

  /* ---------- UI ---------- */

  return (
    <WorkspaceLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Manager Console
            </h1>
            <p className="text-muted-foreground text-sm font-mono">
              {repo}
            </p>
          </div>

        </header>

        {/* Content */}
        <div className="mt-10 space-y-6">

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="prs">Pull Requests</TabsTrigger>
              </TabsList>
            </Tabs>

            {view === "issues" && (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> New Issue
                  </Button>
                </SheetTrigger>
                <IssueForm
                  onSuccess={() => {
                    refreshIssues();
                    setIsSheetOpen(false);
                  }}
                  onClose={() => setIsSheetOpen(false)}
                />
              </Sheet>
            )}
          </div>

          {/* Table */}
          {view === "issues" ? (
            issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open issues
              </p>
            ) : (
              <IssueTable
                issues={issues}
                selected={selectedIssues}
                onToggle={toggleSelect}
                onRowClick={(issueId) => setEditingIssueId(issueId)}
              />
            )
          ) : prs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open pull requests
            </p>
          ) : (
            <PRTable
              prs={prs.map((pr) => ({
                id: pr.id,
                title: pr.title,
                author: pr.author,
                risk: pr.risk ?? "medium",
                filesChanged: pr.files_changed ?? 0,
              }))}
            />
          )}
        </div>


        {/* Bulk Action Bar */}
        {selectedIssues.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900 text-white px-5 py-3 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <span className="text-sm font-medium">
              {selectedIssues.length} Selected
            </span>
            <div className="w-px h-4 bg-zinc-700" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTagModalOpen(true)}
              className="text-white hover:bg-zinc-800 gap-2"
            >
              <Tag className="h-4 w-4" /> Tag
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:bg-red-950/30 gap-2"
            >
              <CheckCircle2 className="h-4 w-4" /> Close
            </Button>
          </div>
        )}

        <TagModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          selectionCount={selectedIssues.length}
          selectedIssueIds={selectedIssues}
          onSuccess={refreshIssues}
        />

        <EditIssuePanel
          isOpen={editingIssueId !== null}
          onClose={() => setEditingIssueId(null)}
          issue={editingIssue}
          onSuccess={refreshIssues}
        />
      </div>
    </WorkspaceLayout>
  );
}
