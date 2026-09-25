/**
 * LifeLink — shared domain types.
 * All data in v1 is demo data persisted to localStorage (no backend).
 */
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
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
];
export function inventoryStatus(item) {
    if (item.units <= 3)
        return "critical";
    if (item.units <= item.lowStockThreshold)
        return "low";
    return "available";
}
