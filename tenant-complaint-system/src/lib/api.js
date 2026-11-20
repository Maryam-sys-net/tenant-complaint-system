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

// Replace these values with your original unit surnames and management password
const UNIT_PASSWORDS = {
  1: "unit1",
  2: "unit2",
  3: "unit3",
  4: "unit3",
  5: "unit4",
};

const MANAGEMENT_PASSWORD = "manage123";

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
  const expected = UNIT_PASSWORDS[unitNum];
  if (
    !expected ||
    String(password || "")
      .trim()
      .toLowerCase() !== expected
  ) {
    throw new Error("Incorrect surname password for Unit " + unitNum + ".");
  }
  const session = { role: "tenant", unit: unitNum };
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
