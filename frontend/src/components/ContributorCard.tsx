import { cn } from "@/lib/utils";
import { GitCommit, GitPullRequest, CircleCheck, Star, UserPlus, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ContributorType = "core" | "regular" | "first-time" | "inactive";

interface ContributorCardProps {
  name: string;
  username: string;
  avatar?: string;
  commits: number;
  prsMerged: number;
  issuesClosed: number;
  score: number;
  type: ContributorType;
}

export function ContributorCard({
  name,
  username,
  commits,
  prsMerged,
  issuesClosed,
  score,
  type,
}: ContributorCardProps) {
  const typeConfig = {
    core: {
      badge: "Core",
      icon: Star,
      color: "bg-warning/10 text-warning border-warning/20",
    },
    regular: {
      badge: null,
      icon: null,
      color: "",
    },
    "first-time": {
      badge: "First-time",
      icon: UserPlus,
      color: "bg-success/10 text-success border-success/20",
    },
    inactive: {
      badge: "Inactive",
      icon: UserMinus,
      color: "bg-muted text-muted-foreground border-border",
    },
  };

  const config = typeConfig[type];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover",
        type === "inactive" && "opacity-60"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-card-foreground">{name}</span>
            {config.badge && (
              <Badge variant="outline" className={cn("text-xs", config.color)}>
                {config.icon && <config.icon className="mr-1 h-3 w-3" />}
                {config.badge}
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">@{username}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <GitCommit className="h-4 w-4" />
          <span className="font-medium text-card-foreground">{commits}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <GitPullRequest className="h-4 w-4" />
          <span className="font-medium text-card-foreground">{prsMerged}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CircleCheck className="h-4 w-4" />
          <span className="font-medium text-card-foreground">{issuesClosed}</span>
        </div>
        <div className="w-16 text-right">
          <span className="text-lg font-bold text-card-foreground">{score}</span>
          <span className="text-xs text-muted-foreground"> pts</span>
        </div>
      </div>
    </div>
  );
}
