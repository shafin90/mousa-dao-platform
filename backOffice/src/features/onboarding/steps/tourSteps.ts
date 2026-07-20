export interface TourStep {
  target?: string;
  titleKey: string;
  contentKey: string;
  placement?: "bottom" | "top" | "left" | "right";
  page?: string;
  beforeStep?: () => string | undefined;
}

export const tourSteps: TourStep[] = [
  // ── Trips Page ──────────────────────────────────────────
  { page: "/trips", titleKey: "tour.trips.welcome", contentKey: "tour.trips.welcomeDesc", placement: "bottom" },
  { target: "[data-tour='trips-header']", page: "/trips", titleKey: "tour.trips.welcome", contentKey: "tour.trips.welcomeDesc", placement: "bottom" },
  { target: "[data-tour='trips-add']", page: "/trips", titleKey: "tour.trips.add", contentKey: "tour.trips.addDesc", placement: "bottom" },
  { target: "[data-tour='trips-search']", page: "/trips", titleKey: "tour.trips.search", contentKey: "tour.trips.searchDesc", placement: "bottom" },
  { target: "[data-tour='trips-filter-bus']", page: "/trips", titleKey: "tour.trips.filterBus", contentKey: "tour.trips.filterBusDesc", placement: "bottom" },
  { target: "[data-tour='trips-filter-date']", page: "/trips", titleKey: "tour.trips.filterDate", contentKey: "tour.trips.filterDateDesc", placement: "bottom" },
  { target: "[data-tour='trips-filter-status']", page: "/trips", titleKey: "tour.trips.filterStatus", contentKey: "tour.trips.filterStatusDesc", placement: "bottom" },
  { target: "[data-tour='trips-filter-price']", page: "/trips", titleKey: "tour.trips.filterPrice", contentKey: "tour.trips.filterPriceDesc", placement: "bottom" },
  { target: "[data-tour='trips-table']", page: "/trips", titleKey: "tour.trips.table", contentKey: "tour.trips.tableDesc", placement: "top" },
  { target: "[data-tour='trips-refresh']", page: "/trips", titleKey: "tour.trips.refresh", contentKey: "tour.trips.refreshDesc", placement: "bottom" },

  // ── Routes Page ─────────────────────────────────────────
  { page: "/routes", titleKey: "tour.routes.welcome", contentKey: "tour.routes.welcomeDesc", placement: "bottom" },
  { target: "[data-tour='routes-add']", page: "/routes", titleKey: "tour.routes.add", contentKey: "tour.routes.addDesc", placement: "bottom" },
  { target: "[data-tour='routes-table']", page: "/routes", titleKey: "tour.routes.table", contentKey: "tour.routes.tableDesc", placement: "top" },
  { target: "[data-tour='routes-refresh']", page: "/routes", titleKey: "tour.routes.refresh", contentKey: "tour.routes.refreshDesc", placement: "bottom" },

  // ── Cities Page ─────────────────────────────────────────
  { page: "/cities", titleKey: "tour.cities.welcome", contentKey: "tour.cities.welcomeDesc", placement: "bottom" },
  { target: "[data-tour='cities-add']", page: "/cities", titleKey: "tour.cities.add", contentKey: "tour.cities.addDesc", placement: "bottom" },
  { target: "[data-tour='cities-add-custom']", page: "/cities", titleKey: "tour.cities.addCustom", contentKey: "tour.cities.addCustomDesc", placement: "bottom" },
  { target: "[data-tour='cities-search']", page: "/cities", titleKey: "tour.cities.search", contentKey: "tour.cities.searchDesc", placement: "bottom" },
  { target: "[data-tour='cities-filter-country']", page: "/cities", titleKey: "tour.cities.filterCountry", contentKey: "tour.cities.filterCountryDesc", placement: "bottom" },
  { target: "[data-tour='cities-table']", page: "/cities", titleKey: "tour.cities.table", contentKey: "tour.cities.tableDesc", placement: "top" },
  { target: "[data-tour='cities-refresh']", page: "/cities", titleKey: "tour.cities.refresh", contentKey: "tour.cities.refreshDesc", placement: "bottom" },

  // ── Stations Page ───────────────────────────────────────
  { page: "/stations", titleKey: "tour.stations.welcome", contentKey: "tour.stations.welcomeDesc", placement: "bottom" },
  { target: "[data-tour='stations-add']", page: "/stations", titleKey: "tour.stations.add", contentKey: "tour.stations.addDesc", placement: "bottom" },
  { target: "[data-tour='stations-table']", page: "/stations", titleKey: "tour.stations.table", contentKey: "tour.stations.tableDesc", placement: "top" },
  { target: "[data-tour='stations-refresh']", page: "/stations", titleKey: "tour.stations.refresh", contentKey: "tour.stations.refreshDesc", placement: "bottom" },

  // ── Complete ────────────────────────────────────────────
  { titleKey: "tour.complete.title", contentKey: "tour.complete.content", placement: "bottom" },
];
