import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/api";

const SKILL_COLORS = {
  reading:   { bg: "#dbeafe", color: "#1d4ed8" },
  listening: { bg: "#dcfce7", color: "#15803d" },
  writing:   { bg: "#fef3c7", color: "#b45309" },
  speaking:  { bg: "#fce7f3", color: "#be185d" },
};

const AVATAR_PALETTES = [
  { bg: "#e0e7ff", color: "#3730a3" },
  { bg: "#dcfce7", color: "#166534" },
  { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#fed7aa", color: "#9a3412" },
  { bg: "#dbeafe", color: "#1e40af" },
  { bg: "#f3e8ff", color: "#7e22ce" },
];

function avatarStyle(name) {
  const code = (name?.toUpperCase().charCodeAt(0) ?? 65) - 65;
  return AVATAR_PALETTES[Math.abs(code) % AVATAR_PALETTES.length];
}

function BandChip({ skill, band }) {
  const c = SKILL_COLORS[skill] ?? { bg: "#f1f5f9", color: "#64748b" };
  const label = skill[0].toUpperCase();
  return (
    <span className="band-chip" style={{ background: c.bg, color: c.color }}>
      {label} {band}
    </span>
  );
}

export function Users() {
  const [users, setUsers]       = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [assigning, setAssigning] = useState({});

  useEffect(() => {
    adminFetch("/api/admin/users").then((d) => setUsers(d.users)).catch((e) => setError(e.message));
    adminFetch("/api/admin/teachers").then((d) => setTeachers(d.teachers)).catch(() => {});
  }, []);

  const handleAssign = async (userId, teacherId) => {
    setAssigning((a) => ({ ...a, [userId]: true }));
    try {
      await adminFetch(`/api/admin/users/${userId}`, { method: "PATCH", body: { teacherId } });
      // local update — no full refetch needed
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, teacherId: teacherId || null } : u)
      );
    } catch (e) { setError(e.message); }
    finally { setAssigning((a) => ({ ...a, [userId]: false })); }
  };

  const filtered = useMemo(() => {
    let list = users;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((u) =>
        u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)
      );
    }
    if (filterTeacher === "__none__") list = list.filter((u) => !u.teacherId);
    else if (filterTeacher) list = list.filter((u) => u.teacherId === filterTeacher);
    return list;
  }, [users, search, filterTeacher]);

  if (error) return <p className="error" style={{ padding: "2rem" }}>{error}</p>;

  const unassigned   = users.filter((u) => !u.teacherId).length;
  const withAttempts = users.filter((u) => u.attemptCount > 0).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>O'quvchilar</h1>
          <p className="muted">Tizimda ro'yxatdan o'tgan barcha o'quvchilar.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="us-stats">
        <div className="us-stat us-stat--accent">
          <span className="us-stat-n">{users.length}</span>
          <span className="us-stat-l">Jami</span>
        </div>
        <div className={`us-stat ${unassigned > 0 ? "us-stat--warn" : "us-stat--muted"}`}>
          <span className="us-stat-n">{unassigned}</span>
          <span className="us-stat-l">Biriktirilmagan</span>
        </div>
        <div className="us-stat us-stat--success">
          <span className="us-stat-n">{withAttempts}</span>
          <span className="us-stat-l">Faol</span>
        </div>
      </div>

      {/* Filters */}
      <div className="us-filters">
        <label className="us-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" className="us-search-ico">
            <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Ism yoki username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="us-search-inp"
          />
          {search && (
            <button type="button" className="us-clear" onClick={() => setSearch("")}>×</button>
          )}
        </label>

        <select
          className="us-select"
          value={filterTeacher}
          onChange={(e) => setFilterTeacher(e.target.value)}
        >
          <option value="">Barcha o'qituvchilar</option>
          <option value="__none__">— Biriktirilmagan —</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap" style={{ marginTop: 0 }}>
        <table>
          <thead>
            <tr>
              <th>O'quvchi</th>
              <th>Maqsad</th>
              <th>Natijalar</th>
              <th style={{ textAlign: "center" }}>Urinish</th>
              <th>O'qituvchi</th>
              <th>Qo'shilgan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">
                  {search || filterTeacher
                    ? "Filtr bo'yicha hech narsa topilmadi."
                    : "Hali o'quvchi yo'q."}
                </td>
              </tr>
            )}
            {filtered.map((user) => {
              const { bg, color } = avatarStyle(user.name);
              const bands = Object.entries(user.latestBands ?? {});
              const hasTeacher = Boolean(user.teacherId);

              return (
                <tr key={user.id}>
                  {/* Student identity */}
                  <td>
                    <div className="us-identity">
                      <span className="avatar"
                        style={{ background: bg, color, width: 34, height: 34, fontSize: "0.88rem" }}>
                        {user.name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                      <div>
                        <div className="us-name">{user.name}</div>
                        <div className="us-uname">@{user.username}</div>
                      </div>
                    </div>
                  </td>

                  {/* Target band */}
                  <td>
                    {user.targetBand
                      ? <span className="us-target">{user.targetBand}</span>
                      : <span className="us-dash">—</span>}
                  </td>

                  {/* Skill bands */}
                  <td>
                    {bands.length === 0
                      ? <span className="us-dash">—</span>
                      : <div className="band-chips">
                          {bands.map(([s, b]) => <BandChip key={s} skill={s} band={b} />)}
                        </div>}
                  </td>

                  {/* Attempts */}
                  <td style={{ textAlign: "center" }}>
                    <span className={`pill ${user.attemptCount > 0 ? "pill-success" : "pill-neutral"}`}>
                      {user.attemptCount}
                    </span>
                  </td>

                  {/* Teacher — single styled select */}
                  <td>
                    <div className={`us-assign ${hasTeacher ? "us-assign--set" : "us-assign--empty"}`}>
                      <select
                        value={user.teacherId ?? ""}
                        disabled={assigning[user.id]}
                        onChange={(e) => handleAssign(user.id, e.target.value)}
                      >
                        <option value="">O'qituvchi tanlang...</option>
                        {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="us-date">
                    {new Date(user.createdAt).toLocaleDateString("uz-UZ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
