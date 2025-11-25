// components/metric-card.tsx

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  status: "success" | "warning" | "error" | undefined;
  statusText: string;
  sparklineData?: number[];
}

const statusColors = {
  success: "from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400",
  warning: "from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-400",
  error: "from-red-500/20 to-pink-600/20 border-red-500/30 text-red-400",
};

export function MetricCard({ title, value, unit, icon: Icon, status, statusText, sparklineData }: MetricCardProps) {
  const statusColorClass = status ? statusColors[status] : "from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-400";

  const maxSparklineValue = Math.max(...(sparklineData || [1]), 1);
  const minSparklineValue = Math.min(...(sparklineData || [0]), 0);
  const range = maxSparklineValue - minSparklineValue || 1;

  return (
    <Card className={`relative overflow-hidden border bg-gradient-to-br ${statusColorClass} backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">{title}</h3>
          <Icon className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-bold text-white">{value}</span>
          <span className="text-sm text-slate-400">{unit}</span>
        </div>
        <div className="mt-2 flex items-center">
          <span className="text-xs font-semibold uppercase tracking-wider">{statusText}</span>
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 opacity-50">
            <svg width="100%" height="100%" className="overflow-visible">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points={sparklineData.map((value, index) => {
                  const x = (index / (sparklineData.length - 1)) * 100;
                  const y = 100 - ((value - minSparklineValue) / range) * 100;
                  return `${x}%,${y}%`;
                }).join(' ')}
                className="text-white/70"
              />
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}