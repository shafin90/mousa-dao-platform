import { useEffect, useState } from 'react';
import StatusBadge from '../components/ui/StatusBadge';
import { api } from '../api/endpoints';
import type { SystemStatus } from '../types';

export default function System() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getSystemStatus();
        setStatus(data);
      } catch {
        setStatus(null);
      }
      setLoading(false);
    };
    load();
    const interval = setInterval(async () => {
      try {
        const data = await api.getSystemStatus();
        setStatus(data);
      } catch {
        setStatus(null);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-sm text-text-secondary">Loading system status...</div>;
  }

  if (!status || status.apiUptime === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-text-secondary">
        System monitoring unavailable
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">System Monitoring</h1>
        <span className="text-xs text-text-secondary">Last checked: {new Date(status.lastChecked).toLocaleTimeString()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">API Uptime</span>
            <StatusBadge status={status.apiUptime > 99.5 ? 'healthy' : 'degraded'} />
          </div>
          <div className="text-2xl font-bold text-text-primary">{status.apiUptime}%</div>
          <div className="text-xs text-text-secondary mt-1">Last 30 days</div>
          <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: `${status.apiUptime}%` }} />
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">WebSocket Connections</span>
            <StatusBadge status="healthy" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{status.activeWebSocketConnections}</div>
          <div className="text-xs text-text-secondary mt-1">Active connections</div>
          <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min((status.activeWebSocketConnections / 100) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">RabbitMQ Queue</span>
            <StatusBadge status={status.rabbitMQStatus} />
          </div>
          <div className={`text-2xl font-bold ${status.rabbitMQStatus === 'healthy' ? 'text-success' : status.rabbitMQStatus === 'degraded' ? 'text-warning' : 'text-danger'}`}>
            {status.rabbitMQStatus === 'healthy' ? 'Operational' : status.rabbitMQStatus === 'degraded' ? 'Degraded' : 'Down'}
          </div>
          <div className="text-xs text-text-secondary mt-1">Message queue status</div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl">
        <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Error Logs</h3>
          <span className="text-xs text-text-secondary">{status.errorLogs.length} entries</span>
        </div>
        <div className="divide-y divide-card-border">
          {status.errorLogs.map((log) => (
            <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
              <StatusBadge status={log.severity} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary">{log.message}</div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {log.source} · {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Service Health Indicators</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'API Gateway', status: 'healthy', latency: '12ms' },
            { name: 'Booking Service', status: 'healthy', latency: '45ms' },
            { name: 'Payment Service', status: 'healthy', latency: '120ms' },
            { name: 'GPS Service', status: 'healthy', latency: '28ms' },
            { name: 'Notification Service', status: 'degraded', latency: '340ms' },
            { name: 'Database (Primary)', status: 'healthy', latency: '3ms' },
            { name: 'Database (Replica)', status: 'healthy', latency: '5ms' },
            { name: 'Redis Cache', status: 'healthy', latency: '1ms' },
          ].map((svc) => (
            <div key={svc.name} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${svc.status === 'healthy' ? 'bg-success' : 'bg-warning'}`} />
                <span className="text-xs font-medium text-text-primary">{svc.name}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <StatusBadge status={svc.status} />
                <span className="text-[10px] text-text-secondary">{svc.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
