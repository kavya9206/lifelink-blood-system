// LifeLink — normalize Flask/Supabase (snake_case) rows to the
// camelCase shapes the existing UI already expects. This lets every
// page stay visually identical while talking to the real backend.

export function mapInventoryRow(r) {
  if (!r) return r;
  return {
    id: r.id,
    bloodGroup: r.blood_group ?? r.bloodGroup,
    facility: r.facility,
    city: r.city,
    units: r.units,
    lowStockThreshold: r.low_stock_threshold ?? r.lowStockThreshold ?? 8,
    updatedAt: r.updated_at ?? r.updatedAt,
  };
}

export function mapDonorRow(r) {
  if (!r) return r;
  return {
    id: r.id,
    userId: r.user_id ?? r.userId ?? null,
    name: r.name,
    age: r.age,
    gender: r.gender,
    bloodGroup: r.blood_group ?? r.bloodGroup,
    phone: r.phone,
    email: r.email,
    city: r.city,
    address: r.address,
    lastDonation: r.last_donation ?? r.lastDonation ?? null,
    available: r.available,
    history: (r.history ?? r.donation_history ?? []).map((h) => ({
      id: h.id,
      date: h.date,
      location: h.location,
      units: h.units,
    })),
    createdAt: r.created_at ?? r.createdAt,
  };
}

export function mapRequestRow(r) {
  if (!r) return r;
  return {
    id: r.id,
    patientName: r.patient_name ?? r.patientName,
    bloodGroup: r.blood_group ?? r.bloodGroup,
    units: r.units,
    hospitalName: r.hospital_name ?? r.hospitalName,
    hospitalCity: r.hospital_city ?? r.hospitalCity,
    contact: r.contact,
    neededBy: r.needed_by ?? r.neededBy,
    urgency: r.urgency,
    notes: r.notes ?? "",
    status: r.status,
    requestedBy: r.requested_by ?? r.requestedBy ?? null,
    createdAt: r.created_at ?? r.createdAt,
  };
}

export function mapHospitalRow(r) {
  if (!r) return r;
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    address: r.address,
    phone: r.phone,
    emergency24x7: r.emergency_24x7 ?? r.emergency24x7 ?? false,
    groups: r.groups ?? [],
  };
}

export function mapUserRow(r) {
  if (!r) return r;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? "",
    role: r.role,
    createdAt: r.created_at ?? r.createdAt,
  };
}

// Payload helpers — UI camelCase -> API snake_case
export function donorPayloadForApi(p) {
  return {
    name: p.name,
    age: p.age,
    gender: p.gender,
    blood_group: p.bloodGroup,
    phone: p.phone,
    email: p.email,
    city: p.city,
    address: p.address,
    last_donation: p.lastDonation ?? null,
    available: p.available,
  };
}

export function requestPayloadForApi(p) {
  return {
    patient_name: p.patientName,
    blood_group: p.bloodGroup,
    units: p.units,
    hospital_name: p.hospitalName,
    hospital_city: p.hospitalCity,
    contact: p.contact,
    needed_by: p.neededBy,
    urgency: p.urgency,
    notes: p.notes ?? "",
  };
}
