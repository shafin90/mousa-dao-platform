import fs from 'fs';
import path from 'path';

const baseDir = 'c:/projects/personal projects/test/src';

// 1. Update types
const typesPath = path.join(baseDir, 'shared/types/index.ts');
let typesContent = fs.readFileSync(typesPath, 'utf8');
const newTypes = `
export interface Ticket {
  id: string;
  ticketNumber: string;
  bookingId: string;
  passengerName: string;
  seatNumber: string;
  status: "valid" | "used" | "cancelled" | "expired";
  qrCode: string;
  issueDate: string;
}

export interface AuditLog {
  id: string;
  action: string;
  adminName: string;
  adminRole: string;
  timestamp: string;
  ipAddress: string;
  module: string;
  details: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  readStatus: "read" | "unread";
  createdAt: string;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  pricingMultiplier: number;
  currency: string;
  commissionRate: number;
  bookingEnabled: boolean;
  supportEmail: string;
}
`;
if (!typesContent.includes('export interface Ticket')) {
  fs.writeFileSync(typesPath, typesContent + '\n' + newTypes);
}

// Helper to create files
function createFiles(feature, files) {
  const dir = path.join(baseDir, 'features', feature);
  ['mock', 'services', 'store', 'hooks', 'pages', 'components', 'types', 'utils'].forEach(d => {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
  });

  for (const [filepath, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, filepath), content.trim() + '\n');
  }
}

// --- 1. Routes Feature ---
createFiles('routes', {
  'mock/routesMock.ts': `
import type { Route } from "../../../shared/types";
export const mockRoutes: Route[] = [
  { id: "R001", origin: "New York", destination: "Boston", distance: "215 miles", duration: "4h 15m", basePrice: 45 },
  { id: "R002", origin: "Los Angeles", destination: "San Francisco", distance: "383 miles", duration: "6h 30m", basePrice: 65 },
  { id: "R003", origin: "Chicago", destination: "Detroit", distance: "283 miles", duration: "4h 45m", basePrice: 50 },
  { id: "R004", origin: "Houston", destination: "Dallas", distance: "239 miles", duration: "3h 45m", basePrice: 40 },
  { id: "R005", origin: "Seattle", destination: "Portland", distance: "173 miles", duration: "3h 0m", basePrice: 35 },
];
  `,
  'services/routeService.ts': `
import { mockRoutes } from "../mock/routesMock";
import type { Route } from "../../../shared/types";
export const getRoutes = async (): Promise<Route[]> => {
  return new Promise((resolve) => { setTimeout(() => resolve(mockRoutes), 800); });
};
  `,
  'store/routeSlice.ts': `
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getRoutes } from "../services/routeService";
import type { Route } from "../../../shared/types";
export const fetchRoutes = createAsyncThunk("routes/fetchRoutes", async () => {
  return await getRoutes();
});
interface RouteState { routes: Route[]; loading: boolean; error: string | null; }
const initialState: RouteState = { routes: [], loading: false, error: null };
const routeSlice = createSlice({
  name: "routes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoutes.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRoutes.fulfilled, (state, action) => { state.loading = false; state.routes = action.payload; })
      .addCase(fetchRoutes.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Failed"; });
  },
});
export default routeSlice.reducer;
  `,
  'hooks/useRoutes.ts': `
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/store";
import { fetchRoutes } from "../store/routeSlice";
export const useRoutes = () => {
  const dispatch = useAppDispatch();
  const { routes, loading, error } = useAppSelector((state) => state.routes);
  useEffect(() => { if (routes.length === 0) dispatch(fetchRoutes()); }, [dispatch, routes.length]);
  return { routes, loading, error };
};
  `,
  'pages/RoutesPage.tsx': `
import React from "react";
import { useRoutes } from "../hooks/useRoutes";
import { DataTable } from "../../../shared/components/tables/DataTable";
import { Button } from "../../../shared/components/ui/Button";
import { Plus, Search, Map } from "lucide-react";
import type { Route } from "../../../shared/types";

const RoutesPage: React.FC = () => {
  const { routes, loading } = useRoutes();
  const columns = [
    { header: "Route ID", accessor: (item: Route) => <span className="font-mono">{item.id}</span> },
    { header: "Origin", accessor: "origin" as keyof Route },
    { header: "Destination", accessor: "destination" as keyof Route },
    { header: "Distance", accessor: "distance" as keyof Route },
    { header: "Duration", accessor: "duration" as keyof Route },
    { header: "Base Price", accessor: (item: Route) => <span className="font-medium">CFA \$\${item.basePrice.toFixed(2)}</span> },
    { header: "Actions", accessor: () => <Button variant="ghost" size="sm">Edit</Button> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
          <p className="text-muted-foreground mt-1">Manage bus routes, schedules, and pricing.</p>
        </div>
        <Button size="sm" className="gap-2"><Plus size={16} /> New Route</Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search routes..." className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      <DataTable columns={columns} data={routes} isLoading={loading} onRowClick={(item) => console.log(item.id)} />
    </div>
  );
};
export default RoutesPage;
  `
});

