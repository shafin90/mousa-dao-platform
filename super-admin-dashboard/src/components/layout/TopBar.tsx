import { useAppStore } from '../../stores/useAppStore';

export default function TopBar() {
  const { toggleSidebar, globalSearch, setGlobalSearch } = useAppStore();

  return (
    <header className="h-14 bg-white border-b border-card-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-text-secondary hover:text-text-primary p-1 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <input
          type="text"
          placeholder="Search companies, bookings..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="w-72 px-3 py-1.5 text-sm border border-card-border rounded-lg bg-gray-50 
                     placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                     transition-colors"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative text-text-secondary hover:text-text-primary p-1.5 rounded transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-card-border">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold">
            SA
          </div>
          <span className="text-sm font-medium text-text-primary hidden sm:block">Super Admin</span>
        </div>
      </div>
    </header>
  );
}
