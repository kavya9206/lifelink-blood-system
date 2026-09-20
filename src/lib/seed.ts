import type { BloodGroup, LifeLinkData } from "./types";

/**
 * LifeLink v1 demo seed data — realistic Indian names, hospitals and cities.
 * Clearly marked as sample/demo data in the UI; persisted to localStorage.
 */

const iso = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};
const stamp = (daysAgo: number, hours = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, 30, 0, 0);
  return d.toISOString();
};

export const DEMO_PASSWORD = "demo1234";

const users: LifeLinkData["users"] = [
  { id: "u-admin", name: "LifeLink Admin", email: "admin@lifelink.in", phone: "+91 98100 11122", password: DEMO_PASSWORD, role: "admin", createdAt: iso(400) },
  { id: "u-donor", name: "Aarav Sharma", email: "donor@lifelink.in", phone: "+91 98200 33445", password: DEMO_PASSWORD, role: "donor", createdAt: iso(320) },
  { id: "u-recipient", name: "Meera Krishnan", email: "recipient@lifelink.in", phone: "+91 90030 55667", password: DEMO_PASSWORD, role: "recipient", createdAt: iso(200) },
  { id: "u-hospital", name: "Apollo Hospitals Chennai", email: "hospital@lifelink.in", phone: "+91 44282 93333", password: DEMO_PASSWORD, role: "hospital", createdAt: iso(380) },
];

const donors: LifeLinkData["donors"] = [
  { id: "d-1", userId: "u-donor", name: "Aarav Sharma", age: 28, gender: "Male", bloodGroup: "O+", phone: "+91 98200 33445", email: "donor@lifelink.in", city: "Mumbai", address: "B-702, Sunset Residency, Andheri West", lastDonation: iso(120), available: true, history: [ { id: "dh-1", date: iso(120), location: "KEM Hospital, Mumbai", units: 1 }, { id: "dh-2", date: iso(230), location: "LifeLink Camp, Andheri", units: 1 }, { id: "dh-3", date: iso(340), location: "Fortis Hospital, Mumbai", units: 1 } ], createdAt: iso(320) },
  { id: "d-2", userId: null, name: "Priya Patel", age: 31, gender: "Female", bloodGroup: "A+", phone: "+91 98790 11223", email: "priya.patel@example.in", city: "Ahmedabad", address: "14, Sindhu Bhavan Marg, Bodakdev", lastDonation: iso(75), available: true, history: [ { id: "dh-4", date: iso(75), location: "Civil Hospital, Ahmedabad", units: 1 } ], createdAt: iso(300) },
  { id: "d-3", userId: null, name: "Rohan Mehta", age: 42, gender: "Male", bloodGroup: "B+", phone: "+91 99300 45678", email: "rohan.mehta@example.in", city: "Mumbai", address: "9A, Palm Grove, Powai", lastDonation: iso(400), available: true, history: [ { id: "dh-5", date: iso(400), location: "Sion Hospital, Mumbai", units: 1 } ], createdAt: iso(410) },
  { id: "d-4", userId: null, name: "Ananya Iyer", age: 25, gender: "Female", bloodGroup: "O-", phone: "+91 98860 77889", email: "ananya.iyer@example.in", city: "Bengaluru", address: "22, Indiranagar 100ft Road", lastDonation: iso(30), available: false, history: [ { id: "dh-6", date: iso(30), location: "Manipal Hospital, Bengaluru", units: 1 } ], createdAt: iso(150) },
  { id: "d-5", userId: null, name: "Vikram Singh Rathore", age: 36, gender: "Male", bloodGroup: "AB+", phone: "+91 98110 22334", email: "vikram.singh@example.in", city: "Delhi", address: "C-9, Green Park Extension", lastDonation: iso(210), available: true, history: [ { id: "dh-7", date: iso(210), location: "AIIMS, New Delhi", units: 1 } ], createdAt: iso(220) },
  { id: "d-6", userId: null, name: "Sneha Kulkarni", age: 29, gender: "Female", bloodGroup: "A-", phone: "+91 97660 88990", email: "sneha.k@example.in", city: "Pune", address: "Plot 45, Baner Road", lastDonation: null, available: true, history: [], createdAt: iso(90) },
  { id: "d-7", userId: null, name: "Arjun Reddy", age: 33, gender: "Male", bloodGroup: "O+", phone: "+91 90000 12345", email: "arjun.reddy@example.in", city: "Hyderabad", address: "8-2-120, Road No. 12, Banjara Hills", lastDonation: iso(95), available: true, history: [ { id: "dh-8", date: iso(95), location: "NIMS, Hyderabad", units: 1 } ], createdAt: iso(180) },
  { id: "d-8", userId: null, name: "Kavya Nair", age: 26, gender: "Female", bloodGroup: "B-", phone: "+91 98470 33455", email: "kavya.nair@example.in", city: "Kochi", address: "Villa 6, Marine Drive", lastDonation: iso(180), available: true, history: [ { id: "dh-9", date: iso(180), location: "KIMS, Kochi", units: 1 } ], createdAt: iso(200) },
  { id: "d-9", userId: null, name: "Rahul Verma", age: 39, gender: "Male", bloodGroup: "AB-", phone: "+91 98310 99887", email: "rahul.verma@example.in", city: "Kolkata", address: "5B, Salt Lake Sector 3", lastDonation: iso(500), available: true, history: [ { id: "dh-10", date: iso(500), location: "CMRI Hospital, Kolkata", units: 1 } ], createdAt: iso(520) },
  { id: "d-10", userId: null, name: "Divya Joshi", age: 24, gender: "Female", bloodGroup: "O-", phone: "+91 94140 66554", email: "divya.joshi@example.in", city: "Jaipur", address: "27, C-Scheme, Ashok Nagar", lastDonation: iso(60), available: true, history: [ { id: "dh-11", date: iso(60), location: "Sawai Man Singh Hospital, Jaipur", units: 1 } ], createdAt: iso(70) },
];

