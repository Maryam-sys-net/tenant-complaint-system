import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CATEGORIES,
  STATUSES,
  UNITS,
  addAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  listComplaints,
} from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { formatDate } from "../lib/validation.js";

const STATUS_STYLES = {
  Pending: "bg-amber-100 text-amber-700",
  "In-Progress": "bg-sky-100 text-sky-700",
  Resolved: "bg-emerald-100 text-emerald-700",
};

const CATEGORY_STYLES = {
  Plumbing: "bg-indigo-100 text-indigo-700",
  Electrical: "bg-purple-100 text-purple-700",
  Structural: "bg-violet-100 text-violet-700",
  Appliance: "bg-fuchsia-100 text-fuchsia-700",
  Others: "bg-slate-100 text-slate-700",
};

const CATEGORY_COLORS = {
  Plumbing: { hex: "#4c24b5", dot: "bg-[#4c24b5]" },
  Electrical: { hex: "#0ea5e9", dot: "bg-sky-500" },
  Structural: { hex: "#f59e0b", dot: "bg-amber-500" },
  Appliance: { hex: "#10b981", dot: "bg-emerald-500" },
  Others: { hex: "#a78bfa", dot: "bg-violet-400" },
};

const ANNOUNCEMENT_TAGS = ["Maintenance", "Security", "Sanitation", "General"];

