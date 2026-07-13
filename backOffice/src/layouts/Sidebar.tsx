import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useAppSelector } from "@/app/store";
import { LayoutDashboard, Calendar, CreditCard, Map, Route, Users, BarChart3, Settings, History, Ticket, Bell, ChevronLeft, ChevronRight, Bus, LogOut, MapPin, Navigation, Building2, Wrench } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const NavKeys: Array<{ icon: React.ComponentType<{ className?: string; size?: number }>; key: string; href: string; roles: string[] }> = [
  { icon: LayoutDashboard, key: "dashboard", href: "/dashboard", roles: ["admin", "staff"] },
  { icon: Calendar, key: "bookings", href: "/bookings", roles: ["admin", "staff"] },
  { icon: CreditCard, key: "payments", href: "/payments", roles: ["admin"] },
  { icon: Map, key: "trips", href: "/trips", roles: ["admin", "staff"] },
  { icon: Navigation, key: "tracking", href: "/tracking", roles: ["admin", "staff"] },
  { icon: Route, key: "routes", href: "/routes", roles: ["admin"] },
  { icon: MapPin, key: "stations", href: "/stations", roles: ["admin"] },
  { icon: Building2, key: "cities", href: "/cities", roles: ["admin"] },
  { icon: Bus, key: "fleet", href: "/fleet", roles: ["admin"] },
  { icon: Wrench, key: "maintenanceFacilities", href: "/maintenance-facilities", roles: ["admin"] },
  { icon: Users, key: "users", href: "/users", roles: ["admin"] },
  { icon: BarChart3, key: "analytics", href: "/analytics", roles: ["admin"] },
  { icon: Ticket, key: "tickets", href: "/tickets", roles: ["admin", "staff"] },
  { icon: History, key: "auditLogs", href: "/audit-logs", roles: ["admin"] },
  { icon: Bell, key: "notifications", href: "/notifications", roles: ["admin", "staff"] },
  { icon: Settings, key: "configuration", href: "/config", roles: ["admin"] },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const { logout } = useAuth();

  const initials = user
    ? `${user.profile.firstName?.charAt(0) || ""}${user.profile.lastName?.charAt(0) || ""}`.toUpperCase() || user.email.charAt(0).toUpperCase()
    : "?";

  const displayName = user
    ? `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.email
    : t("common.user");

  const filteredNavItems = NavKeys.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 border-r bg-card flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b shrink-0">
        {!collapsed && (
          <span className="text-xl font-bold text-black">
            {t("app.name")}
          </span>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group",
              isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className={cn("shrink-0", collapsed ? "mx-auto" : "mr-3")} size={20} />
            {!collapsed && <span className="text-sm font-medium">{t(`nav.${item.key}`)}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t shrink-0">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "space-x-3")}>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{t(`roles.${user?.role}`, t("common.user"))}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title={t("common.logout")}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
