import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { Plus, Route, Bus, UserPlus } from "lucide-react";

export const QuickActions: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actions = [
    { label: t("dashboard.scheduleTrip"), icon: Plus, path: "/trips" },
    { label: t("dashboard.newRoute"), icon: Route, path: "/routes" },
    { label: t("dashboard.addBus"), icon: Bus, path: "/fleet" },
    { label: t("dashboard.createUser"), icon: UserPlus, path: "/users" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((a) => (
        <Button
          key={a.label}
          variant="outline"
          size="sm"
          className="justify-start gap-2 h-auto py-3"
          onClick={() => navigate(a.path)}
        >
          <a.icon size={16} />
          {a.label}
        </Button>
      ))}
    </div>
  );
};
