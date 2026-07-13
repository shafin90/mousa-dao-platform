import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; isUp: boolean };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-amber-50 text-amber-600',
  purple: 'bg-purple-50 text-purple-600',
  red: 'bg-red-50 text-red-600',
};

export default function KpiCard({ label, value, subtitle, icon, trend, color = 'blue' }: KpiCardProps) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</span>
        {icon && (
          <span className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-text-primary">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend.isUp ? 'text-success' : 'text-danger'}`}>
            <span>{trend.isUp ? '↑' : '↓'}</span>
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {subtitle && <span className="text-xs text-text-secondary">{subtitle}</span>}
    </div>
  );
}
