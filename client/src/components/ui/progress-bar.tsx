import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
  showValue?: boolean;
}

export default function ProgressBar({ 
  value, 
  className, 
  barClassName,
  showValue = false 
}: ProgressBarProps) {
  const safeValue = Math.min(Math.max(value, 0), 100);
  
  return (
    <div className={cn("flex items-center", className)}>
      <div className="w-full bg-muted rounded-full h-2 mr-2">
        <div 
          className={cn("h-2 rounded-full progress-bar", barClassName || "bg-primary")} 
          style={{ width: `${safeValue}%` }}
          data-testid={`progress-bar-${safeValue}`}
        />
      </div>
      {showValue && (
        <span className="text-sm font-medium" data-testid={`progress-value-${safeValue}`}>
          {Math.round(safeValue)}%
        </span>
      )}
    </div>
  );
}