// --- 2. Tickets Feature ---
createFiles('tickets', {
  'mock/ticketsMock.ts': `
import type { Ticket } from "../../../shared/types";
export const mockTickets: Ticket[] = [
  { id: "T001", ticketNumber: "TCK-9821-443", bookingId: "B001", passengerName: "Alice Smith", seatNumber: "12A", status: "valid", qrCode: "QR123", issueDate: "2023-11-01" },
  { id: "T002", ticketNumber: "TCK-5521-889", bookingId: "B002", passengerName: "Bob Jones", seatNumber: "14B", status: "used", qrCode: "QR124", issueDate: "2023-11-02" },
  { id: "T003", ticketNumber: "TCK-1123-990", bookingId: "B003", passengerName: "Charlie Brown", seatNumber: "2C", status: "cancelled", qrCode: "QR125", issueDate: "2023-11-05" },
];
  `,
  'services/ticketService.ts': `
import { mockTickets } from "../mock/ticketsMock";
import type { Ticket } from "../../../shared/types";
export const getTickets = async (): Promise<Ticket[]> => {
  return new Promise((resolve) => { setTimeout(() => resolve(mockTickets), 700); });
};
  `,
  'store/ticketSlice.ts': `
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getTickets } from "../services/ticketService";
import type { Ticket } from "../../../shared/types";
export const fetchTickets = createAsyncThunk("tickets/fetchTickets", async () => await getTickets());
interface TicketState { tickets: Ticket[]; loading: boolean; error: string | null; }
const initialState: TicketState = { tickets: [], loading: false, error: null };
const ticketSlice = createSlice({
  name: "tickets", initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTickets.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchTickets.fulfilled, (s, a) => { s.loading = false; s.tickets = a.payload; })
     .addCase(fetchTickets.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; });
  },
});
export default ticketSlice.reducer;
  `,
  'hooks/useTickets.ts': `
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/store";
import { fetchTickets } from "../store/ticketSlice";
export const useTickets = () => {
  const dispatch = useAppDispatch();
  const { tickets, loading, error } = useAppSelector((state) => state.tickets);
  useEffect(() => { if (tickets.length === 0) dispatch(fetchTickets()); }, [dispatch, tickets.length]);
  return { tickets, loading, error };
};
  `,
  'pages/TicketsPage.tsx': `
import React from "react";
import { useTickets } from "../hooks/useTickets";
import { DataTable } from "../../../shared/components/tables/DataTable";
import { Badge } from "../../../shared/components/ui/Badge";
import { Button } from "../../../shared/components/ui/Button";
import { Search, QrCode } from "lucide-react";
import type { Ticket } from "../../../shared/types";

const TicketsPage: React.FC = () => {
  const { tickets, loading } = useTickets();
  const columns = [
    { header: "Ticket No", accessor: (item: Ticket) => <span className="font-mono font-medium">{item.ticketNumber}</span> },
    { header: "Passenger", accessor: "passengerName" as keyof Ticket },
    { header: "Seat", accessor: "seatNumber" as keyof Ticket },
    { header: "Status", accessor: (item: Ticket) => {
        const variants: Record<string, "success"|"secondary"|"destructive"|"warning"> = { valid: "success", used: "secondary", cancelled: "destructive", expired: "warning" };
        return <Badge variant={variants[item.status]}>{item.status.toUpperCase()}</Badge>;
    }},
    { header: "Actions", accessor: () => <Button variant="outline" size="sm" className="gap-2"><QrCode size={14}/> Verify</Button> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground mt-1">Verify and manage passenger tickets.</p>
        </div>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Scan or search ticket..." className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      <DataTable columns={columns} data={tickets} isLoading={loading} />
    </div>
  );
};
export default TicketsPage;
  `
});

