import { Star, GitFork, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RepoHeaderProps {
  name: string;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
}

export function RepoHeader({ name, description, stars, forks, watchers }: RepoHeaderProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-card-foreground font-mono">{name}</h1>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Star className="h-4 w-4" />
            <span className="font-medium text-card-foreground">{stars.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <GitFork className="h-4 w-4" />
            <span className="font-medium text-card-foreground">{forks.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="font-medium text-card-foreground">{watchers}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
