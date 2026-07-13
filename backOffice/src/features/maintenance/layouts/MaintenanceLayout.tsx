import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarClock,
  ClipboardList,
  AlertTriangle,
  History,
  Package,
  Wallet,
  FileText,
  BellRing,
  Wrench,
  HardHat,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface SubNavItem {
  key: string;
  to: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const SUB_NAV: SubNavItem[] = [
  { key: "dashboard", to: "/maintenance/dashboard", icon: LayoutDashboard },
  { key: "schedule", to: "/maintenance/schedule", icon: CalendarClock },
  { key: "workOrders", to: "/maintenance/work-orders", icon: ClipboardList },
  { key: "breakdowns", to: "/maintenance/breakdowns", icon: AlertTriangle },
  { key: "history", to: "/maintenance/history", icon: History },
  { key: "spareParts", to: "/maintenance/spare-parts", icon: Package },
  { key: "cost", to: "/maintenance/cost", icon: Wallet },
  { key: "documents", to: "/maintenance/documents", icon: FileText },
  { key: "reminders", to: "/maintenance/reminders", icon: BellRing },
  { key: "facilities", to: "/maintenance/facilities", icon: Wrench },
  { key: "staff", to: "/maintenance/staff", icon: HardHat },
];

export const MaintenanceLayout: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Wrench size={26} className="text-primary" /> {t("maintenance.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("maintenance.subtitle")}</p>
      </div>

      <nav className="flex flex-wrap gap-2 border-b pb-3">
        {SUB_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <item.icon size={16} />
            {t(`maintenance.nav.${item.key}`)}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
};

export default MaintenanceLayout;