// --- 3. Audit Logs Feature ---
createFiles('audit-logs', {
  'mock/auditLogsMock.ts': `
import type { AuditLog } from "../../../shared/types";
export const mockAuditLogs: AuditLog[] = [
  { id: "A001", action: "Updated Bus Status", adminName: "John Doe", adminRole: "Super Admin", timestamp: "2023-11-10T10:23:00Z", ipAddress: "192.168.1.1", module: "Fleet", details: "Changed Bus B-402 to Maintenance" },
  { id: "A002", action: "Refunded Booking", adminName: "Jane Smith", adminRole: "Support", timestamp: "2023-11-10T11:05:00Z", ipAddress: "192.168.1.5", module: "Payments", details: "Refunded CFA 45.00 for B001" },
  { id: "A003", action: "Modified Route Price", adminName: "John Doe", adminRole: "Super Admin", timestamp: "2023-11-10T14:30:00Z", ipAddress: "192.168.1.1", module: "Routes", details: "Increased base price of R002 to CFA 70" },
];
  `,
  'services/auditLogService.ts': `
import { mockAuditLogs } from "../mock/auditLogsMock";
import type { AuditLog } from "../../../shared/types";
export const getAuditLogs = async (): Promise<AuditLog[]> => {
  return new Promise((resolve) => { setTimeout(() => resolve(mockAuditLogs), 600); });
};
  `,
  'store/auditLogSlice.ts': `
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAuditLogs } from "../services/auditLogService";
import type { AuditLog } from "../../../shared/types";
export const fetchAuditLogs = createAsyncThunk("auditLogs/fetchAuditLogs", async () => await getAuditLogs());
interface AuditLogState { logs: AuditLog[]; loading: boolean; error: string | null; }
const initialState: AuditLogState = { logs: [], loading: false, error: null };
const auditLogSlice = createSlice({
  name: "auditLogs", initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAuditLogs.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchAuditLogs.fulfilled, (s, a) => { s.loading = false; s.logs = a.payload; })
     .addCase(fetchAuditLogs.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; });
  },
});
export default auditLogSlice.reducer;
  `,
  'hooks/useAuditLogs.ts': `
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/store";
import { fetchAuditLogs } from "../store/auditLogSlice";
export const useAuditLogs = () => {
  const dispatch = useAppDispatch();
  const { logs, loading, error } = useAppSelector((state) => state.auditLogs);
  useEffect(() => { if (logs.length === 0) dispatch(fetchAuditLogs()); }, [dispatch, logs.length]);
  return { logs, loading, error };
};
  `,
  'pages/AuditLogsPage.tsx': `
import React from "react";
import { useAuditLogs } from "../hooks/useAuditLogs";
import { DataTable } from "../../../shared/components/tables/DataTable";
import { Badge } from "../../../shared/components/ui/Badge";
import type { AuditLog } from "../../../shared/types";
import { History } from "lucide-react";

const AuditLogsPage: React.FC = () => {
  const { logs, loading } = useAuditLogs();
  const columns = [
    { header: "Timestamp", accessor: (item: AuditLog) => new Date(item.timestamp).toLocaleString() },
    { header: "Admin", accessor: (item: AuditLog) => (
        <div><p className="font-medium">{item.adminName}</p><p className="text-xs text-muted-foreground">{item.adminRole}</p></div>
    )},
    { header: "Module", accessor: (item: AuditLog) => <Badge variant="outline">{item.module}</Badge> },
    { header: "Action", accessor: (item: AuditLog) => <span className="font-medium">{item.action}</span> },
    { header: "IP Address", accessor: (item: AuditLog) => <span className="font-mono text-xs text-muted-foreground">{item.ipAddress}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary"><History size={24}/></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track system changes and admin activities.</p>
        </div>
      </div>
      <DataTable columns={columns} data={logs} isLoading={loading} />
    </div>
  );
};
export default AuditLogsPage;
  `
});

