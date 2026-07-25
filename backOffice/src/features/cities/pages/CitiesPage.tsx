import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Search, X, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { useErrorModal } from "@/shared/contexts/ErrorContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { toast } from "sonner";
import { cityApi, type CityData, type CityFilters, type PaginationInfo } from "@/api/cityApi";

const COUNTRIES = [
  "C\u00f4te d'Ivoire", "Benin", "Burkina Faso", "Mali", "Togo",
  "Nigeria", "Ghana", "Guinee Conakry", "Senegal", "Niger",
] as const;

const CitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showError } = useErrorModal();
  const { isAdmin } = useAuth();
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, limit: 15, pages: 1 });
  const [filterCountry, setFilterCountry] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const filtersRef = useRef({ country: filterCountry, q: search, status: filterStatus });

  filtersRef.current = { country: filterCountry, q: search, status: filterStatus };

  const load = useCallback(async (country?: string, q?: string, status?: string, page = 1) => {
    setLoading(true);
    try {
      const params: CityFilters = { page, limit: 15 };
      if (country) params.country = country;
      if (q) params.search = q;
      if (status) params.isActive = status;
      const result = await cityApi.getAll(params);
      setCities(result.data);
      const p = result.pagination;
      setPagination(p && typeof p.total === "number" ? p : { total: result.data.length, page, limit: 15, pages: Math.ceil(result.data.length / 15) || 1 });
    } catch {
      showError(t("cities.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load(filterCountry, search, filterStatus);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = filterCountry || search || filterStatus;

  const handleFilterCountry = (value: string) => {
    setFilterCountry(value);
    setSearch("");
    load(value, "", filterStatus);
  };

  const handleFilterStatus = (value: string) => {
    setFilterStatus(value);
    load(filterCountry, search, value);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { country, status } = filtersRef.current;
      load(country, value, status);
    }, 350);
  };

  const clearSearch = () => {
    setSearch("");
    load(filterCountry, "", filterStatus);
  };

  const clearAllFilters = () => {
    setFilterCountry("");
    setFilterStatus("");
    setSearch("");
    load("", "", "");
  };

  const handlePageChange = (page: number) => {
    load(filterCountry, search, filterStatus, page);
  };

  const toggleStatus = async (city: CityData) => {
    try {
      const updated = await cityApi.update(city._id, { isActive: !city.isActive });
      setCities((prev) => prev.map((c) => (c._id === city._id ? { ...c, isActive: updated.isActive } : c)));
      toast.success(t("cities.updated"));
    } catch {
      toast.error(t("cities.saveFailed"));
    }
  };

  const renderManager = (m: CityData["manager1"]) => {
    if (!m) return "\u2014";
    if (typeof m === "object" && m.profile)
      return `${m.profile.firstName} ${m.profile.lastName}`;
    return "\u2014";
  };

  const columns = [
    { header: t("cities.cityName"), accessor: (row: CityData) => <span className="font-medium">{row.name}</span> },
    { header: t("cities.country"), accessor: (row: CityData) => row.country },
    { header: t("cities.manager"), accessor: (row: CityData) => renderManager(row.manager1) },
    ...(isAdmin
      ? [
          {
            header: t("common.status"),
            accessor: (row: CityData) => (
              <Badge variant={row.isActive !== false ? "success" : "destructive"}>
                {row.isActive !== false ? t("common.active") : t("common.inactive")}
              </Badge>
            ),
          },
          {
            header: t("common.actions"),
            accessor: (row: CityData) => (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleStatus(row); }}
                  title={row.isActive !== false ? t("common.disable") : t("common.enable")}
                >
                  {row.isActive !== false ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div data-tour="cities-table">
        <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 bg-muted/30 px-2.5 py-1.5">
          <div className="relative flex-1 min-w-[160px] max-w-[260px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              data-tour="cities-search"
              type="text"
              placeholder={t("cities.searchPlaceholder")}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
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
              data-tour="cities-filter-country"
              value={filterCountry}
              onChange={(e) => handleFilterCountry(e.target.value)}
              className="h-7 rounded border bg-background/80 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t("cities.allCountries")}</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {isAdmin && (
              <select
                value={filterStatus}
                onChange={(e) => handleFilterStatus(e.target.value)}
                className="h-7 rounded border bg-background/80 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t("common.all")}</option>
                <option value="true">{t("common.active")}</option>
                <option value="false">{t("common.inactive")}</option>
              </select>
            )}
            {isAdmin && (
              <>
                <div className="w-px h-5 bg-border" />
                <Button
                  onClick={() => navigate("/cities/new")}
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  <Plus size={13} />
                  {t("cities.addCity")}
                </Button>
              </>
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
        <DataTable
          className="rounded-t-none border-t-0"
          columns={columns}
          data={cities}
          isLoading={loading}
          onRowClick={(row) => navigate(`/cities/${row._id}`)}
          totalRows={pagination?.total ?? 0}
          totalPages={Math.max(1, pagination?.pages ?? 1)}
          currentPage={Math.max(1, pagination?.page ?? 1)}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default CitiesPage;