const requests: LifeLinkData["requests"] = [
  { id: "r-1", patientName: "Ramesh Gupta", bloodGroup: "B+", units: 2, hospitalName: "AIIMS New Delhi", hospitalCity: "Delhi", contact: "+91 98111 22334", neededBy: iso(-2), urgency: "critical", notes: "Post-surgery transfusion, ICU. Sample data.", status: "approved", requestedBy: null, createdAt: stamp(1, 9) },
  { id: "r-2", patientName: "Lakshmi Narayanan", bloodGroup: "O+", units: 3, hospitalName: "Apollo Hospitals", hospitalCity: "Chennai", contact: "+91 90031 44556", neededBy: iso(-5), urgency: "urgent", notes: "Thalassemia patient, regular transfusion.", status: "pending", requestedBy: "u-recipient", createdAt: stamp(0, 8) },
  { id: "r-3", patientName: "Imran Khan", bloodGroup: "A-", units: 1, hospitalName: "Ruby Hall Clinic", hospitalCity: "Pune", contact: "+91 97660 11220", neededBy: iso(-9), urgency: "normal", notes: "Planned operation, scheduled admission.", status: "fulfilled", requestedBy: null, createdAt: stamp(6, 11) },
  { id: "r-4", patientName: "Sarita Devi", bloodGroup: "AB+", units: 2, hospitalName: "Fortis Hospital", hospitalCity: "Mumbai", contact: "+91 98200 66778", neededBy: iso(-3), urgency: "urgent", notes: "Anemia emergency, maternity ward.", status: "pending", requestedBy: null, createdAt: stamp(1, 14) },
  { id: "r-5", patientName: "Devika Menon", bloodGroup: "O-", units: 1, hospitalName: "KIMS Hospital", hospitalCity: "Kochi", contact: "+91 98470 77889", neededBy: iso(-15), urgency: "critical", notes: "Road accident, emergency ward.", status: "fulfilled", requestedBy: null, createdAt: stamp(9, 16) },
];

const facilities = [
  { facility: "LifeLink Central Blood Bank", city: "Mumbai", phone: "+91 22 2610 4000" },
  { facility: "AIIMS Blood Centre", city: "Delhi", phone: "+91 11 2658 8500" },
  { facility: "Apollo Blood Bank", city: "Chennai", phone: "+91 44 2829 3333" },
  { facility: "Manipal Blood Bank", city: "Bengaluru", phone: "+91 80 2502 4444" },
  { facility: "Ruby Hall Blood Centre", city: "Pune", phone: "+91 20 6645 5100" },
  { facility: "KIMS Voluntary Blood Bank", city: "Kochi", phone: "+91 484 304 1000" },
];

