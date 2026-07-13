import type { User } from "../../../shared/types";

export const mockUsers: User[] = [
  { _id: "U-1", email: "john@busadmin.com", phone: "+1-555-0100", role: "admin", profile: { firstName: "John", lastName: "Admin" }, authTracking: { failedLoginAttempts: 0, isLocked: false }, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "U-2", email: "sarah@busadmin.com", phone: "+1-555-0101", role: "staff", profile: { firstName: "Sarah", lastName: "Support" }, authTracking: { failedLoginAttempts: 0, isLocked: false }, createdAt: "2026-01-01T00:00:00Z" },
  { _id: "U-3", email: "mike@busadmin.com", phone: "+1-555-0102", role: "admin", profile: { firstName: "Mike", lastName: "Manager" }, authTracking: { failedLoginAttempts: 3, isLocked: true }, createdAt: "2026-01-01T00:00:00Z" },
];
