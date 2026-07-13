import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Menu, User, LogOut } from "lucide-react";
import { useAppSelector } from "@/app/store";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher";

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const { logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setShowDropdown(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const displayName = user
    ? `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.email
    : t("common.user");

  const roleLabel = user?.role
    ? t(`roles.${user.role}`, "User")
    : t("common.user");

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 backdrop-blur px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-secondary"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <Bell size={20} />
        </button>

        <div className="h-8 w-[1px] bg-border mx-1" />

        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-[10px] text-muted-foreground">{roleLabel}</span>
            </div>
            <div className="p-1.5 rounded-full bg-secondary group-hover:bg-primary/10 transition-colors">
              <User size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 top-full mt-2 w-48 bg-card border rounded-lg shadow-lg py-1 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <button
                onClick={() => { logout(); setShowDropdown(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={16} /> {t("common.signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
