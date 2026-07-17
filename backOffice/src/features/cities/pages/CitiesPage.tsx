import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Building2, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/components/tables/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/modals/Modal";
import { cityApi, type CityData } from "@/api/cityApi";

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

const emptyForm = { country: "", cityName: "" };

const CitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CityData | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CityData | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [filterCountry, setFilterCountry] = useState("");
  const [search, setSearch] = useState("");

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

  useEffect(() => {
    load(filterCountry, search);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => load(filterCountry, search);

  const handleFilterCountry = (value: string) => {
    setFilterCountry(value);
    load(value, search);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    load(filterCountry, value);
  };

  const availableCities = useMemo(() => {
    if (!form.country) return [];
    return (CITIES_BY_COUNTRY[form.country] || []).filter(
      (city) => editing?.name === city || !cities.some((c) => c.name === city && c.country === form.country)
    );
  }, [form.country, cities, editing?.name]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (row: CityData) => {
    setEditing(row);
    setForm({ country: row.country, cityName: row.name });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityName || !form.country) {
      toast.error(t("cities.validationRequired"));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await cityApi.update(editing._id, { name: form.cityName, country: form.country });
        toast.success(t("cities.updated"));
      } else {
        await cityApi.create({ name: form.cityName, country: form.country });
        toast.success(t("cities.created"));
      }
      setIsModalOpen(false);
      setForm({ ...emptyForm });
      await refresh();
    } catch {
      toast.error(t("cities.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

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
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus size={16} /> {t("cities.newCity")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("cities.searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
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

      <DataTable columns={columns} data={cities} isLoading={loading} />

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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? t("cities.editCity") : t("cities.createCity")}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cities.countryRequired")}</label>
            <select
              required
              value={form.country}
              onChange={(e) => setForm({ country: e.target.value, cityName: "" })}
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
            <select
              required
              value={form.cityName}
              onChange={(e) => setForm({ ...form, cityName: e.target.value })}
              className="w-full rounded-md border bg-muted/30 p-2"
              disabled={!form.country}
            >
              <option value="">{t("cities.selectCity")}</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("cities.saveCity")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CitiesPage;
