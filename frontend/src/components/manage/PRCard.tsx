import { Badge } from "@/components/ui/badge";
import { AlertCircle, ChevronRight, GitPullRequest } from "lucide-react";
import { cn } from "@/lib/utils";

export function PRCard({ id, title, author, risk, filesChanged }: any) {
  const riskStyles = {
    high: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20",
    medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20"
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-zinc-400 cursor-pointer transition-all group">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
          <GitPullRequest className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">@{author}</span> wants to merge 
            <span className="mx-1">•</span> {filesChanged} files changed
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="outline" className={cn("px-2 py-0.5 uppercase text-[10px] font-bold tracking-wider", riskStyles[risk as keyof typeof riskStyles])}>
          {risk === 'high' && <AlertCircle className="h-3 w-3 mr-1 inline" />}
          {risk} Risk
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}