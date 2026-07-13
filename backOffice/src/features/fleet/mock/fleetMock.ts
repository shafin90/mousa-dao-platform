import type { Bus } from "../../../shared/types";

export const mockFleet: Bus[] = [
  { _id: "B-202", busNumber: "NY-4522", name: "NY Bus 4522", type: "Standard", capacity: 45, status: "active", features: {}, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "B-305", busNumber: "MA-1290", name: "MA Bus 1290", type: "Sleeper", capacity: 40, status: "maintenance", features: {}, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "B-101", busNumber: "PA-8821", name: "PA Bus 8821", type: "Non-AC", capacity: 45, status: "active", features: {}, createdAt: "2026-01-01T00:00:00Z" },
];
