import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Building2, Trash2, Search, X, Globe } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/modals/Modal";
import { Select } from "@/shared/components/ui/Select";
import { cityApi, type CityData } from "@/api/cityApi";
import { userApi } from "@/api/userApi";

const COUNTRIES = [
  "Côte d'Ivoire", "Benin", "Burkina Faso", "Mali", "Togo",
  "Nigeria", "Ghana", "Guinee Conakry", "Senegal", "Niger",
] as const;

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "Côte d'Ivoire": [
    "ABENGOUROU", "ABOBO", "ABOISSO", "ADIAKE", "ADJAME", "ADZOPE", "AFFERY",
    "AGBOVILLE", "AGNIBILEKRO", "AGOU", "AKOUPE", "ALEPE", "ANOUMABA", "ANYAMA",
    "ARRAH", "ASSINIE-MAFIA", "ASSUEFRY", "ATTECOUBE", "ATTIEGOUAKRO", "AYAME",
    "AZAGUIE", "BAKO", "BANGOLO", "BASSAWA", "BEDIALA", "BEOUMI", "BETTIE",
    "BIANKOUMA", "BINGERVILLE", "BINHOUYE", "BLOLEQUIN", "BOCANDA", "BODOKRO",
    "BONDOUKOU", "BONGOUANOU", "BONIEREDOUGOU", "BONON", "BONOUA", "BOOKO",
    "BOROTOU", "BOTRO", "BOUAFLE", "BOUAKE", "BOUNA", "BOUNDIALI", "BROBO",
    "BUYO", "COCODY", "DABAKALA", "DABOU", "DALOA", "DANANE", "DAOUKRO",
    "DIABO", "DIANRA", "DIAWALA", "DIDIEVI", "DIEGONEFLA", "DIKODOUGOU",
    "DIMBOKRO", "DIOULATIEDOUGOU", "DIVO", "DJEBONOUA", "DJEKANOU",
    "DJIBROSSO", "DOROPO", "DUALLA", "DUEKOUE", "ETTROKRO", "FACOBLY",
    "FERKESSEDOUGOU", "FOUMBOLO", "FRESCO", "FRONAN", "GAGNOA", "GBELEBAN",
    "GBOGUHE", "GBON", "GBONNE", "GOHITAFLA", "GOULIA", "GRABO", "GRAND LAHOU",
    "GRAND ZATTRY", "GRAND-BASSAM", "GRAND-BEREBY", "GUEYO", "GUIBEROUA",
    "GUIEMBE", "GUIGLO", "GUINTEGUELA", "GUITRY", "HIRE", "ISSIA", "JACQUEVILLE",
    "KANAKONO", "KANI", "KANIASSO", "KARAKORO", "KASSERE", "KATIOLA",
    "KOKOUMBO", "KOLIA", "KOMBORODOUGOU", "KONG", "KONGASSO", "KOONAN",
    "KORHOGO", "KORO", "KOUASSI DATTEKRO", "KOUASSI KOUASSIKRO", "KOUIBLY",
    "KOUMASSI", "KOUMBALA", "KOUN FAO", "KOUNAHIRI", "KOUTO", "LAKOTA",
    "LOGOUALE", "M'BAHIAKRO", "M'BATTO", "M'BENGUE", "MADINANI", "MAFERE",
    "MAN", "MANKONO", "MARCORY", "MASSALA", "MAYO", "MEAGUI", "MINIGNAN",
    "MORONDO", "N'DOUCI", "NAPIE", "NASSIAN", "NIABLE", "NIAKARAMADOUGOU",
    "NIELLE", "NIOFOIN", "ODIENNE", "OUANGOLODOUGOU", "OUANINOU", "OUELLE",
    "OUME", "OURAGAHIO", "PLATEAU", "PORT BOUET", "PRIKRO", "RUBINO",
    "SAIOUA", "SAKASSOU", "SAMATIGUILA", "SAN-PEDRO", "SANDEGUE", "SANGOUINE",
    "SARHALA", "SASSANDRA", "SATAMA SOKORO", "SATAMA SOKOURA", "SEGUELA",
    "SEGUELON", "SEYDOUGOU", "SIFIE", "SIKENSI", "SINEMATIALI", "SINFRA",
    "SIPILOU", "SIRASSO", "SONGON", "SOUBRE", "TAABO", "TABOU", "TAFIRE",
    "TAI", "TANDA", "TEHINI", "TENGRELA", "TIAPOUM", "TIASSALE",
    "TIE N'DIEKRO", "TIEBISSOU", "TIEME", "TIEMELEKRO", "TIENINGBOUE",
    "TIENKO", "TIORONIARADOUGOU", "TORTIYA", "TOUBA", "TOULEPLEU", "TOUMODI",
    "TRANSUA", "TREICHVILLE", "VAVOUA", "WOROFLA", "YAKASSE ATTOBROU",
    "YAMOUSSOUKRO", "YOPOUGON", "ZIKISSO", "ZOUAN HOUNIEN", "ZOUKOUGBEU",
    "ZUENOULA",
  ],
  "Benin": ["Cotonou", "Porto-Novo", "Parakou", "Abomey", "Ouidah", "Natitingou"],
  "Burkina Faso": ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", "Kaya", "Fada N'Gourma"],
  "Mali": ["Bamako", "Sikasso", "Segou", "Koutiala", "Kayes", "Mopti"],
  "Togo": ["Lome", "Kara", "Dapaong", "Sokode", "Atakpame", "Kpalime", "Tsevie", "Anie", "Cinkasse", "Notse", "Tabligbo", "Tchamba"],
  "Nigeria": ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City"],
  "Ghana": ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast", "Noe"],
  "Guinee Conakry": ["Conakry", "Kankan", "Nzerekore", "Kindia", "Labe", "Boke", "Mamou", "Faranah"],
  "Senegal": ["Dakar", "Touba", "Thies", "Saint-Louis", "Ziguinchor", "M'bour"],
  "Niger": ["Niamey", "Maradi", "Zinder", "Tahoua", "Agadez", "Arlit", "Birni"],
};

