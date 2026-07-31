import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStations } from "../hooks/useStations";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Modal } from "@/shared/components/modals/Modal";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { StationData } from "@/api/stationApi";
import { cityApi, type CityData } from "@/api/cityApi";

const idOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id: unknown })._id);
  }
  return "";
};

const StationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { stations, loading, remove } = useStations();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<StationData | null>(null);
  const [cities, setCities] = useState<CityData[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterCountry, setFilterCountry] = useState("");

  useEffect(() => {
    cityApi.getAll().then((res) => setCities(res.data)).catch(() => setCities([]));
  }, []);

  const getUserDisplayName = (u: string | { _id: string; profile: { firstName: string; lastName: string } } | undefined): string => {
    if (!u) return "—";
    if (typeof u === "object" && u.profile) return `${u.profile.firstName} ${u.profile.lastName}`;
    return "—";
  };

  const columns = [
    { header: t("stations.city"), accessor: (item: StationData) => {
      const cityId = idOf(item.cityId);
      return cities.find((c) => c._id === cityId)?.name || "—";
    } },
    { header: t("stations.stationName"), accessor: (item: StationData) => item.name },
    { header: t("stations.country"), accessor: (item: StationData) => {
      if (item.cityId && typeof item.cityId === "object" && item.cityId.country) return item.cityId.country;
      const cityId = idOf(item.cityId);
      return cities.find((c) => c._id === cityId)?.country || "—";
    } },
    { header: t("stations.manager"), accessor: (item: StationData) => getUserDisplayName(item.manager1) },
    {
      header: t("stations.status"),
      accessor: (item: StationData) => (
        <Badge variant={item.isActive !== false ? "success" : "secondary"}>
          {item.isActive !== false ? t("stations.active") : t("stations.inactive")}
        </Badge>
      ),
    },
    { header: t("stations.createdAt"), accessor: (item: StationData) => item.createdAt ? new Date(item.createdAt).toLocaleString() : "—" },
    { header: t("stations.createdBy"), accessor: (item: StationData) => getUserDisplayName(item.createdBy) },
    {
      header: t("stations.actions"),
      accessor: (item: StationData) => (
        <div className="flex justify-end">
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0" title={t("common.edit")} onClick={(e) => {
                e.stopPropagation();
                navigate(`/stations/${item._id}/edit`);
              }}>
                <Pencil size={12} />
              </Button>
              <Button variant="destructive" size="sm" onClick={(e) => {
                e.stopPropagation();
                setStationToDelete(item);
                setIsDeleteOpen(true);
              }}>
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const filteredStations = stations.filter((s) => {
    if (filterStatus === "active" && s.isActive === false) return false;
    if (filterStatus === "inactive" && s.isActive !== false) return false;
    if (filterCountry) {
      const country = typeof s.cityId === "object" && s.cityId?.country
        ? s.cityId.country
        : cities.find((c) => c._id === idOf(s.cityId))?.country;
      if (country !== filterCountry) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchCity = typeof s.cityId === "object" && s.cityId?.name?.toLowerCase().includes(q);
      if (!matchName && !matchCity) return false;
    }
    return true;
  });

  const countries = [...new Set(stations.map((s) => {
    if (typeof s.cityId === "object" && s.cityId?.country) return s.cityId.country;
    const city = cities.find((c) => c._id === idOf(s.cityId));
    return city?.country;
  }).filter(Boolean))].sort();

  const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ] as const;

  const hasFilters = search || filterCountry || filterStatus !== "active";

  const clearSearch = () => {
    setSearch("");
    clearTimeout(debounceRef.current);
  };

  const clearAllFilters = () => {
    setSearch("");
    setFilterCountry("");
    setFilterStatus("active");
    clearTimeout(debounceRef.current);
  };

  return (
    <div>
      <div data-tour="stations-table">
        <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 bg-muted/30 px-2.5 py-1.5">
          <div className="relative flex-1 min-w-[160px] max-w-[260px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search stations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-7 pl-8 pr-7 rounded border bg-background/80 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-7 rounded border bg-background/80 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="h-7 rounded border bg-background/80 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="w-px h-5 bg-border" />
            {isAdmin && (
              <Button
                onClick={() => navigate("/stations/new")}
                disabled={cities.length === 0}
                size="sm"
                className="h-7 px-2 text-xs"
              >
                <Plus size={13} />
                Add
              </Button>
            )}
            {hasFilters && (
              <button
                onClick={clearAllFilters}
                className="h-7 px-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>
        </div>
        <DataTable className="rounded-t-none border-t-0" columns={columns} data={filteredStations} isLoading={loading} onRowClick={(item) => navigate(`/stations/${item._id}`)} /></div>

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setStationToDelete(null); }} title={t("stations.deleteStation")}>
        {stationToDelete && (
          <div className="space-y-4">
            <p>{t("stations.confirmDelete", { name: stationToDelete.name })}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setStationToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={() => { remove(stationToDelete._id); toast.success(t("stations.deleted")); setIsDeleteOpen(false); setStationToDelete(null); }}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default StationsPage;
