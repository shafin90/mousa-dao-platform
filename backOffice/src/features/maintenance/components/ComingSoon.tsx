import React from "react";
import { useTranslation } from "react-i18next";
import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/Card";

interface ComingSoonProps {
  titleKey?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ titleKey }) => {
  const { t } = useTranslation();
  const title = titleKey ? t(titleKey) : t("maintenance.comingSoon.title");

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Wrench size={26} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{t("maintenance.comingSoon.message")}</p>
      </CardContent>
    </Card>
  );
};

export default ComingSoon;
