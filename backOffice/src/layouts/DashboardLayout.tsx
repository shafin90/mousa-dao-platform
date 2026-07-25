import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";;
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";;
import { cn } from "@/shared/utils/cn";;
import { TourGuideProvider } from "@/features/onboarding/context/TourGuideContext";
import { TourGuide } from "@/features/onboarding/components/TourGuide";

import { Toaster } from 'sonner';

export const DashboardLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <TourGuideProvider>
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
        <main className="p-4 sm:p-5 lg:p-6">
          <button 
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden mb-4 p-1.5 rounded-md hover:bg-secondary transition-colors duration-150"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
          </button>
          <div className="mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
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
          <div className="fixed inset-y-0 left-0 w-64 shadow-xl">
            <Sidebar collapsed={false} setCollapsed={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}
    </div>
      <TourGuide />
    </TourGuideProvider>
  );
};
