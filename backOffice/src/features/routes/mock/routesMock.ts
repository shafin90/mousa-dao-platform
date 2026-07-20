import type { Route } from "../../../shared/types";
export const mockRoutes: Route[] = [
  { _id: "R001", fromCity: { _id: "c1", name: "New York" }, toCity: { _id: "c2", name: "Boston" }, distanceKm: 215, estimatedTimeMinutes: 255, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "R002", fromCity: { _id: "c3", name: "Los Angeles" }, toCity: { _id: "c4", name: "San Francisco" }, distanceKm: 383, estimatedTimeMinutes: 390, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "R003", fromCity: { _id: "c5", name: "Chicago" }, toCity: { _id: "c6", name: "Detroit" }, distanceKm: 283, estimatedTimeMinutes: 285, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "R004", fromCity: { _id: "c7", name: "Houston" }, toCity: { _id: "c8", name: "Dallas" }, distanceKm: 239, estimatedTimeMinutes: 225, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "R005", fromCity: { _id: "c9", name: "Seattle" }, toCity: { _id: "c10", name: "Portland" }, distanceKm: 173, estimatedTimeMinutes: 180, createdAt: "2026-01-01T00:00:00Z" },
];
