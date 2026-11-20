export const UNITS = [1, 2, 3, 4, 5];
export const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Structural",
  "Appliance",
  "Others",
];
export const STATUSES = ["Pending", "In-Progress", "Resolved"];

const STORAGE_KEY = "tcms.complaints.v1";
const SESSION_KEY = "tcms.session.v1";
const ANN_KEY = "tcms.announcements.v1";
const TENANTS_KEY = "tcms.tenants.v1";

const MANAGEMENT_PASSWORD = "manage123";

// Pre-seeded tenant accounts for Units 1–5 (Landlord can edit, replace, or vacate any unit)
const SEED_TENANTS = [
  {
    unit: 1,
    fullName: "Mr. Adewale Ogunleye",
    contact: "0803 123 4501",
    password: "unit1",
    moveInDate: "2026-01-15",
    updatedAt: "2026-01-15T09:00:00.000Z",
  },
  {
    unit: 2,
    fullName: "Mrs. Zainab Abdullahi",
    contact: "0805 234 5602",
    password: "unit2",
    moveInDate: "2026-03-01",
    updatedAt: "2026-03-01T09:00:00.000Z",
  },
  {
    unit: 3,
    fullName: "Mr. Chukwudi Okafor",
    contact: "0806 345 6703",
    password: "unit3",
    moveInDate: "2026-05-10",
    updatedAt: "2026-05-10T09:00:00.000Z",
  },
  {
    unit: 4,
    fullName: "Miss Funke Balogun",
    contact: "0809 456 7804",
    password: "unit4",
    moveInDate: "2026-07-20",
    updatedAt: "2026-07-20T09:00:00.000Z",
  },
  {
    unit: 5,
    fullName: "Alhaji Ibrahim Danjuma",
    contact: "0802 567 8905",
    password: "unit5",
    moveInDate: "2026-09-01",
    updatedAt: "2026-09-01T09:00:00.000Z",
  },
];

const SEED_COMPLAINTS = [
  {
    id: "c101",
    unit: 1,
    category: ["Plumbing"],
    description: "Kitchen sink pipe leaking steadily underneath the cabinet.",
    photoUrl: "",
    status: "In-Progress",
    technician: "Musa (Plumber)",
    createdAt: "2026-11-18T09:15:00.000Z",
    updatedAt: "2026-11-19T14:20:00.000Z",
  },
  {
    id: "c102",
    unit: 2,
    category: ["Electrical"],
    description: "Living room ceiling fan regulator sparking when switched on.",
    photoUrl: "",
    status: "Pending",
    technician: "",
    createdAt: "2026-11-19T16:40:00.000Z",
    updatedAt: "2026-11-19T16:40:00.000Z",
  },
  {
    id: "c103",
    unit: 3,
    category: ["Structural", "Plumbing"],
    description: "Damp patch and peeling paint near the bathroom window wall.",
    photoUrl: "",
    status: "Resolved",
    technician: "Suleiman (Mason & Plumber)",
    createdAt: "2026-11-10T11:00:00.000Z",
    updatedAt: "2026-11-14T17:10:00.000Z",
  },
];

const SEED_ANNOUNCEMENTS = [
  {
    id: "a1",
    title: "Water Supply Maintenance",
    tag: "Maintenance",
    createdAt: "2026-11-21T08:00:00.000Z",
    details:
      "Scheduled borehole & overhead tank servicing at Asiawu Oyenihun Holdings this Saturday from 9:00 AM to 1:00 PM. Please store sufficient water ahead of time.",
  },
  {
    id: "a2",
    title: "Estate Gate & Guest Policy",
    tag: "Security",
    createdAt: "2026-11-18T10:30:00.000Z",
    details:
      "All visitors and external technicians must check in at the security gate upon arrival at Asiawu Oyenihun Holdings (Fate/Tanke, Ilorin).",
  },
];

function loadComplaints() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPLAINTS));
      return [...SEED_COMPLAINTS];
    }
    return JSON.parse(raw);
  } catch {
    return [...SEED_COMPLAINTS];
  }
}

