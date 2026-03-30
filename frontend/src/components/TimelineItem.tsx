import { cn } from "@/lib/utils";
import {
  GitPullRequest,
  GitMerge,
  CircleCheck,
  XCircle,
  Rocket,
  Tag,
} from "lucide-react";

type EventType =
  | "pr-opened"
  | "pr-merged"
  | "issue-closed"
  | "deployment-failed"
  | "release";

interface TimelineItemProps {
  type: EventType;
  title: string;
  description: string;
  timestamp: string;
  isLast?: boolean;
}

export function TimelineItem({
  type,
  title,
  description,
  timestamp,
  isLast = false,
}: TimelineItemProps) {
  const config = {
    "pr-opened": {
      icon: GitPullRequest,
      color: "text-accent",
      bg: "bg-accent/10",
      borderColor: "border-accent/30",
    },
    "pr-merged": {
      icon: GitMerge,
      color: "text-success",
      bg: "bg-success/10",
      borderColor: "border-success/30",
    },
    "issue-closed": {
      icon: CircleCheck,
      color: "text-success",
      bg: "bg-success/10",
      borderColor: "border-success/30",
    },
    "deployment-failed": {
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      borderColor: "border-destructive/30",
    },
    release: {
      icon: Tag,
      color: "text-accent",
      bg: "bg-accent/10",
      borderColor: "border-accent/30",
    },
  };

  const { icon: Icon, color, bg, borderColor } = config[type];

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 h-full w-px bg-border" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
          bg,
          borderColor
        )}
      >
        <Icon className={cn("h-5 w-5", color)} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-medium text-card-foreground">{title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <time className="shrink-0 text-xs text-muted-foreground">
              {timestamp}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
}
