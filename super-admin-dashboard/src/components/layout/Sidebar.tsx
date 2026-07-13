import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '◻' },
  { to: '/tenants', label: 'Tenants', icon: '▦' },

  { to: '/analytics', label: 'Analytics', icon: '▤' },
  { to: '/bookings', label: 'Bookings', icon: '☰' },
  { to: '/payments', label: 'Payments', icon: '₿' },
  { to: '/system', label: 'System', icon: '⚙' },
];

export default function Sidebar() {
  const collapsed = useAppStore((s) => s.isSidebarCollapsed);

  return (
    <aside
      className={`bg-sidebar text-white flex flex-col transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center h-14 px-4 border-b border-white/10 shrink-0">
        <span className="text-lg font-bold tracking-tight">
          {collapsed ? 'SA' : 'SuperAdmin'}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <span className="text-lg w-5 text-center shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3 text-xs text-gray-500 shrink-0">
        {!collapsed && <span>v1.0.0 · SaaS Panel</span>}
      </div>
    </aside>
  );
}