function saveComplaints(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadAnnouncements() {
  try {
    const raw = localStorage.getItem(ANN_KEY);
    if (!raw) {
      localStorage.setItem(ANN_KEY, JSON.stringify(SEED_ANNOUNCEMENTS));
      return [...SEED_ANNOUNCEMENTS];
    }
    return JSON.parse(raw);
  } catch {
    return [...SEED_ANNOUNCEMENTS];
  }
}

function loadTenants() {
  try {
    const raw = localStorage.getItem(TENANTS_KEY);
    if (!raw) {
      localStorage.setItem(TENANTS_KEY, JSON.stringify(SEED_TENANTS));
      return [...SEED_TENANTS];
    }
    return JSON.parse(raw);
  } catch {
    return [...SEED_TENANTS];
  }
}

function saveTenants(list) {
  localStorage.setItem(TENANTS_KEY, JSON.stringify(list));
}

// --- Tenant Provisioning (Landlord Managed) ---
export async function listTenants() {
  return loadTenants().sort((a, b) => a.unit - b.unit);
}

export async function getTenantByUnit(unit) {
  const unitNum = Number(unit);
  return loadTenants().find((t) => t.unit === unitNum) || null;
}

export async function upsertTenant({
  unit,
  fullName,
  contact = "",
  password,
  moveInDate = "",
}) {
  const unitNum = Number(unit);
  if (!UNITS.includes(unitNum)) {
    throw new Error("Select a valid residential unit (1–5).");
  }
  const cleanName = String(fullName || "").trim();
  const cleanPassword = String(password || "").trim();
  if (cleanName.length < 2) {
    throw new Error("Enter the tenant's full name.");
  }
  if (cleanPassword.length < 4) {
    throw new Error("Password must be at least 4 characters.");
  }

  const all = loadTenants();
  const now = new Date().toISOString();
  const record = {
    unit: unitNum,
    fullName: cleanName,
    contact: String(contact || "").trim(),
    password: cleanPassword,
    moveInDate: moveInDate || now.slice(0, 10),
    updatedAt: now,
  };

  const idx = all.findIndex((t) => t.unit === unitNum);
  if (idx === -1) {
    all.push(record);
  } else {
    all[idx] = record;
  }
  saveTenants(all);
  return record;
}

export async function removeTenant(unit) {
  const unitNum = Number(unit);
  const next = loadTenants().filter((t) => t.unit !== unitNum);
  saveTenants(next);
  return next.sort((a, b) => a.unit - b.unit);
}

// --- Authentication ---
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function loginUnit(unit, password) {
  const unitNum = Number(unit);
  const tenant = loadTenants().find((t) => t.unit === unitNum);
  if (!tenant) {
    throw new Error(
      `Unit ${unitNum} has no active tenant account yet. Please contact Management.`,
    );
  }
  if (
    String(password || "")
      .trim()
      .toLowerCase() !==
    String(tenant.password || "")
      .trim()
      .toLowerCase()
  ) {
    throw new Error("Incorrect password for Unit " + unitNum + ".");
  }
  const session = {
    role: "tenant",
    unit: unitNum,
    fullName: tenant.fullName,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function loginManagement(password) {
  if (String(password || "").trim() !== MANAGEMENT_PASSWORD) {
    throw new Error("Incorrect management password.");
  }
  const session = { role: "management" };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// --- Complaints ---
export async function listComplaints({ unit } = {}) {
  const all = loadComplaints().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  if (unit !== undefined && unit !== null && unit !== "") {
    return all.filter((c) => c.unit === Number(unit));
  }
  return all;
}

export async function getComplaint(id) {
  return loadComplaints().find((c) => c.id === id) || null;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(new Error("Could not read selected image file."));
    reader.readAsDataURL(file);
  });
}

export async function createComplaint({ unit, category, description, photo }) {
  const all = loadComplaints();
  const photoUrl = photo ? await fileToDataUrl(photo) : "";
  const now = new Date().toISOString();
  const item = {
    id: "c" + Date.now(),
    unit: Number(unit),
    category: Array.isArray(category) ? category : [category],
    description: description.trim(),
    photoUrl,
    status: "Pending",
    technician: "",
    createdAt: now,
    updatedAt: now,
  };
  saveComplaints([item, ...all]);
  return item;
}

export const addComplaint = createComplaint;

export async function updateComplaint(id, patch) {
  const all = loadComplaints();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Complaint not found.");
  const updated = {
    ...all[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  saveComplaints(all);
  return updated;
}

// --- Announcements ---
export async function listAnnouncements() {
  return loadAnnouncements().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

export async function addAnnouncement({ title, tag = "General", details }) {
  const all = loadAnnouncements();
  const item = {
    id: "a" + Date.now(),
    title: title.trim(),
    tag,
    details: details.trim(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(ANN_KEY, JSON.stringify([item, ...all]));
  return item;
}

export async function deleteAnnouncement(id) {
  const next = loadAnnouncements().filter((a) => a.id !== id);
  localStorage.setItem(ANN_KEY, JSON.stringify(next));
  return next;
}