// Units pattern per group, rotated across facilities so every group appears
// with available / low / critical states in the demo data.
const unitPattern: Record<BloodGroup, number[]> = {
  "A+": [18, 9, 22, 14, 7, 16],
  "A-": [5, 3, 6, 4, 2, 5],
  "B+": [21, 12, 17, 19, 10, 13],
  "B-": [4, 6, 3, 5, 2, 4],
  "AB+": [9, 6, 11, 7, 5, 8],
  "AB-": [3, 2, 4, 3, 2, 2],
  "O+": [26, 15, 24, 20, 12, 18],
  "O-": [7, 4, 8, 6, 3, 5],
};
const LOW = 8;

const inventory: LifeLinkData["inventory"] = facilities.flatMap((f, fi) =>
  (Object.keys(unitPattern) as BloodGroup[]).map((bg) => ({
    id: `inv-${fi}-${bg.replace("+", "p").replace("-", "n")}`,
    bloodGroup: bg,
    facility: f.facility,
    city: f.city,
    units: unitPattern[bg][fi],
    lowStockThreshold: LOW,
    updatedAt: stamp(fi === 2 ? 0 : 1, 9 + fi),
  })),
);

const hospitals: LifeLinkData["hospitals"] = [
  { id: "h-1", name: "All India Institute of Medical Sciences (AIIMS)", city: "Delhi", address: "Ansari Nagar, New Delhi 110029", phone: "+91 11 2658 8500", emergency24x7: true, groups: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
  { id: "h-2", name: "Apollo Hospitals Greams Road", city: "Chennai", address: "21, Greams Lane, Thousand Lights", phone: "+91 44 2829 3333", emergency24x7: true, groups: ["A+", "B+", "B-", "AB+", "O+", "O-"] },
  { id: "h-3", name: "Fortis Hospital Mulund", city: "Mumbai", address: "Mulund Goregaon Link Road, Mulund West", phone: "+91 22 6799 4444", emergency24x7: true, groups: ["A+", "A-", "B+", "AB+", "O+"] },
  { id: "h-4", name: "Manipal Hospital Old Airport Road", city: "Bengaluru", address: "98, HAL Old Airport Road", phone: "+91 80 2502 4444", emergency24x7: true, groups: ["A+", "B+", "AB+", "AB-", "O+", "O-"] },
  { id: "h-5", name: "Ruby Hall Clinic", city: "Pune", address: "40, Sassoon Road, Sangamvadi", phone: "+91 20 6645 5100", emergency24x7: false, groups: ["A+", "B+", "O+", "O-"] },
  { id: "h-6", name: "Amrita Institute of Medical Sciences", city: "Kochi", address: "Ponekkara, Edappally", phone: "+91 484 400 1234", emergency24x7: true, groups: ["A+", "A-", "B+", "AB+", "O+"] },
  { id: "h-7", name: "Medanta The Medicity", city: "Delhi", address: "CH Baktawar Singh Road, Sector 38, Gurugram", phone: "+91 124 414 1414", emergency24x7: true, groups: ["A+", "B+", "B-", "AB+", "O+", "O-"] },
  { id: "h-8", name: "Sawai Man Singh Hospital", city: "Jaipur", address: "JLN Marg, Adarsh Nagar", phone: "+91 141 252 0177", emergency24x7: false, groups: ["B+", "AB+", "O+"] },
  { id: "h-9", name: "Nizam's Institute of Medical Sciences", city: "Hyderabad", address: "Punjagutta", phone: "+91 40 2348 9999", emergency24x7: true, groups: ["A+", "B+", "AB+", "O+", "O-"] },
  { id: "h-10", name: "Institute of Postgraduate Medical Education & Research (IPGMER)", city: "Kolkata", address: "244, Acharya Jagadish Chandra Bose Road", phone: "+91 33 2204 1000", emergency24x7: false, groups: ["A+", "B+", "O+"] },
];

export function seedData(): LifeLinkData {
  return { users, donors, requests, inventory, hospitals };
}
