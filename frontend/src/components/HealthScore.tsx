import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function HealthScore({ score, size = "md", showLabel = true }: HealthScoreProps) {
  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-health-excellent";
    if (score >= 70) return "text-health-good";
    if (score >= 50) return "text-health-warning";
    return "text-health-critical";
  };

  const getHealthBg = (score: number) => {
    if (score >= 90) return "stroke-health-excellent";
    if (score >= 70) return "stroke-health-good";
    if (score >= 50) return "stroke-health-warning";
    return "stroke-health-critical";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Work";
  };

  const sizeClasses = {
    sm: { container: "w-16 h-16", text: "text-lg", label: "text-xs" },
    md: { container: "w-28 h-28", text: "text-3xl", label: "text-sm" },
    lg: { container: "w-36 h-36", text: "text-4xl", label: "text-base" },
  };

  const strokeWidth = size === "sm" ? 6 : size === "md" ? 8 : 10;
  const radius = size === "sm" ? 26 : size === "md" ? 48 : 60;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative", sizeClasses[size].container)}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}>
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted"
          />
          {/* Progress circle */}
          <circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            className={cn("transition-all duration-1000 ease-out", getHealthBg(score))}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", sizeClasses[size].text, getHealthColor(score))}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={cn("font-medium", sizeClasses[size].label, getHealthColor(score))}>
          {getHealthLabel(score)}
        </span>
      )}
    </div>
  );
}
