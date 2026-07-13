import type { Route } from "../../../shared/types";
export const mockRoutes: Route[] = [
  { _id: "R001", fromStation: { _id: "s1", name: "New York" }, toStation: { _id: "s2", name: "Boston" }, baseFare: 45, distanceKm: 215, estimatedTimeMinutes: 255, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "R002", fromStation: { _id: "s3", name: "Los Angeles" }, toStation: { _id: "s4", name: "San Francisco" }, baseFare: 65, distanceKm: 383, estimatedTimeMinutes: 390, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "R003", fromStation: { _id: "s5", name: "Chicago" }, toStation: { _id: "s6", name: "Detroit" }, baseFare: 50, distanceKm: 283, estimatedTimeMinutes: 285, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "R004", fromStation: { _id: "s7", name: "Houston" }, toStation: { _id: "s8", name: "Dallas" }, baseFare: 40, distanceKm: 239, estimatedTimeMinutes: 225, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "R005", fromStation: { _id: "s9", name: "Seattle" }, toStation: { _id: "s10", name: "Portland" }, baseFare: 35, distanceKm: 173, estimatedTimeMinutes: 180, createdAt: "2026-01-01T00:00:00Z" },
];
