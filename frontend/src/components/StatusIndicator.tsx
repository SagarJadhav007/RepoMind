import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

type Status = "passing" | "failing" | "warning" | "pending";

interface StatusIndicatorProps {
  status: Status;
  label: string;
  value?: string | number;
  size?: "sm" | "md";
}

export function StatusIndicator({ status, label, value, size = "md" }: StatusIndicatorProps) {
  const config = {
    passing: {
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
      label: "Passing",
    },
    failing: {
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      label: "Failing",
    },
    warning: {
      icon: AlertCircle,
      color: "text-warning",
      bg: "bg-warning/10",
      label: "Warning",
    },
    pending: {
      icon: Clock,
      color: "text-muted-foreground",
      bg: "bg-muted",
      label: "Pending",
    },
  };

  const { icon: Icon, color, bg } = config[status];

  const sizeClasses = {
    sm: {
      container: "px-2.5 py-1.5 gap-1.5",
      icon: "h-3.5 w-3.5",
      text: "text-xs",
    },
    md: {
      container: "px-3 py-2 gap-2",
      icon: "h-4 w-4",
      text: "text-sm",
    },
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border",
        bg,
        sizeClasses[size].container
      )}
    >
      <Icon className={cn(sizeClasses[size].icon, color)} />
      <span className={cn("font-medium text-card-foreground", sizeClasses[size].text)}>
        {label}
      </span>
      {value !== undefined && (
        <span className={cn("font-bold", color, sizeClasses[size].text)}>{value}</span>
      )}
    </div>
  );
}