export default function ManagementDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annTag, setAnnTag] = useState("Maintenance");
  const [annDetails, setAnnDetails] = useState("");
  const [annError, setAnnError] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [postingAnn, setPostingAnn] = useState(false);

  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    listComplaints().then(setItems);
    listAnnouncements().then(setAnnouncements);
  }, []);

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (annTitle.trim().length < 3) {
      setAnnError("Enter an announcement title (at least 3 characters).");
      return;
    }
    if (annDetails.trim().length < 10) {
      setAnnError("Write a clear notice message (at least 10 characters).");
      return;
    }
    setAnnError("");
    setAnnMessage("");
    setPostingAnn(true);
    try {
      const created = await addAnnouncement({
        title: annTitle,
        tag: annTag,
        details: annDetails,
      });
      setAnnouncements((prev) => [created, ...prev]);
      setAnnTitle("");
      setAnnDetails("");
      setAnnMessage("Announcement published to all 5 units.");
    } finally {
      setPostingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    const updated = await deleteAnnouncement(id);
    setAnnouncements(updated);
  };

  const counts = useMemo(
    () =>
      Object.fromEntries(
        STATUSES.map((s) => [
          s,
          (items || []).filter((c) => c.status === s).length,
        ]),
      ),
    [items],
  );
  const totalCount = items ? items.length : 0;

  const categoryStats = useMemo(() => {
    const list = items || [];
    const rawCounts = Object.fromEntries(CATEGORIES.map((cat) => [cat, 0]));
    let totalMentions = 0;

    list.forEach((c) => {
      const cats = Array.isArray(c.category) ? c.category : [c.category];
      cats.forEach((cat) => {
        if (rawCounts[cat] !== undefined) {
          rawCounts[cat] += 1;
          totalMentions += 1;
        }
      });
    });

    let cumulative = 0;
    return CATEGORIES.map((cat) => {
      const count = rawCounts[cat];
      const pct = totalMentions > 0 ? (count / totalMentions) * 100 : 0;
      const start = cumulative;
      cumulative += pct;
      return {
        category: cat,
        count,
        pct,
        start,
        color: CATEGORY_COLORS[cat],
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (unit && c.unit !== Number(unit)) return false;
      if (status && c.status !== status) return false;
      if (!q) return true;
      const cats = Array.isArray(c.category)
        ? c.category.join(" ")
        : c.category;
      return (
        c.description.toLowerCase().includes(q) ||
        cats.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        `unit ${c.unit}`.includes(q) ||
        (c.technician || "").toLowerCase().includes(q)
      );
    });
  }, [items, unit, status, search]);

  const displayedItems =
    activeTab === "complaints" ? filteredItems : filteredItems?.slice(0, 5);

  const openFilteredComplaints = ({ nextStatus = "", nextUnit = "" } = {}) => {
    setStatus(nextStatus);
    setUnit(nextUnit);
    setActiveTab("complaints");
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      action: () => {
        setStatus("");
        setUnit("");
        setActiveTab("dashboard");
      },
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: "complaints",
      label: "Complaints",
      action: () => setActiveTab("complaints"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: "units",
      label: "Units (1–5)",
      action: () => setActiveTab("units"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: "announcements",
      label: "Announcements",
      action: () => setActiveTab("announcements"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
      ),
    },
    {
      id: "history",
      label: "Resolved History",
      action: () => navigate("/management/history"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="min-h-screen flex bg-[#f5f4fb] text-slate-900 font-sans">
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* Left Deep-Indigo Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[240px] shrink-0 bg-gradient-to-b from-[#1a1045] via-[#211554] to-[#291a68] text-white flex flex-col justify-between transition-transform duration-200 overflow-hidden ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <svg
          className="absolute bottom-0 left-0 w-56 h-48 text-indigo-400/10 pointer-events-none"
          viewBox="0 0 200 180"
          fill="currentColor"
        >
          <path d="M100 20L15 88h26v72h118V88h26L100 20zm-18 78h14v14H82V98zm22 0h14v14h-14V98zm-22 22h14v14H82v-14zm22 0h14v14h-14v-14z" />
        </svg>

        <div className="relative z-10 px-4 pt-6">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className="w-full group flex flex-col items-center text-center mb-7 cursor-pointer"
          >
            <svg className="w-12 h-11" viewBox="0 0 64 56" fill="none">
              <path
                d="M12 27L32 10L52 27"
                stroke="#ffffff"
                strokeWidth="3.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 24V42M46 24V42"
                stroke="#ffffff"
                strokeWidth="3.8"
                strokeLinecap="round"
              />
              <rect
                x="27"
                y="25"
                width="4"
                height="4"
                rx="0.6"
                fill="#c4b5fd"
              />
              <rect
                x="33"
                y="25"
                width="4"
                height="4"
                rx="0.6"
                fill="#c4b5fd"
              />
              <rect
                x="27"
                y="31"
                width="4"
                height="4"
                rx="0.6"
                fill="#c4b5fd"
              />
              <rect
                x="33"
                y="31"
                width="4"
                height="4"
                rx="0.6"
                fill="#c4b5fd"
              />
              <path
                d="M10 47C22 41 42 41 54 47"
                stroke="#a78bfa"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>

            <span className="mt-1.5 text-[23px] font-black tracking-[0.22em] pl-[0.22em] bg-gradient-to-r from-white via-[#ddd6fe] to-[#a78bfa] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(167,139,250,0.35)]">
              AOH
            </span>
            <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.24em] pl-[0.24em] text-indigo-200/75">
              Management Systems
            </span>
          </button>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#5a35d5] to-[#6d46e8] text-white font-semibold shadow-lg shadow-indigo-950/50"
                      : "text-indigo-100/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="relative z-10 px-4 pb-8 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-indigo-100/85 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.9"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top White Header Bar */}
        <header className="bg-white border-b border-slate-200/70 px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="flex items-center w-full rounded-full bg-[#f1f2f7] px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:bg-white transition">
              <svg
                className="w-4 h-4 text-slate-500 mr-2.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (activeTab !== "dashboard" && activeTab !== "complaints") {
                    setActiveTab("complaints");
                  }
                }}
                placeholder="Search units, complaints or technicians..."
                className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-xs text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => openFilteredComplaints({ nextStatus: "Pending" })}
              className="relative p-2 rounded-full text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Pending complaints"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.9"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {counts.Pending || 0}
              </span>
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4c24b5] to-[#7c3aed] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                AOH
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="block text-xs font-bold text-slate-900">
                  Admin
                </span>
                <span className="block text-[11px] text-slate-500">
                  Management
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* TAB VIEW: UNITS OVERVIEW */}
        {activeTab === "units" && (
          <main className="flex-1 p-5 md:p-7 max-w-6xl w-full mx-auto space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                Units Overview (5 Residential Units)
              </h1>
              <p className="text-sm text-slate-500">
                Asiawu Oyenihun Holdings • Ahindero Area, Fate/Tanke, Ilorin
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {UNITS.map((u) => {
                const unitList = (items || []).filter((c) => c.unit === u);
                const pending = unitList.filter(
                  (c) => c.status === "Pending",
                ).length;
                const inProg = unitList.filter(
                  (c) => c.status === "In-Progress",
                ).length;
                const resolved = unitList.filter(
                  (c) => c.status === "Resolved",
                ).length;

                return (
                  <div
                    key={u}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center font-extrabold text-sm">
                            U{u}
                          </div>
                          <div>
                            <h2 className="text-base font-extrabold text-slate-900">
                              Unit {u}
                            </h2>
                            <p className="text-xs text-slate-500">
                              Residential Apartment
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          Occupied
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center bg-[#f7f6fd] rounded-xl p-3">
                        <div>
                          <p className="text-base font-extrabold text-amber-600">
                            {pending}
                          </p>
                          <p className="text-[11px] text-slate-500">Pending</p>
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-sky-600">
                            {inProg}
                          </p>
                          <p className="text-[11px] text-slate-500">Active</p>
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-emerald-600">
                            {resolved}
                          </p>
                          <p className="text-[11px] text-slate-500">Resolved</p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openFilteredComplaints({ nextUnit: String(u) })
                      }
                      className="w-full py-2.5 px-4 rounded-full bg-[#4c24b5] hover:bg-[#3f1c9c] text-white text-xs font-bold transition cursor-pointer"
                    >
                      View Unit {u} Tickets ({unitList.length}) →
                    </button>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* TAB VIEW: ANNOUNCEMENTS (WITH POST ANNOUNCEMENT FORM) */}
        {activeTab === "announcements" && (
          <main className="flex-1 p-5 md:p-7 max-w-6xl w-full mx-auto space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                Estate Announcements
              </h1>
              <p className="text-sm text-slate-500">
                Post notices and maintenance alerts visible to all 5 residential
                units
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Landlord Post Announcement Form */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Post New Announcement
                    </h2>
                    <p className="text-xs text-slate-500">
                      Broadcasts immediately to Units 1–5
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handlePostAnnouncement}
                  className="mt-5 space-y-4"
                  noValidate
                >
                  <div>
                    <label
                      htmlFor="ann-title"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Announcement Title *
                    </label>
                    <input
                      id="ann-title"
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Generator Servicing Schedule"
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Category Tag
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ANNOUNCEMENT_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setAnnTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                            annTag === tag
                              ? "bg-[#4c24b5] text-white"
                              : "bg-[#f4f2ff] text-slate-700 hover:bg-[#e7e2fb]"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ann-details"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Message Details *
                    </label>
                    <textarea
                      id="ann-details"
                      rows={4}
                      value={annDetails}
                      onChange={(e) => setAnnDetails(e.target.value)}
                      placeholder="Write the notice details for tenants..."
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition resize-y"
                    />
                  </div>

                  {annError && (
                    <p
                      role="alert"
                      className="text-xs font-semibold text-rose-600"
                    >
                      {annError}
                    </p>
                  )}

                  {annMessage && (
                    <p
                      role="status"
                      className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-700"
                    >
                      ✓ {annMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={postingAnn}
                    className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-[#4c24b5] to-[#6338d4] hover:from-[#5832c9] hover:to-[#7044e3] text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-900/15 transition disabled:opacity-60 cursor-pointer"
                  >
                    {postingAnn ? "Publishing..." : "Publish Announcement"}
                  </button>
                </form>
              </div>

              {/* Right Column: Published Announcements List */}
              <div className="lg:col-span-7 space-y-4">
                {announcements.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-200">
                    <p className="font-bold text-slate-800">
                      No announcements posted yet
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Use the form on the left to send a notice to all tenants.
                    </p>
                  </div>
                ) : (
                  announcements.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#4c24b5]" />
                          <h2 className="text-base font-extrabold text-slate-900">
                            {item.title}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-[#4c24b5]">
                            {item.tag}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-slate-400">
                            {formatDate(item.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(item.id)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                            title="Delete announcement"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                        {item.details}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        )}

        {/* TAB VIEW: DASHBOARD & ALL COMPLAINTS */}
        {(activeTab === "dashboard" || activeTab === "complaints") && (
          <main className="flex-1 p-5 md:p-7 max-w-7xl w-full mx-auto space-y-6">
            {activeTab === "dashboard" && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#dfd8fc] via-[#ebe6fe] to-[#d9d1fa] shadow-sm border border-white min-h-[165px] flex items-center">
                <div
                  className="hidden sm:block absolute inset-y-0 right-0 w-[56%] bg-cover bg-center"
                  style={{ backgroundImage: "url('/building.png')" }}
                />
                <div className="hidden sm:block absolute inset-y-0 right-0 w-[58%] bg-gradient-to-r from-[#e5dffd] via-[#e5dffd]/55 to-transparent" />

                <div className="relative z-10 p-6 md:p-8 max-w-lg">
                  <h1 className="text-2xl md:text-[30px] font-extrabold text-slate-900 tracking-tight">
                    Management Dashboard 👋
                  </h1>
                  <p className="text-sm text-slate-700 mt-1">
                    Overview of apartment activities and maintenance tickets
                    across Units 1–5.
                  </p>
                  <div className="w-12 h-1 rounded-full bg-[#4c24b5] mt-4" />
                </div>
              </div>
            )}

            {/* 4 Clickable KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => openFilteredComplaints({ nextStatus: "" })}
                className={`bg-white rounded-2xl p-5 shadow-sm border text-left flex items-center gap-4 transition cursor-pointer ${
                  activeTab === "complaints" && !status
                    ? "border-[#4c24b5] ring-2 ring-[#4c24b5]/25"
                    : "border-slate-100 hover:border-indigo-200"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#4c24b5] text-white flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {totalCount}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Total Complaints
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  openFilteredComplaints({ nextStatus: "In-Progress" })
                }
                className={`bg-white rounded-2xl p-5 shadow-sm border text-left flex items-center gap-4 transition cursor-pointer ${
                  status === "In-Progress"
                    ? "border-sky-500 ring-2 ring-sky-400/30"
                    : "border-slate-100 hover:border-sky-200"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 7v5l3 2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {counts["In-Progress"] || 0}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    In Progress
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  openFilteredComplaints({ nextStatus: "Resolved" })
                }
                className={`bg-white rounded-2xl p-5 shadow-sm border text-left flex items-center gap-4 transition cursor-pointer ${
                  status === "Resolved"
                    ? "border-emerald-500 ring-2 ring-emerald-400/30"
                    : "border-slate-100 hover:border-emerald-200"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {counts.Resolved || 0}
                  </p>
                  <p className="text-xs font-medium text-slate-500">Resolved</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  openFilteredComplaints({ nextStatus: "Pending" })
                }
                className={`bg-white rounded-2xl p-5 shadow-sm border text-left flex items-center gap-4 transition cursor-pointer ${
                  status === "Pending"
                    ? "border-amber-500 ring-2 ring-amber-400/30"
                    : "border-slate-100 hover:border-amber-200"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-amber-400 text-white flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {counts.Pending || 0}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Pending Response
                  </p>
                </div>
              </button>
            </div>

            {/* Complaints Overview Donut + Recent Complaints Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {activeTab === "dashboard" && (
                <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[#4c24b5]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Complaints Overview
                      </h2>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#f4f2ff] text-xs font-bold text-[#4c24b5]">
                      By Category
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                    <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                      <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="transparent"
                          stroke="#ede9fe"
                          strokeWidth="14"
                        />
                        {totalCount > 0 &&
                          categoryStats.map((seg) => {
                            if (seg.pct <= 0) return null;
                            const dash = (seg.pct / 100) * circumference;
                            const offset = -((seg.start / 100) * circumference);
                            return (
                              <circle
                                key={seg.category}
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="transparent"
                                stroke={seg.color.hex}
                                strokeWidth="14"
                                strokeDasharray={`${dash} ${circumference}`}
                                strokeDashoffset={offset}
                              />
                            );
                          })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-extrabold text-slate-900 leading-none">
                          {totalCount}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 mt-1">
                          Total
                        </span>
                      </div>
                    </div>

                    <div className="w-full space-y-2.5">
                      {categoryStats.map((seg) => (
                        <div
                          key={seg.category}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${seg.color.dot}`}
                            />
                            <span className="font-semibold text-slate-700">
                              {seg.category}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900">
                            {seg.count}{" "}
                            <span className="text-slate-400 font-medium">
                              ({Math.round(seg.pct)}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`${
                  activeTab === "complaints"
                    ? "lg:col-span-12"
                    : "lg:col-span-7"
                } bg-white rounded-2xl p-6 shadow-sm border border-slate-100`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#4c24b5]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 7v5l3 2"
                      />
                    </svg>
                    <h2 className="text-base font-extrabold text-slate-900">
                      {activeTab === "complaints"
                        ? "All Complaints"
                        : "Recent Complaints"}
                    </h2>
                  </div>

                  {activeTab === "complaints" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label="Filter by unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="rounded-full bg-[#f4f2ff] border border-indigo-100 px-3.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4c24b5]"
                      >
                        <option value="">All Units</option>
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            Unit {u}
                          </option>
                        ))}
                      </select>

                      <select
                        aria-label="Filter by status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-full bg-[#f4f2ff] border border-indigo-100 px-3.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4c24b5]"
                      >
                        <option value="">All Statuses</option>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      {(unit || status || search) && (
                        <button
                          type="button"
                          onClick={() => {
                            setUnit("");
                            setStatus("");
                            setSearch("");
                          }}
                          className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("complaints")}
                      className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  )}
                </div>

                {displayedItems === null && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Loading complaints...
                  </p>
                )}

                {displayedItems?.length === 0 && (
                  <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl">
                    <p className="font-bold text-slate-800">
                      No complaints match these filters
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Clear the filters to see every complaint across Units 1–5.
                    </p>
                  </div>
                )}

                {displayedItems && displayedItems.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-xs font-semibold text-slate-500">
                          <th className="py-3 pr-2">#</th>
                          <th className="py-3 px-2.5">Issue</th>
                          <th className="py-3 px-2.5">Unit</th>
                          <th className="py-3 px-2.5">Category</th>
                          <th className="py-3 px-2.5">Status</th>
                          <th className="py-3 px-2.5">Date</th>
                          <th className="py-3 pl-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {displayedItems.map((c, idx) => (
                          <tr
                            key={c.id}
                            onClick={() =>
                              navigate(`/management/complaints/${c.id}`)
                            }
                            className="hover:bg-indigo-50/40 transition cursor-pointer group"
                          >
                            <td className="py-3.5 pr-2 text-xs font-semibold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-2.5 font-semibold text-slate-900 max-w-[200px]">
                              <p className="line-clamp-2">{c.description}</p>
                            </td>
                            <td className="py-3.5 px-2.5 whitespace-nowrap text-xs font-bold text-slate-700">
                              Unit {c.unit}
                            </td>
                            <td className="py-3.5 px-2.5">
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(c.category)
                                  ? c.category
                                  : [c.category]
                                ).map((cat) => (
                                  <span
                                    key={cat}
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                      CATEGORY_STYLES[cat] ||
                                      "bg-indigo-100 text-indigo-700"
                                    }`}
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-2.5 whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                  STATUS_STYLES[c.status] ||
                                  "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-2.5 whitespace-nowrap text-xs text-slate-500">
                              {formatDate(c.createdAt)}
                            </td>
                            <td className="py-3.5 pl-2 text-center">
                              <span
                                title="Inspect & update ticket"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#f4f2ff] group-hover:bg-[#4c24b5] text-[#4c24b5] group-hover:text-white transition"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Latest Announcements + Quick Actions */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[#4c24b5]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                        />
                      </svg>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Latest Announcements
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("announcements")}
                      className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
                    >
                      Post / View All →
                    </button>
                  </div>

                  {announcements.length > 0 ? (
                    <div
                      onClick={() => setActiveTab("announcements")}
                      className="flex items-start gap-4 p-3.5 rounded-xl bg-[#f8f7fe] hover:bg-[#f1effc] transition cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {announcements[0].title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {announcements[0].details}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 mt-1.5">
                          {formatDate(announcements[0].createdAt)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("announcements")}
                      className="py-6 rounded-xl border border-dashed border-indigo-200 text-xs font-bold text-[#4c24b5] hover:bg-indigo-50/50 transition cursor-pointer"
                    >
                      + Post First Announcement
                    </button>
                  )}
                </div>

                <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-[#4c24b5]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                    </svg>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Quick Actions
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => openFilteredComplaints({ nextStatus: "" })}
                      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#f4f2ff] hover:bg-[#e8e3fe] text-slate-800 transition cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#4c24b5] text-white flex items-center justify-center">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-center">
                        View Complaints
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("units")}
                      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#f4f2ff] hover:bg-[#e8e3fe] text-slate-800 transition cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-white text-[#4c24b5] shadow-sm flex items-center justify-center">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-center">
                        Manage Units
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("announcements")}
                      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#f4f2ff] hover:bg-[#e8e3fe] text-slate-800 transition cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-white text-[#4c24b5] shadow-sm flex items-center justify-center">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-center">
                        Post Announcement
                      </span>
                    </button>

                    <Link
                      to="/management/history"
                      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#f4f2ff] hover:bg-[#e8e3fe] text-slate-800 transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-white text-emerald-600 shadow-sm flex items-center justify-center">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-center">
                        Resolved History
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