// --- 4. Notifications Feature ---
createFiles('notifications', {
  'mock/notificationsMock.ts': `
import type { Notification } from "../../../shared/types";
export const mockNotifications: Notification[] = [
  { id: "N001", title: "New Booking Received", message: "Booking B005 confirmed for New York to Boston.", type: "success", readStatus: "unread", createdAt: "2023-11-10T09:00:00Z" },
  { id: "N002", title: "Bus Maintenance Required", message: "Bus B-402 reported AC failure.", type: "warning", readStatus: "unread", createdAt: "2023-11-10T10:15:00Z" },
  { id: "N003", title: "Payment Failed", message: "Stripe payment failed for Customer John.", type: "error", readStatus: "read", createdAt: "2023-11-09T14:20:00Z" },
  { id: "N004", title: "System Update", message: "Scheduled maintenance at 2 AM EST.", type: "info", readStatus: "read", createdAt: "2023-11-08T08:00:00Z" },
];
  `,
  'services/notificationService.ts': `
import { mockNotifications } from "../mock/notificationsMock";
import type { Notification } from "../../../shared/types";
export const getNotifications = async (): Promise<Notification[]> => {
  return new Promise((resolve) => { setTimeout(() => resolve(mockNotifications), 500); });
};
  `,
  'store/notificationSlice.ts': `
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getNotifications } from "../services/notificationService";
import type { Notification } from "../../../shared/types";
export const fetchNotifications = createAsyncThunk("notifications/fetchNotifications", async () => await getNotifications());
interface NotificationState { notifications: Notification[]; loading: boolean; error: string | null; }
const initialState: NotificationState = { notifications: [], loading: false, error: null };
const notificationSlice = createSlice({
  name: "notifications", initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchNotifications.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchNotifications.fulfilled, (s, a) => { s.loading = false; s.notifications = a.payload; })
     .addCase(fetchNotifications.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; });
  },
});
export default notificationSlice.reducer;
  `,
  'hooks/useNotifications.ts': `
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/store";
import { fetchNotifications } from "../store/notificationSlice";
export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const { notifications, loading, error } = useAppSelector((state) => state.notifications);
  useEffect(() => { if (notifications.length === 0) dispatch(fetchNotifications()); }, [dispatch, notifications.length]);
  return { notifications, loading, error };
};
  `,
  'pages/NotificationsPage.tsx': `
import React from "react";
import { useNotifications } from "../hooks/useNotifications";
import { Bell, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";

const NotificationsPage: React.FC = () => {
  const { notifications, loading } = useNotifications();
  
  const getIcon = (type: string) => {
    switch(type) {
      case "success": return <CheckCircle className="text-emerald-500" size={20} />;
      case "warning": return <AlertTriangle className="text-amber-500" size={20} />;
      case "error": return <XCircle className="text-red-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <Button variant="outline" size="sm">Mark all as read</Button>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-secondary/50 animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => (
            <div key={notif.id} className={\`p-4 rounded-lg border flex gap-4 \${notif.readStatus === 'unread' ? 'bg-primary/5 border-primary/20' : 'bg-card'}\`}>
              <div className="mt-1">{getIcon(notif.type)}</div>
              <div className="flex-1">
                <h4 className="font-semibold">{notif.title}</h4>
                <p className="text-muted-foreground mt-1 text-sm">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default NotificationsPage;
  `
});

