import { useEffect, useState } from 'react';
import RevenueChart from '../components/charts/RevenueChart';
import SimpleBarChart from '../components/charts/SimpleBarChart';
import SimplePieChart from '../components/charts/SimplePieChart';
import KpiCard from '../components/ui/KpiCard';
import { api } from '../api/endpoints';
import type { RevenueData } from '../types';

interface PerTenantRow {
  name: string;
  revenue: number;
  bookings: number;
  share: number;
}

export default function Analytics() {
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<RevenueData[]>([]);
  const [perTenant, setPerTenant] = useState<PerTenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [dailyRev, monthlyRev, tenantsRes] = await Promise.all([
        api.getRevenue('daily'),
        api.getRevenue('monthly'),
        api.getTenants({}),
      ]);
      setRevenue(dailyRev.slice(-30));
      setMonthlyRevenue(monthlyRev);

      const totalRev = tenantsRes.data.reduce((s, t) => s + t.totalRevenue, 0);
      const rows = tenantsRes.data
        .filter(t => t.totalRevenue > 0)
        .map(t => ({
          name: t.companyName,
          revenue: t.totalRevenue,
          bookings: t.totalBookings,
          share: (t.totalRevenue / totalRev) * 100,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      setPerTenant(rows);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-sm text-text-secondary">Loading analytics...</div>;
  }

  const totalRev = perTenant.reduce((s, r) => s + r.revenue, 0);
  const totalBookings = perTenant.reduce((s, r) => s + r.bookings, 0);

  // Simulate subscription vs transaction split
  const subscriptionRev = Math.round(totalRev * 0.35);
  const transactionRev = totalRev - subscriptionRev;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Revenue Analytics</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue (Platform)" value={`$${(totalRev / 1000).toFixed(0)}k`} icon={<span>₿</span>} color="blue" />
        <KpiCard label="Total Bookings" value={totalBookings.toLocaleString()} icon={<span>☰</span>} color="purple" />
        <KpiCard label="Avg Revenue/Tenant" value={`$${Math.round(totalRev / perTenant.length / 1000)}k`} icon={<span>▦</span>} color="green" />
        <KpiCard label="Platform Growth" value="+14.3%" icon={<span>↑</span>} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Daily Revenue (Last 30 Days)</h3>
          <RevenueChart data={revenue} />
        </div>
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Revenue</h3>
          <RevenueChart data={monthlyRevenue} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue by Company</h3>
          <SimpleBarChart
            data={perTenant.slice(0, 8).map(r => ({ label: r.name, value: r.revenue }))}
            formatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
        </div>
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Subscription vs Transaction</h3>
          <SimplePieChart
            data={[
              { name: 'Subscription Revenue', value: subscriptionRev },
              { name: 'Transaction Revenue', value: transactionRev },
            ]}
            colors={['#3b82f6', '#22c55e']}
          />
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-card-border">
          <h3 className="text-sm font-semibold text-text-primary">Top Performing Companies</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                {['#', 'Company', 'Revenue', 'Bookings', 'Market Share'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {perTenant.slice(0, 5).map((r, i) => (
                <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-text-secondary">{i + 1}</td>
                  <td className="px-5 py-3 text-sm font-medium text-text-primary">{r.name}</td>
                  <td className="px-5 py-3 text-sm text-text-primary">${(r.revenue / 1000).toFixed(1)}k</td>
                  <td className="px-5 py-3 text-sm text-text-primary">{r.bookings.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${r.share}%` }} />
                      </div>
                      <span className="text-xs text-text-secondary">{r.share.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
