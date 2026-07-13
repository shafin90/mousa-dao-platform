import fs from 'fs';
import path from 'path';

const pages = {
  // 1. Dashboard
  'c:/projects/personal projects/test/src/features/dashboard/pages/DashboardPage.tsx': `
import React from "react";
import { DashboardStats } from "../components/DashboardStats";
import { DashboardCharts } from "../components/DashboardCharts";
import { RecentBookings } from "../components/RecentBookings";
import { useDashboard } from "../hooks/useDashboard";
import { Button } from "../../../shared/components/ui/Button";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const DashboardPage: React.FC = () => {
  const { stats, loading } = useDashboard();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your platform's performance today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Dashboard data refreshed!")}>
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={() => toast.success("Exporting dashboard report to CSV...")}>
            <Download size={16} /> Export
          </Button>
        </div>
      </div>
      <DashboardStats stats={stats} isLoading={loading} />
      <DashboardCharts stats={stats} isLoading={loading} />
      <RecentBookings />
    </div>
  );
};
export default DashboardPage;
  `,

  // 2. Bookings
  'c:/projects/personal projects/test/src/features/bookings/pages/BookingsPage.tsx': `
import React, { useState } from "react";
import { useBookings } from "../hooks/useBookings";
import { DataTable } from "../../../shared/components/tables/DataTable";
import { Badge } from "../../../shared/components/ui/Badge";
import { Button } from "../../../shared/components/ui/Button";
import { Search, Filter, Download, Plus } from "lucide-react";
import { Modal } from "../../../shared/components/modals/Modal";
import { toast } from "sonner";
import type { Booking } from "../../../shared/types";

const BookingsPage: React.FC = () => {
  const { bookings, loading } = useBookings();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: "Booking ID", accessor: (item: Booking) => <span className="font-mono font-medium">{item.id}</span> },
    { header: "Customer", accessor: (item: Booking) => (
        <div>
          <p className="font-medium">{item.customerName}</p>
          <p className="text-xs text-muted-foreground">{item.email}</p>
        </div>
      )
    },
    { header: "Route", accessor: "route" as keyof Booking },
    { header: "Travel Date", accessor: (item: Booking) => new Date(item.travelDate).toLocaleDateString() },
    { header: "Status", accessor: (item: Booking) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
          confirmed: "success", pending: "warning", cancelled: "destructive", completed: "secondary"
        };
        return <Badge variant={variants[item.status]}>{item.status.toUpperCase()}</Badge>;
      }
    },
    { header: "Amount", accessor: (item: Booking) => <span className="font-medium">CFA \$\${item.amount.toFixed(2)}</span> },
    { header: "Actions", accessor: () => <Button variant="ghost" size="sm" onClick={() => toast.info("Opening booking details...")}>Details</Button> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all passenger bookings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Exporting bookings...")}>
            <Download size={16} /> Export
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Booking
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search bookings..." className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Filters opened")}>
            <Filter size={16} /> Status
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={bookings} isLoading={loading} onRowClick={(item) => toast.info(\`Row clicked: \${item.id}\`)} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Booking">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Booking created successfully!"); setIsModalOpen(false); }}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Name</label>
            <input required type="text" className="w-full p-2 border rounded-md" placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Route</label>
            <select className="w-full p-2 border rounded-md bg-background">
              <option>New York to Boston</option>
              <option>Los Angeles to San Francisco</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Travel Date</label>
            <input required type="date" className="w-full p-2 border rounded-md" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Booking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default BookingsPage;
  `,

  // 3. Trips
  'c:/projects/personal projects/test/src/features/trips/pages/TripsPage.tsx': `
import React, { useState } from "react";
import { useTrips } from "../hooks/useTrips";
import { DataTable } from "../../../shared/components/tables/DataTable";
import { Badge } from "../../../shared/components/ui/Badge";
import { Button } from "../../../shared/components/ui/Button";
import { Search, Filter, Plus } from "lucide-react";
import { Modal } from "../../../shared/components/modals/Modal";
import { toast } from "sonner";
import type { Trip } from "../../../shared/types";

const TripsPage: React.FC = () => {
  const { trips, loading } = useTrips();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: "Trip ID", accessor: (item: Trip) => <span className="font-mono">{item.id}</span> },
    { header: "Route ID", accessor: "routeId" as keyof Trip },
    { header: "Departure", accessor: (item: Trip) => new Date(item.departureTime).toLocaleString() },
    { header: "Bus", accessor: "busId" as keyof Trip },
    { header: "Seats", accessor: (item: Trip) => <span className="font-medium">{item.availableSeats} / {item.totalSeats}</span> },
    { header: "Status", accessor: (item: Trip) => {
        const variants: Record<string, "success"|"warning"|"destructive"|"secondary"> = {
          "scheduled": "warning", "in-progress": "success", "completed": "secondary", "cancelled": "destructive"
        };
        return <Badge variant={variants[item.status]}>{item.status.toUpperCase()}</Badge>;
    }},
    { header: "Actions", accessor: () => <Button variant="ghost" size="sm" onClick={() => toast.info("Editing trip...")}>Edit</Button> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage bus trips.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Schedule Trip
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search trips..." className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Filter modal open")}>
            <Filter size={16} /> Filters
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={trips} isLoading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Trip">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Trip scheduled successfully!"); setIsModalOpen(false); }}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Route</label>
            <select className="w-full p-2 border rounded-md bg-background">
              <option>R001 - NY to Boston</option>
              <option>R002 - LA to SF</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Assign Bus</label>
            <select className="w-full p-2 border rounded-md bg-background">
              <option>B-401 (Volvo XC)</option>
              <option>B-402 (Mercedes Sprinter)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Departure Time</label>
            <input required type="datetime-local" className="w-full p-2 border rounded-md" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Schedule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default TripsPage;
  `,

  // 4. Fleet
  'c:/projects/personal projects/test/src/features/fleet/pages/FleetPage.tsx': `
import React, { useState } from "react";
import { useFleet } from "../hooks/useFleet";
import { DataTable } from "../../../shared/components/tables/DataTable";
import { Badge } from "../../../shared/components/ui/Badge";
import { Button } from "../../../shared/components/ui/Button";
import { Search, Plus } from "lucide-react";
import { Modal } from "../../../shared/components/modals/Modal";
import { toast } from "sonner";
import type { Bus } from "../../../shared/types";

const FleetPage: React.FC = () => {
  const { fleet, loading } = useFleet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: "Bus ID", accessor: (item: Bus) => <span className="font-mono">{item.id}</span> },
    { header: "Bus Number", accessor: (item: Bus) => <span className="font-bold">{item.busNumber}</span> },
    { header: "Type", accessor: "type" as keyof Bus },
    { header: "Capacity", accessor: "capacity" as keyof Bus },
    { header: "Driver", accessor: "driverName" as keyof Bus },
    { header: "Status", accessor: (item: Bus) => {
        const variants: Record<string, "success"|"warning"|"destructive"> = {
          "active": "success", "maintenance": "warning", "inactive": "destructive"
        };
        return <Badge variant={variants[item.status]}>{item.status.toUpperCase()}</Badge>;
    }},
    { header: "Actions", accessor: () => <Button variant="ghost" size="sm" onClick={() => toast.info("Checking maintenance log...")}>Maintenance</Button> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet Management</h1>
          <p className="text-muted-foreground mt-1">Manage buses, drivers, and maintenance.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Add Bus
        </Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search fleet..." className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      <DataTable columns={columns} data={fleet} isLoading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Bus">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Bus registered successfully!"); setIsModalOpen(false); }}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bus Number (License Plate)</label>
            <input required type="text" className="w-full p-2 border rounded-md" placeholder="XYZ-1234" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bus Type</label>
            <select className="w-full p-2 border rounded-md bg-background">
              <option>AC</option>
              <option>Non-AC</option>
              <option>Sleeper</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Capacity (Seats)</label>
            <input required type="number" min="10" max="100" className="w-full p-2 border rounded-md" defaultValue="40" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Bus</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default FleetPage;
  `,

  // 5. Users
  'c:/projects/personal projects/test/src/features/users/pages/UsersPage.tsx': `
import React, { useState } from "react";
import { useUsers } from "../hooks/useUsers";
import { DataTable } from "../../../shared/components/tables/DataTable";
import { Badge } from "../../../shared/components/ui/Badge";
import { Button } from "../../../shared/components/ui/Button";
import { Search, Plus } from "lucide-react";
import { Modal } from "../../../shared/components/modals/Modal";
import { toast } from "sonner";
import type { User } from "../../../shared/types";

const UsersPage: React.FC = () => {
  const { users, loading } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: "Name", accessor: (item: User) => (
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.email}</p>
        </div>
      )
    },
    { header: "Role", accessor: (item: User) => <Badge variant="outline">{item.role}</Badge> },
    { header: "Status", accessor: (item: User) => <Badge variant={item.status === 'active' ? 'success' : 'destructive'}>{item.status}</Badge> },
    { header: "Last Login", accessor: (item: User) => new Date(item.lastLogin).toLocaleDateString() },
    { header: "Actions", accessor: () => <Button variant="ghost" size="sm" onClick={() => toast.info("Opening user profile...")}>Profile</Button> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Users</h1>
          <p className="text-muted-foreground mt-1">Manage admins and staff accounts.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Add User
        </Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      <DataTable columns={columns} data={users} isLoading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New User">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("User added successfully!"); setIsModalOpen(false); }}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <input required type="text" className="w-full p-2 border rounded-md" placeholder="Alice Smith" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <input required type="email" className="w-full p-2 border rounded-md" placeholder="alice@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <select className="w-full p-2 border rounded-md bg-background">
              <option>Admin</option>
              <option>Customer Support</option>
              <option>Operations</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default UsersPage;
  `,

  // 6. Routes
  'c:/projects/personal projects/test/src/features/routes/pages/RoutesPage.tsx': `
import React, { useState } from "react";
import { useRoutes } from "../hooks/useRoutes";
import { DataTable } from "../../../shared/components/tables/DataTable";
import { Button } from "../../../shared/components/ui/Button";
import { Plus, Search } from "lucide-react";
import { Modal } from "../../../shared/components/modals/Modal";
import { toast } from "sonner";
import type { Route } from "../../../shared/types";

const RoutesPage: React.FC = () => {
  const { routes, loading } = useRoutes();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: "Route ID", accessor: (item: Route) => <span className="font-mono">{item.id}</span> },
    { header: "Origin", accessor: "origin" as keyof Route },
    { header: "Destination", accessor: "destination" as keyof Route },
    { header: "Distance", accessor: "distance" as keyof Route },
    { header: "Duration", accessor: "duration" as keyof Route },
    { header: "Base Price", accessor: (item: Route) => <span className="font-medium">CFA \$\${item.basePrice.toFixed(2)}</span> },
    { header: "Actions", accessor: () => <Button variant="ghost" size="sm" onClick={() => toast.info("Opening edit form...")}>Edit</Button> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
          <p className="text-muted-foreground mt-1">Manage bus routes, schedules, and pricing.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}><Plus size={16} /> New Route</Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search routes..." className="w-full pl-10 pr-4 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      <DataTable columns={columns} data={routes} isLoading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Route">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Route added successfully!"); setIsModalOpen(false); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Origin</label>
              <input required type="text" className="w-full p-2 border rounded-md" placeholder="City A" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <input required type="text" className="w-full p-2 border rounded-md" placeholder="City B" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Distance (miles)</label>
              <input required type="number" className="w-full p-2 border rounded-md" placeholder="300" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (hours)</label>
              <input required type="number" step="0.5" className="w-full p-2 border rounded-md" placeholder="4.5" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Base Price (CFA)</label>
            <input required type="number" className="w-full p-2 border rounded-md" placeholder="50.00" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Route</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default RoutesPage;
  `,

  // 7. Tickets
  'c:/projects/personal projects/test/src/features/tickets/pages/TicketsPage.tsx': `
import React from "react";
import { useTickets } from "../hooks/useTickets";
import { DataTable } from "../../../shared/components/tables/DataTable";
import { Badge } from "../../../shared/components/ui/Badge";
import { Button } from "../../../shared/components/ui/Button";
import { Search, QrCode } from "lucide-react";
import { toast } from "sonner";
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
    { header: "Actions", accessor: () => <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Ticket verified successfully!")}><QrCode size={14}/> Verify</Button> }
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
  `,

  // 8. Notifications
  'c:/projects/personal projects/test/src/features/notifications/pages/NotificationsPage.tsx': `
import React from "react";
import { useNotifications } from "../hooks/useNotifications";
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { toast } from "sonner";

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
        <Button variant="outline" size="sm" onClick={() => toast.success("All notifications marked as read.")}>Mark all as read</Button>
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
  `,

  // 9. Config
  'c:/projects/personal projects/test/src/features/config/pages/ConfigPage.tsx': `
import React from "react";
import { useConfig } from "../hooks/useConfig";
import { Settings, Save } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { toast } from "sonner";

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
        <Button className="gap-2" onClick={() => toast.success("Configuration saved successfully!")}><Save size={16}/> Save Changes</Button>
      </div>
    </div>
  );
};
export default ConfigPage;
  `,
  
  // 10. Payments
  'c:/projects/personal projects/test/src/features/payments/pages/PaymentsPage.tsx': `
import React from "react";
import { useBookings } from "../../bookings/hooks/useBookings";
import { DataTable } from "../../../shared/components/tables/DataTable";
import { Badge } from "../../../shared/components/ui/Badge";
import { Button } from "../../../shared/components/ui/Button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { Booking } from "../../../shared/types";

const PaymentsPage: React.FC = () => {
  const { bookings, loading } = useBookings();
  const columns = [
    { header: "Transaction ID", accessor: (item: Booking) => <span className="font-mono">TXN-{item.id}</span> },
    { header: "Customer", accessor: (item: Booking) => <span className="font-medium">{item.customerName}</span> },
    { header: "Amount", accessor: (item: Booking) => <span className="font-bold">CFA \$\${item.amount.toFixed(2)}</span> },
    { header: "Date", accessor: (item: Booking) => new Date(item.bookingDate).toLocaleString() },
    { header: "Status", accessor: (item: Booking) => {
        const variants: Record<string, "success"|"warning"|"destructive"> = { paid: "success", unpaid: "warning", refunded: "destructive" };
        return <Badge variant={variants[item.paymentStatus]}>{item.paymentStatus.toUpperCase()}</Badge>;
    }},
    { header: "Actions", accessor: () => <Button variant="ghost" size="sm" onClick={() => toast.info("Opening transaction details...")}>Details</Button> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">Track transactions, refunds, and revenue.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Downloading payments CSV...")}>
          <Download size={16} /> Export
        </Button>
      </div>
      <DataTable columns={columns} data={bookings} isLoading={loading} />
    </div>
  );
};
export default PaymentsPage;
  `,
  
  // 11. Analytics
  'c:/projects/personal projects/test/src/features/analytics/pages/AnalyticsPage.tsx': `
import React from "react";
import { DashboardCharts } from "../../dashboard/components/DashboardCharts";
import { useDashboard } from "../../dashboard/hooks/useDashboard";
import { Button } from "../../../shared/components/ui/Button";
import { Download } from "lucide-react";
import { toast } from "sonner";

const AnalyticsPage: React.FC = () => {
  const { stats, loading } = useDashboard();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into platform metrics.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Analytics report downloaded.")}>
          <Download size={16} /> Download Report
        </Button>
      </div>
      <DashboardCharts stats={stats} isLoading={loading} />
    </div>
  );
};
export default AnalyticsPage;
  `
};

for (const [filepath, content] of Object.entries(pages)) {
  fs.writeFileSync(filepath, content.trim() + '\n');
}
