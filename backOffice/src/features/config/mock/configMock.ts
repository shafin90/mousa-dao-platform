import type { SystemConfig } from "../../../shared/types";
export const mockConfig: SystemConfig = {
  _id: "cfg1",
  baseCurrency: "XOF",
  timezone: "America/New_York",
  platformCommissionPercentage: 5,
  driverCommissionPercentage: 80,
  taxPercentage: 8,
  maintenanceMode: false,
  featureFlags: { enableBooking: true, enablePayments: true, enableTicketing: true },
  pricingRules: { defaultBaseFareMultiplier: 1.0, vipMultiplier: 1.5 },
};
