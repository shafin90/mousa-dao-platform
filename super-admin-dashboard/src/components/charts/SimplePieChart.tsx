import { PieChart as RechartPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SimplePieChartProps {
  data: { name: string; value: number }[];
  height?: number;
  colors?: string[];
  innerRadius?: number;
}

const defaultColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SimplePieChart({ data, height = 280, colors = defaultColors, innerRadius = 60 }: SimplePieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartPie>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={innerRadius + 40}
          dataKey="value"
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
          formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => <span className="text-xs text-text-secondary">{value}</span>}
        />
      </RechartPie>
    </ResponsiveContainer>
  );
}
