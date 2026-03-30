import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { MessageSquare, User } from "lucide-react";

interface IssueProps {
  id: number; title: string; labels: string[]; assignees: string[];
  isSelected: boolean; onSelect: () => void;
}

export function IssueCard({ id, title, labels, assignees, isSelected, onSelect }: IssueProps) {
  return (
    <div className={cn(
      "group flex items-center justify-between p-4 rounded-xl border bg-card transition-all hover:shadow-md",
      isSelected ? "border-primary bg-primary/5" : "border-border"
    )}>
      <div className="flex items-center gap-4">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground">#{id}</span>
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{title}</h3>
          </div>
          <div className="flex gap-1.5 mt-2">
            {labels.map(l => (
              <Badge key={l} variant="secondary" className="text-[10px] px-1.5 py-0">
                {l}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <MessageSquare className="h-3.5 w-3.5" /> 4
        </div>
        <div className="flex -space-x-2">
          {assignees.map((a, i) => (
            <div key={i} className="h-7 w-7 rounded-full border-2 border-background bg-zinc-100 flex items-center justify-center overflow-hidden">
               <User className="h-4 w-4 text-zinc-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}