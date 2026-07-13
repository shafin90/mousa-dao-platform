import React, { useState } from "react";
import { Outlet } from "react-router-dom";;
import { Sidebar } from "./Sidebar";;
import { Topbar } from "./Topbar";;
import { cn } from "@/shared/utils/cn";;

import { Toaster } from 'sonner';

export const DashboardLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      </div>

      {/* Main Content Area */}
      <div 
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />
        
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar (Simplified for now) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-card border-r shadow-xl">
            <Sidebar collapsed={false} setCollapsed={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
