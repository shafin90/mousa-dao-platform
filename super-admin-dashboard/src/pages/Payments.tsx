import { useEffect, useState, useCallback } from 'react';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { api } from '../api/endpoints';
import type { Payment } from '../types';

const tabs = [
  { key: '', label: 'All' },
  { key: 'successful', label: 'Successful' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
  { key: 'refunded', label: 'Refunded' },
] as const;

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const { data, total } = await api.getPayments({
      page,
      status: activeTab || undefined,
    });
    setPayments(data);
    setTotal(total);
    setLoading(false);
  }, [page, activeTab]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const columns: Column<Payment>[] = [
    { key: 'id', header: 'Transaction ID', render: (p) => <span className="font-mono text-xs text-text-secondary">{p.id}</span> },
    { key: 'tenantName', header: 'Company' },
    { key: 'amount', header: 'Amount', render: (p) => <span className="font-medium">${p.amount.toFixed(2)}</span> },
    { key: 'fee', header: 'Fee', render: (p) => `$${p.fee.toFixed(2)}` },
    { key: 'netAmount', header: 'Net', render: (p) => <span className="font-medium text-success">${p.netAmount.toFixed(2)}</span> },
    { key: 'method', header: 'Method', render: (p) => (
      <span className="text-sm capitalize">{p.method.replace('_', ' ')}</span>
    )},
    { key: 'createdAt', header: 'Date', render: (p) => new Date(p.createdAt).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Payments</h1>
        <span className="text-xs text-text-secondary">{total} transactions</span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={payments}
        keyExtractor={(p) => p.id}
        loading={loading}
        emptyMessage="No payments found"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">Page {page} · {total} total</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-xs font-medium border border-card-border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Previous</button>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-xs font-medium border border-card-border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
