import React from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/components/modals/Modal";
import { Badge } from "@/shared/components/ui/Badge";
import { MapPin, Globe, Home, Activity, Calendar, Phone, Mail, User as UserIcon, Building2 } from "lucide-react";
import type { StationData } from "@/api/stationApi";

interface Props {
  station: StationData | null;
  isOpen: boolean;
  onClose: () => void;
}

function getUserName(u: string | { _id: string; profile: { firstName: string; lastName: string } } | undefined): string {
  if (!u) return "—";
  if (typeof u === "string") return u;
  return `${u.profile.firstName} ${u.profile.lastName}`;
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-1.5 rounded-md bg-muted/50 text-muted-foreground">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export const StationDetailModal: React.FC<Props> = ({ station, isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!station) return null;

  const cityName = typeof station.cityId === "object" ? station.cityId?.name : "—";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={station.name} className="max-w-lg">
      <div className="space-y-5">
        <div>
          <Badge variant={station.isActive !== false ? "success" : "secondary"}>
            {station.isActive !== false ? t("stations.active") : t("stations.inactive")}
          </Badge>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("stations.detailTitle")}</h3>
          <DetailRow icon={MapPin} label={t("stations.name")} value={station.name} />
          <DetailRow icon={Building2} label={t("stations.city")} value={cityName} />
          <DetailRow icon={Globe} label={t("stations.coordinates")} value={`${station.location.lat.toFixed(4)}, ${station.location.lng.toFixed(4)}`} />
          <DetailRow icon={Home} label={t("stations.address1")} value={station.address1 || "—"} />
          <DetailRow icon={Home} label={t("stations.address2")} value={station.address2 || "—"} />
          {station.phone1 && <DetailRow icon={Phone} label={t("stations.phone1")} value={station.phone1} />}
          {station.email1 && <DetailRow icon={Mail} label={t("stations.email1")} value={station.email1} />}
          <DetailRow icon={UserIcon} label={t("stations.manager1")} value={getUserName(station.manager1)} />
          <DetailRow icon={UserIcon} label={t("stations.manager2")} value={getUserName(station.manager2)} />
          <DetailRow icon={Activity} label={t("stations.status")} value={station.isActive !== false ? t("stations.active") : t("stations.inactive")} />
          {station.createdAt && (
            <DetailRow icon={Calendar} label={t("stations.createdAt")} value={new Date(station.createdAt).toLocaleString()} />
          )}
        </div>
      </div>
    </Modal>
  );
};
