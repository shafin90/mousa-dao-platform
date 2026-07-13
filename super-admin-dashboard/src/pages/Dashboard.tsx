import { useEffect, useState } from 'react';
import KpiCard from '../components/ui/KpiCard';
import RevenueChart from '../components/charts/RevenueChart';
import BookingTrendChart from '../components/charts/BookingTrendChart';
import StatusBadge from '../components/ui/StatusBadge';
import { api } from '../api/endpoints';
import type { DashboardKpi, RevenueData, BookingTrend } from '../types';

export default function Dashboard() {
  const [kpi, setKpi] = useState<DashboardKpi | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [trends, setTrends] = useState<BookingTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [k, r, t] = await Promise.all([
        api.getDashboardKpi(),
        api.getRevenue('daily'),
        api.getBookingTrends(),
      ]);
      setKpi(k);
      setRevenue(r.slice(-30));
      setTrends(t.slice(-30));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-text-secondary">
        Loading dashboard...
      </div>
    );
  }

  if (!kpi) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Dashboard Overview</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">System:</span>
          <StatusBadge status={kpi.systemStatus === 'healthy' ? 'healthy' : 'degraded'} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Companies" value={kpi.totalTenants} icon={<span>▦</span>} color="blue" />
        <KpiCard
          label="Total Revenue"
          value={`$${(kpi.totalRevenue / 1000).toFixed(0)}k`}
          icon={<span>₿</span>}
          color="green"
          trend={{ value: 12.5, isUp: true }}
        />
        <KpiCard label="Total Bookings" value={kpi.totalBookings.toLocaleString()} icon={<span>☰</span>} color="purple" trend={{ value: 8.2, isUp: true }} />
        <KpiCard label="Active Trips" value={kpi.activeTrips} icon={<span>◉</span>} color="orange" />
        <KpiCard label="Active Buses" value={kpi.activeBuses} icon={<span>▣</span>} color="blue" trend={{ value: 3.1, isUp: true }} />
        <KpiCard
          label="Uptime"
          value="99.97%"
          icon={<span>⚙</span>}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue (Last 30 Days)</h3>
          <RevenueChart data={revenue} />
        </div>
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Booking Trends (Last 30 Days)</h3>
          <BookingTrendChart data={trends} />
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'API Uptime', value: '99.97%', status: 'healthy' },
            { label: 'WebSocket Connections', value: '42', status: 'healthy' },
            { label: 'RabbitMQ Queue', value: 'Healthy', status: 'healthy' },
            { label: 'Database', value: 'Connected', status: 'healthy' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <span className="w-2 h-2 rounded-full bg-success" />
              <div>
                <div className="text-xs text-text-secondary">{item.label}</div>
                <div className="text-sm font-medium text-text-primary">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
