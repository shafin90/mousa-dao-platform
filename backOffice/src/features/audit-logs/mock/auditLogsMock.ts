import type { AuditLog } from "../../../shared/types";
export const mockAuditLogs: AuditLog[] = [
  { _id: "A001", userId: { _id: "u1", email: "john@example.com" }, action: "Updated Bus Status", module: "Fleet", description: "Changed Bus B-402 to Maintenance", ipAddress: "192.168.1.1", userAgent: "", status: "success", metadata: {}, createdAt: "2023-11-10T10:23:00Z" },
  { _id: "A002", userId: { _id: "u2", email: "jane@example.com" }, action: "Refunded Booking", module: "Payments", description: "Refunded CFA 45.00 for B001", ipAddress: "192.168.1.5", userAgent: "", status: "success", metadata: {}, createdAt: "2023-11-10T11:05:00Z" },
  { _id: "A003", userId: { _id: "u1", email: "john@example.com" }, action: "Modified Route Price", module: "Routes", description: "Increased base price of R002 to CFA 70", ipAddress: "192.168.1.1", userAgent: "", status: "success", metadata: {}, createdAt: "2023-11-10T14:30:00Z" },
];
