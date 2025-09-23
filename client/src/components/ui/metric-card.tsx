import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
  progress?: number;
  progressColor?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  progress,
  progressColor = "bg-primary"
}: MetricCardProps) {
  return (
    <Card className="shadow-sm border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {title}
            </p>
            <p className="text-2xl font-bold" data-testid={`value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-muted-foreground" data-testid={`subtitle-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBgColor)}>
            <Icon className={cn("text-xl h-6 w-6", iconColor)} />
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={cn("h-2 rounded-full progress-bar", progressColor)} 
                style={{ width: `${progress}%` }}
                data-testid={`progress-${title.toLowerCase().replace(/\s+/g, '-')}`}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
