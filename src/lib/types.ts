/**
 * LifeLink — shared domain types.
 * All data in v1 is demo data persisted to localStorage (no backend).
 */

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Kochi",
] as const;

export type City = (typeof CITIES)[number];

export type Role = "donor" | "recipient" | "hospital" | "admin";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** Demo only — v1 has no backend, so credentials live in localStorage. */
  password: string;
  role: Role;
  createdAt: string;
}

export interface DonationRecord {
  id: string;
  date: string; // ISO yyyy-mm-dd
  location: string;
  units: number;
}

export interface Donor {
  id: string;
  userId: string | null; // linked account, if registered & signed in
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  bloodGroup: BloodGroup;
  phone: string;
  email: string;
  city: string;
  address: string;
  lastDonation: string | null; // ISO yyyy-mm-dd
  available: boolean;
  history: DonationRecord[];
  createdAt: string;
}

export type Urgency = "normal" | "urgent" | "critical";
export type RequestStatus = "pending" | "approved" | "fulfilled" | "rejected";

export interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  units: number;
  hospitalName: string;
  hospitalCity: string;
  contact: string;
  neededBy: string; // ISO yyyy-mm-dd
  urgency: Urgency;
  notes: string;
  status: RequestStatus;
  requestedBy: string | null; // user id
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  bloodGroup: BloodGroup;
  facility: string;
  city: string;
  units: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  emergency24x7: boolean;
  groups: BloodGroup[]; // blood groups they can supply
}

export interface LifeLinkData {
  users: UserAccount[];
  donors: Donor[];
  requests: BloodRequest[];
  inventory: InventoryItem[];
  hospitals: Hospital[];
}

export function inventoryStatus(
  item: Pick<InventoryItem, "units" | "lowStockThreshold">,
): "available" | "low" | "critical" {
  if (item.units <= 3) return "critical";
  if (item.units <= item.lowStockThreshold) return "low";
  return "available";
}