// --- 5. Configuration Feature ---
createFiles('config', {
  'mock/configMock.ts': `
import type { SystemConfig } from "../../../shared/types";
export const mockConfig: SystemConfig = {
  maintenanceMode: false,
  pricingMultiplier: 1.0,
  currency: "XOF",
  commissionRate: 5.0,
  bookingEnabled: true,
  supportEmail: "support@busadmin.com"
};
  `,
  'services/configService.ts': `
import { mockConfig } from "../mock/configMock";
import type { SystemConfig } from "../../../shared/types";
export const getConfig = async (): Promise<SystemConfig> => {
  return new Promise((resolve) => { setTimeout(() => resolve(mockConfig), 400); });
};
  `,
  'store/configSlice.ts': `
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getConfig } from "../services/configService";
import type { SystemConfig } from "../../../shared/types";
export const fetchConfig = createAsyncThunk("config/fetchConfig", async () => await getConfig());
interface ConfigState { config: SystemConfig | null; loading: boolean; error: string | null; }
const initialState: ConfigState = { config: null, loading: false, error: null };
const configSlice = createSlice({
  name: "config", initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchConfig.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchConfig.fulfilled, (s, a) => { s.loading = false; s.config = a.payload; })
     .addCase(fetchConfig.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; });
  },
});
export default configSlice.reducer;
  `,
  'hooks/useConfig.ts': `
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/store";
import { fetchConfig } from "../store/configSlice";
export const useConfig = () => {
  const dispatch = useAppDispatch();
  const { config, loading, error } = useAppSelector((state) => state.config);
  useEffect(() => { if (!config) dispatch(fetchConfig()); }, [dispatch, config]);
  return { config, loading, error };
};
  `,
  'pages/ConfigPage.tsx': `
import React from "react";
import { useConfig } from "../hooks/useConfig";
import { Settings, Save } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";

const ConfigPage: React.FC = () => {
  const { config, loading } = useConfig();

  if (loading || !config) return <div>Loading configuration...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <p className="text-muted-foreground mt-1">Manage global platform settings.</p>
      </div>
      
      <div className="grid gap-6">
        <div className="p-6 border rounded-xl bg-card space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2"><Settings size={20}/> General Settings</h2>
          <hr className="border-border"/>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Support Email</label>
              <input type="email" defaultValue={config.supportEmail} className="w-full p-2 rounded-md border bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency Code</label>
              <select defaultValue={config.currency} className="w-full p-2 rounded-md border bg-background">
                <option value="XOF">XOF (CFA)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card space-y-4">
          <h2 className="text-xl font-semibold">Pricing & Features</h2>
          <hr className="border-border"/>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Commission Rate (%)</label>
              <input type="number" defaultValue={config.commissionRate} className="w-full p-2 rounded-md border bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pricing Multiplier</label>
              <input type="number" step="0.1" defaultValue={config.pricingMultiplier} className="w-full p-2 rounded-md border bg-background" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="booking" defaultChecked={config.bookingEnabled} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="booking" className="text-sm font-medium">Enable New Bookings</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="maintenance" defaultChecked={config.maintenanceMode} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="maintenance" className="text-sm font-medium text-destructive">Maintenance Mode</label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2"><Save size={16}/> Save Changes</Button>
      </div>
    </div>
  );
};
export default ConfigPage;
  `
});
