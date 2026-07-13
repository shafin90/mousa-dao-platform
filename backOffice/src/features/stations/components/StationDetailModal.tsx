import React from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/components/modals/Modal";
import { Badge } from "@/shared/components/ui/Badge";
import { MapPin, Globe, Home, Activity, Calendar } from "lucide-react";
import type { StationData } from "@/api/stationApi";

interface Props {
  station: StationData | null;
  isOpen: boolean;
  onClose: () => void;
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={station.name} className="max-w-lg">
      <div className="space-y-5">
        <div>
          <Badge variant={station.isActive !== false ? "success" : "secondary"}>
            {station.isActive !== false ? t("stations.active") : t("stations.inactive")}
          </Badge>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Location</h3>
          <DetailRow icon={MapPin} label={t("stations.name")} value={station.name} />
          <DetailRow icon={Globe} label={t("stations.coordinates")} value={`${station.location.lat.toFixed(4)}, ${station.location.lng.toFixed(4)}`} />
          <DetailRow icon={Home} label={t("stations.address")} value={station.address || "—"} />
          <DetailRow icon={Activity} label="Status" value={station.isActive !== false ? t("stations.active") : t("stations.inactive")} />
          {station.createdAt && (
            <DetailRow icon={Calendar} label="Created At" value={new Date(station.createdAt).toLocaleString()} />
          )}
        </div>
      </div>
    </Modal>
  );
};
