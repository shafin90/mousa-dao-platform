export interface MaintenanceOption {
  /** English string stored as the actual value (description / performedBy). */
  value: string;
  /** i18n key slug used for the translated label, with `value` as defaultValue fallback. */
  key: string;
}

export const DEFAULT_MAINTENANCE_SERVICES: MaintenanceOption[] = [
  { value: "Oil Change", key: "oilChange" },
  { value: "Brake Service", key: "brakeService" },
  { value: "Tire Replacement", key: "tireReplacement" },
  { value: "Engine Repair", key: "engineRepair" },
  { value: "Electrical", key: "electrical" },
  { value: "AC Service", key: "acService" },
  { value: "General Inspection", key: "generalInspection" },
  { value: "Battery Replacement", key: "batteryReplacement" },
  { value: "Suspension", key: "suspension" },
  { value: "Bodywork", key: "bodywork" },
];

export const MAINTENANCE_PERFORMERS: MaintenanceOption[] = [
  { value: "In-house Mechanic", key: "inHouseMechanic" },
  { value: "Facility Technician", key: "facilityTechnician" },
  { value: "External Vendor", key: "externalVendor" },
  { value: "Manufacturer Service", key: "manufacturerService" },
];
