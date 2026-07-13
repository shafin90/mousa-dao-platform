import { useEffect, useState, useCallback } from 'react';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { api } from '../api/endpoints';
import type { Booking } from '../types';

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tenantFilter, setTenantFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const { data, total } = await api.getBookings({
      page,
      tenantId: tenantFilter || undefined,
      status: statusFilter || undefined,
      date: dateFilter || undefined,
    });
    setBookings(data);
    setTotal(total);
    setLoading(false);
  }, [page, tenantFilter, statusFilter, dateFilter]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  useEffect(() => {
    api.getTenants({}).then(({ data }) => {
      setTenants(data.map(t => ({ id: t.id, name: t.companyName })));
    });
  }, []);

  const columns: Column<Booking>[] = [
    { key: 'id', header: 'Booking ID', render: (b) => <span className="font-mono text-xs text-text-secondary">{b.id}</span> },
    { key: 'customerName', header: 'Customer' },
    { key: 'tenantName', header: 'Company' },
    { key: 'route', header: 'Route' },
    { key: 'date', header: 'Date', render: (b) => new Date(b.date).toLocaleDateString() },
    { key: 'amount', header: 'Amount', render: (b) => `$${b.amount.toFixed(2)}` },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Bookings</h1>
        <span className="text-xs text-text-secondary">{total} bookings</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={tenantFilter} onChange={(e) => { setTenantFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-card-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/30">
          <option value="">All Companies</option>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-card-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/30">
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-card-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        keyExtractor={(b) => b.id}
        onRowClick={setSelectedBooking}
        loading={loading}
        emptyMessage="No bookings found"
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

      <Modal open={!!selectedBooking} onClose={() => setSelectedBooking(null)} title={`Booking ${selectedBooking?.id}`} width="max-w-xl">
        {selectedBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Customer', value: selectedBooking.customerName },
                { label: 'Company', value: selectedBooking.tenantName },
                { label: 'Route', value: selectedBooking.route },
                { label: 'Date', value: new Date(selectedBooking.date).toLocaleDateString() },
                { label: 'Seat', value: selectedBooking.seatNumber },
                { label: 'Amount', value: `$${selectedBooking.amount.toFixed(2)}` },
                { label: 'Status', value: <StatusBadge status={selectedBooking.status} /> },
                { label: 'Booking ID', value: selectedBooking.id },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-text-secondary">{label}</div>
                  <div className="text-sm font-medium text-text-primary mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
