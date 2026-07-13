import { useEffect, useState, useCallback } from 'react';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { api } from '../api/endpoints';
import type { Tenant, TenantUsageStats } from '../types';

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantUsage, setTenantUsage] = useState<TenantUsageStats | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ companyName: '', email: '', phone: '', plan: 'basic' as Tenant['plan'] });

  const loadTenants = useCallback(async () => {
    setLoading(true);
    const { data, total } = await api.getTenants({ search });
    setTenants(data);
    setTotal(total);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  const openTenant = async (t: Tenant) => {
    setSelectedTenant(t);
    try {
      const usage = await api.getTenantUsage(t.id);
      setTenantUsage(usage);
    } catch {
      setTenantUsage(null);
    }
  };

  const toggleStatus = async (t: Tenant) => {
    const newStatus = t.status === 'active' ? 'suspended' : 'active';
    await api.updateTenantStatus(t.id, newStatus);
    loadTenants();
  };

  const createTenant = async () => {
    await api.createTenant(form);
    setShowCreate(false);
    setForm({ companyName: '', email: '', phone: '', plan: 'basic' });
    loadTenants();
  };

  const columns: Column<Tenant>[] = [
    { key: 'companyName', header: 'Company', render: (t) => (
      <div>
        <div className="font-medium text-text-primary">{t.companyName}</div>
        <div className="text-xs text-text-secondary">{t.email}</div>
      </div>
    )},
    { key: 'plan', header: 'Plan', render: (t) => (
      <span className="text-sm capitalize">{t.plan}</span>
    )},
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    { key: 'totalRevenue', header: 'Revenue', render: (t) => `$${(t.totalRevenue / 1000).toFixed(1)}k` },
    { key: 'activeBuses', header: 'Buses', render: (t) => t.activeBuses },
    { key: 'actions', header: 'Actions', render: (t) => (
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); openTenant(t); }}
          className="text-xs text-accent hover:underline font-medium">View</button>
        <button onClick={(e) => { e.stopPropagation(); toggleStatus(t); }}
          className={`text-xs font-medium hover:underline ${t.status === 'active' ? 'text-danger' : 'text-success'}`}>
          {t.status === 'active' ? 'Suspend' : 'Activate'}
        </button>
      </div>
    ), className: 'text-right' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Tenants</h1>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + New Tenant
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by company name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 px-3 py-1.5 text-sm border border-card-border rounded-lg bg-white placeholder:text-text-secondary 
                     focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        <span className="text-xs text-text-secondary">{total} companies</span>
      </div>

      <DataTable
        columns={columns}
        data={tenants}
        keyExtractor={(t) => t.id}
        onRowClick={openTenant}
        loading={loading}
        emptyMessage="No tenants found"
      />

      <Modal open={!!selectedTenant} onClose={() => setSelectedTenant(null)} title={selectedTenant?.companyName || 'Tenant Details'} width="max-w-2xl">
        {selectedTenant && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Email', value: selectedTenant.email },
                { label: 'Phone', value: selectedTenant.phone },
                { label: 'Plan', value: selectedTenant.plan },
                { label: 'Status', value: <StatusBadge status={selectedTenant.status} /> },
                { label: 'Total Revenue', value: `$${selectedTenant.totalRevenue.toLocaleString()}` },
                { label: 'Active Buses', value: selectedTenant.activeBuses },
                { label: 'Total Bookings', value: selectedTenant.totalBookings.toLocaleString() },
                { label: 'Created', value: new Date(selectedTenant.createdAt).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-text-secondary">{label}</div>
                  <div className="text-sm font-medium text-text-primary mt-0.5">{value}</div>
                </div>
              ))}
            </div>
            {tenantUsage && (
              <>
                <hr className="border-card-border" />
                <h4 className="text-sm font-semibold text-text-primary">Usage Stats</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Active Trips', value: tenantUsage.activeTrips },
                    { label: 'Monthly Growth', value: `${tenantUsage.monthlyGrowth > 0 ? '+' : ''}${tenantUsage.monthlyGrowth}%`,
                      color: tenantUsage.monthlyGrowth >= 0 ? 'text-success' : 'text-danger' },
                    { label: 'Avg Bookings/Month', value: Math.round(tenantUsage.totalBookings / 12).toLocaleString() },
                    { label: 'Avg Revenue/Month', value: `$${Math.round(tenantUsage.totalRevenue / 12).toLocaleString()}` },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-text-secondary">{label}</div>
                      <div className={`text-sm font-semibold mt-0.5 ${color || 'text-text-primary'}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Tenant">
        <div className="space-y-4">
          {(['companyName', 'email', 'phone'] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-text-secondary mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
              <input
                type={field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder={`Enter ${field}`}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Plan</label>
            <select value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value as Tenant['plan'] })}
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent bg-white">
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-card-border rounded-lg transition-colors">Cancel</button>
            <button onClick={createTenant} className="px-4 py-2 text-sm text-white bg-accent rounded-lg hover:bg-blue-700 transition-colors">Create</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
