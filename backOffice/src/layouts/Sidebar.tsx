import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useAppSelector } from "@/app/store";
import {
  GraduationCap, LayoutDashboard, Calendar, Map, MapPin as MapPinIcon, Route, Users, UserCog,
  ChevronLeft, ChevronRight, ChevronDown, Bus, LogOut, Building2,
  Settings, TicketCheck, BarChart3, ShieldCheck, PhoneCall
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

type IconType = React.ComponentType<{ className?: string; size?: number }>;

interface NavChild {
  key: string;
  href: string;
  icon: IconType;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

interface NavItem {
  icon: IconType;
  key: string;
  href?: string;
  roles: string[];
  children?: NavChild[];
}

const NavKeys: NavGroup[] = [
  {
    section: "operations",
    items: [
      { icon: LayoutDashboard, key: "dashboard", href: "/dashboard", roles: ["admin", "staff", "manager"] },
      { icon: Calendar, key: "bookings", href: "/bookings", roles: ["admin", "staff", "manager"] },
      { icon: TicketCheck, key: "tickets", href: "/tickets", roles: ["admin", "staff", "manager"] },
      { icon: Map, key: "trips", href: "/trips", roles: ["admin", "staff", "manager"] },
      // { icon: Radio, key: "tracking", href: "/tracking", roles: ["admin", "staff", "manager"] },
    ],
  },
  {
    section: "fleet",
    items: [
      { icon: Bus, key: "fleet", href: "/fleet", roles: ["admin", "manager"] },
      // {
      //   icon: Wrench,
      //   key: "maintenance",
      //   roles: ["admin", "manager"],
      //   children: [
      //     { key: "maintenanceDashboard", href: "/maintenance/dashboard", icon: Gauge },
      //     { key: "maintenanceSchedule", href: "/maintenance/schedule", icon: ClipboardCheck },
      //     { key: "maintenanceWorkOrders", href: "/maintenance/work-orders", icon: ClipboardSignature },
      //     { key: "maintenanceRecords", href: "/maintenance/records", icon: ClipboardList },
      //     { key: "maintenanceStaff", href: "/maintenance/staff", icon: UsersRound },
      //     { key: "maintenanceFacilities", href: "/maintenance/facilities", icon: Factory },
      //   ],
      // },
    ],
  },
  {
    section: "network",
    items: [
      { icon: Route, key: "routes", href: "/routes", roles: ["admin", "manager"] },
      { icon: MapPinIcon, key: "stations", href: "/stations", roles: ["admin", "manager"] },
      { icon: Building2, key: "cities", href: "/cities", roles: ["admin", "manager"] },
    ],
  },
  {
    section: "people",
    items: [
      { icon: Users, key: "passengers", href: "/passengers", roles: ["admin", "manager"] },
      { icon: UserCog, key: "employees", href: "/employees", roles: ["admin"] },
    ],
  },
  {
    section: "insights",
    items: [
      { icon: BarChart3, key: "analytics", href: "/dashboard", roles: ["admin", "manager"] },
      { icon: ShieldCheck, key: "activityLog", href: "/activity-log", roles: ["admin"] },
    ],
  },
  {
    section: "support",
    items: [
      { icon: PhoneCall, key: "support", href: "/support", roles: ["admin", "staff", "manager"] },
      { icon: Settings, key: "configuration", href: "/settings", roles: ["admin"] },
      { icon: GraduationCap, key: "tutorial", href: "/tutorial", roles: ["admin", "staff", "manager"] },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const { logout } = useAuth();
  const [submenuOpen, setSubmenuOpen] = React.useState<Record<string, boolean>>({});

  const initials = user
    ? `${user.profile.firstName?.charAt(0) || ""}${user.profile.lastName?.charAt(0) || ""}`.toUpperCase() || user.email.charAt(0).toUpperCase()
    : "?";

  const displayName = user
    ? `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.email
    : t("common.user");

  const filteredGroups = NavKeys
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => !user || item.roles.includes(user.role)),
    }))
    .filter((g) => g.items.length > 0);

  const linkClasses = (isActive: boolean) =>
    cn(
      "flex items-center px-3 py-2 rounded-md transition-all duration-150 group relative",
      isActive
        ? "text-white font-medium bg-white/10 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-white"
        : "text-white/60 hover:text-white hover:bg-white/[0.06]"
    );

  return (
    <aside
      data-tour="sidebar"
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-[#0f1117] flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 shrink-0 border-b border-white/[0.06]">
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight text-white/90">
            {t("app.name")}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-all duration-150"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {filteredGroups.map((group) => (
          <div key={group.section} className="pb-1">
            {!collapsed && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                {t(`sections.${group.section}`, group.section)}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                if (item.children) {
                  const open = submenuOpen[item.key] ?? false;
                  return (
                    <div key={item.key}>
                      <button
                        onClick={() => {
                          if (collapsed) {
                            setCollapsed(false);
                          }
                          setSubmenuOpen((prev) => ({ ...prev, [item.key]: !open }));
                        }}
                        className={cn(
                          "w-full flex items-center px-3 py-2 rounded-md transition-all duration-150 group",
                          "text-white/60 hover:text-white hover:bg-white/[0.06]"
                        )}
                      >
                        <item.icon className={cn("shrink-0", collapsed ? "mx-auto" : "mr-3")} size={18} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left text-sm font-medium">{t(`nav.${item.key}`)}</span>
                            <ChevronDown
                              size={14}
                              className={cn("transition-transform", open ? "rotate-180" : "rotate-0")}
                            />
                          </>
                        )}
                      </button>
                      {!collapsed && open && (
                        <div className="mt-1 ml-4 space-y-0.5 border-l border-white/10 pl-3">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.href}
                              to={child.href}
                              className={({ isActive }) => linkClasses(isActive)}
                            >
                              <child.icon className="mr-3 shrink-0" size={16} />
                              <span className="text-sm font-medium">{t(`nav.${child.key}`)}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.href}
                    to={item.href as string}
                    data-tour={`nav-${item.key}`}
                    className={({ isActive }) => linkClasses(isActive)}
                  >
                    <item.icon className={cn("shrink-0", collapsed ? "mx-auto" : "mr-3")} size={18} />
                    {!collapsed && <span className="text-sm font-medium">{t(`nav.${item.key}`)}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.06] shrink-0">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 font-semibold text-xs">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">{displayName}</p>
              <p className="text-[11px] text-white/40 truncate capitalize">{t(`roles.${user?.role}`, t("common.user"))}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-white/10 transition-all duration-150"
              title={t("common.logout")}
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
