import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handler = () => setShowDropdown(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <header data-tour="topbar" className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur px-4 sm:px-5">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md hover:bg-secondary transition-colors duration-150"
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors duration-150"
          >
            <User size={17} className="text-muted-foreground" />
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 top-full mt-1.5 w-36 bg-card border rounded-lg shadow-lg py-1 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { logout(); setShowDropdown(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-150"
              >
                <LogOut size={15} /> {t("common.signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
