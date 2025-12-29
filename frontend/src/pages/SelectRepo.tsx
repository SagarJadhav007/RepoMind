import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type Repo = {
    full_name: string;
    private: boolean;
    owner: string;
};

export default function SelectRepo() {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [params] = useSearchParams();
    const installationId = params.get("installation_id");
    const navigate = useNavigate();

    useEffect(() => {
        async function loadRepos() {
            if (!installationId) return;

            const res = await fetch(
                `https://repomind-577n.onrender.com/github/repos?installation_id=${installationId}`
            );

            setRepos(await res.json());
            setLoading(false);
        }

        loadRepos();
    }, [installationId]);

    const continueToDashboard = async () => {
        if (!selected || !installationId) return;

        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;

        await fetch("https://repomind-577n.onrender.com/user/select-repo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                installation_id: installationId,
                repo_full_name: selected,
            }),
        });

        navigate("/workspace/demo");
    };

    if (loading) return <div className="p-6">Loading repositories…</div>;

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Select a repository</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    {repos.map((repo) => (
                        <button
                            key={repo.full_name}
                            onClick={() => setSelected(repo.full_name)}
                            className={`w-full text-left px-4 py-3 rounded-md border ${selected === repo.full_name
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:bg-muted"
                                }`}
                        >
                            <p className="font-medium">{repo.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                                {repo.private ? "Private" : "Public"}
                            </p>
                        </button>
                    ))}

                    <Button
                        className="w-full mt-4"
                        disabled={!selected}
                        onClick={continueToDashboard}
                    >
                        Continue
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