interface CustomCityForm {
  name: string;
  country: string;
  address1: string;
  address2: string;
  phone1: string;
  phone2: string;
  email1: string;
  email2: string;
  lat: string;
  lng: string;
  manager1: string;
  manager2: string;
  isActive: boolean;
}

const emptyCustomForm: CustomCityForm = {
  name: "", country: "",
  address1: "", address2: "", phone1: "", phone2: "", email1: "", email2: "",
  lat: "", lng: "", manager1: "", manager2: "", isActive: true,
};

const CitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CityData | null>(null);
  const [customForm, setCustomForm] = useState<CustomCityForm>({ ...emptyCustomForm });
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [filterCountry, setFilterCountry] = useState("");
  const [search, setSearch] = useState("");
  const [managerOptions, setManagerOptions] = useState<{ value: string; label: string }[]>([]);

  const customMapRef = useRef<HTMLDivElement>(null);
  const customMapInstanceRef = useRef<L.Map | null>(null);
  const customMarkerRef = useRef<L.Marker | null>(null);

  const load = useCallback(async (country?: string, q?: string) => {
    setLoading(true);
    try {
      const params: { country?: string; search?: string } = {};
      if (country) params.country = country;
      if (q) params.search = q;
      const data = await cityApi.getAll(params);
      setCities(data);
    } catch {
      toast.error(t("cities.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(filterCountry, search); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      try {
        const result = await userApi.getAll({ limit: 1000 });
        const filtered = result.users.filter((u) => u.role !== "customer");
        setManagerOptions(filtered.map((u) => ({
          value: u._id,
          label: `${u.profile.firstName} ${u.profile.lastName}`,
        })));
      } catch { /* ignore */ }
    })();
  }, []);

  const refresh = () => load(filterCountry, search);

  const handleFilterCountry = (value: string) => {
    setFilterCountry(value);
    load(value, search);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    load(filterCountry, value);
  };

  const initCustomMap = () => {
    if (!customMapRef.current) return;
    if (customMapInstanceRef.current) {
      customMapInstanceRef.current.remove();
      customMapInstanceRef.current = null;
    }
    const lat = customForm.lat ? parseFloat(customForm.lat) : 6.8501;
    const lng = customForm.lng ? parseFloat(customForm.lng) : -5.2986;
    const map = L.map(customMapRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([lat, lng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap", maxZoom: 18,
    }).addTo(map);
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    const updatePosition = (pos: L.LatLng) => {
      marker.setLatLng(pos);
      setCustomForm((prev) => ({
        ...prev,
        lat: pos.lat.toFixed(6),
        lng: pos.lng.toFixed(6),
      }));
    };

    marker.on("dragend", () => updatePosition(marker.getLatLng()));
    map.on("click", (e: L.LeafletMouseEvent) => updatePosition(e.latlng));

    customMarkerRef.current = marker;
    customMapInstanceRef.current = map;
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.name || !customForm.country) {
      toast.error(t("cities.validationRequired"));
      return;
    }
    setSaving(true);
    try {
      await cityApi.create({
        name: customForm.name,
        country: customForm.country,
        address1: customForm.address1 || undefined,
        address2: customForm.address2 || undefined,
        phone1: customForm.phone1 || undefined,
        phone2: customForm.phone2 || undefined,
        email1: customForm.email1 || undefined,
        email2: customForm.email2 || undefined,
        location: (customForm.lat && customForm.lng)
          ? { lat: parseFloat(customForm.lat), lng: parseFloat(customForm.lng) }
          : undefined,
        manager1: customForm.manager1 || undefined,
        manager2: customForm.manager2 || undefined,
        isActive: customForm.isActive,
      });
      toast.success(t("cities.created"));
      setIsCustomModalOpen(false);
      setCustomForm({ ...emptyCustomForm });
      if (customMapInstanceRef.current) {
        customMapInstanceRef.current.remove();
        customMapInstanceRef.current = null;
      }
      await refresh();
    } catch {
      toast.error(t("cities.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (isCustomModalOpen) {
      setTimeout(initCustomMap, 100);
    }
    return () => {
      if (customMapInstanceRef.current) {
        customMapInstanceRef.current.remove();
        customMapInstanceRef.current = null;
      }
    };
  }, [isCustomModalOpen]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await cityApi.delete(toDelete._id);
      toast.success(t("cities.deleted"));
      setIsDeleteOpen(false);
      setToDelete(null);
      await refresh();
    } catch {
      toast.error(t("cities.deleteFailed"));
    }
  };

  const columns = [
    { header: t("cities.cityName"), accessor: (row: CityData) => <span className="font-medium">{row.name}</span> },
    { header: t("cities.country"), accessor: (row: CityData) => row.country },
    {
      header: t("cities.actions"),
      className: "text-right",
      accessor: (row: CityData) => (
        <div className="flex justify-end gap-1">
          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setToDelete(row); setIsDeleteOpen(true); }}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Building2 size={26} className="text-primary" /> {t("cities.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("cities.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button data-tour="cities-refresh" variant="outline" size="sm" className="gap-2" onClick={refresh}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
          <Button data-tour="cities-add-custom" size="sm" variant="outline" className="gap-2" onClick={() => { setCustomForm({ ...emptyCustomForm }); setIsCustomModalOpen(true); }}>
            <Globe size={16} /> {t("cities.createCity")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            data-tour="cities-search"
            type="text"
            placeholder={t("cities.searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          data-tour="cities-filter-country"
          value={filterCountry}
          onChange={(e) => handleFilterCountry(e.target.value)}
          className="h-10 min-w-[180px] rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{t("cities.allCountries")}</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(filterCountry || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterCountry(""); setSearch(""); load(); }}>
            <X size={14} className="mr-1" /> {t("common.clear")}
          </Button>
        )}
      </div>

      <div data-tour="cities-table"><DataTable columns={columns} data={cities} isLoading={loading} onRowClick={(row) => navigate(`/cities/${row._id}`)} /></div>

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setToDelete(null); }} title={t("cities.deleteCity")}>
        {toDelete && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("cities.confirmDelete", { name: toDelete.name })}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setToDelete(null); }}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={handleDelete}>{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isCustomModalOpen} onClose={() => { setIsCustomModalOpen(false); if (customMapInstanceRef.current) { customMapInstanceRef.current.remove(); customMapInstanceRef.current = null; } }} title={t("cities.createCityCustom")}>
        <form className="max-h-[70vh] space-y-4 overflow-y-auto pr-1" onSubmit={handleCustomSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.countryRequired")}</label>
            <select
              required value={customForm.country}
              onChange={(e) => setCustomForm({ ...customForm, country: e.target.value })}
              className="w-full rounded-md border bg-muted/30 p-2"
            >
              <option value="">{t("cities.selectCountry")}</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.cityNameRequired")}</label>
            <input
              required type="text" value={customForm.name}
              onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
              placeholder={t("cities.cityNamePlaceholder")}
              className="w-full rounded-md border bg-muted/30 p-2"
            />
          </div>

          <hr className="border-muted" />
          <h4 className="text-sm font-semibold text-muted-foreground">{t("cities.addressInfo")}</h4>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.address1")}</label>
            <input type="text" value={customForm.address1} onChange={(e) => setCustomForm({ ...customForm, address1: e.target.value })} className="w-full rounded-md border bg-muted/30 p-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.address2")}</label>
            <input type="text" value={customForm.address2} onChange={(e) => setCustomForm({ ...customForm, address2: e.target.value })} className="w-full rounded-md border bg-muted/30 p-2" />
          </div>

          <hr className="border-muted" />
          <h4 className="text-sm font-semibold text-muted-foreground">{t("cities.contactInfo")}</h4>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.phone1")}</label>
            <input type="tel" value={customForm.phone1} onChange={(e) => setCustomForm({ ...customForm, phone1: e.target.value })} placeholder={t("cities.phone1Placeholder")} className="w-full rounded-md border bg-muted/30 p-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.phone2")}</label>
            <input type="tel" value={customForm.phone2} onChange={(e) => setCustomForm({ ...customForm, phone2: e.target.value })} placeholder={t("cities.phone1Placeholder")} className="w-full rounded-md border bg-muted/30 p-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.email1")}</label>
            <input type="email" value={customForm.email1} onChange={(e) => setCustomForm({ ...customForm, email1: e.target.value })} placeholder={t("cities.email1Placeholder")} className="w-full rounded-md border bg-muted/30 p-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.email2")}</label>
            <input type="email" value={customForm.email2} onChange={(e) => setCustomForm({ ...customForm, email2: e.target.value })} placeholder={t("cities.email1Placeholder")} className="w-full rounded-md border bg-muted/30 p-2" />
          </div>

          <hr className="border-muted" />
          <h4 className="text-sm font-semibold text-muted-foreground">{t("cities.coordinates")}</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("cities.latitude")}</label>
              <input type="number" step="any" value={customForm.lat} onChange={(e) => setCustomForm({ ...customForm, lat: e.target.value })} placeholder="6.8501" className="w-full rounded-md border bg-muted/30 p-2" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("cities.longitude")}</label>
              <input type="number" step="any" value={customForm.lng} onChange={(e) => setCustomForm({ ...customForm, lng: e.target.value })} placeholder="-5.2986" className="w-full rounded-md border bg-muted/30 p-2" />
            </div>
          </div>
          <div ref={customMapRef} className="h-56 w-full rounded-lg border z-0" />

          <hr className="border-muted" />
          <h4 className="text-sm font-semibold text-muted-foreground">{t("cities.management")}</h4>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.manager1")}</label>
            <Select
              value={customForm.manager1}
              onChange={(e) => setCustomForm({ ...customForm, manager1: e.target.value })}
              options={managerOptions}
              placeholder={t("cities.selectManager")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.manager2")}</label>
            <Select
              value={customForm.manager2}
              onChange={(e) => setCustomForm({ ...customForm, manager2: e.target.value })}
              options={managerOptions}
              placeholder={t("cities.selectManager")}
            />
          </div>

          <hr className="border-muted" />
          <h4 className="text-sm font-semibold text-muted-foreground">{t("cities.statusSection")}</h4>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.status")}</label>
            <Select
              value={customForm.isActive ? "active" : "inactive"}
              onChange={(e) => setCustomForm({ ...customForm, isActive: e.target.value === "active" })}
              options={[
                { value: "active", label: t("common.active") },
                { value: "inactive", label: t("common.inactive") },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsCustomModalOpen(false); if (customMapInstanceRef.current) { customMapInstanceRef.current.remove(); customMapInstanceRef.current = null; } }}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("cities.saveCity")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CitiesPage;