import { useEffect, useState } from "react";
import { adminFetch } from "../lib/api";

const SKILL_META = {
  reading:   { label: "Reading",   color: "#3b82f6", light: "#dbeafe" },
  listening: { label: "Listening", color: "#16a34a", light: "#dcfce7" },
  writing:   { label: "Writing",   color: "#d97706", light: "#fef3c7" },
  speaking:  { label: "Speaking",  color: "#db2777", light: "#fce7f3" },
};

const KPI = [
  {
    key: "studentCount", label: "O'quvchilar", color: "#6366f1", bg: "#eef2ff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    key: "teacherCount", label: "O'qituvchilar", color: "#059669", bg: "#ecfdf5",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>,
  },
  {
    key: "totalTests", label: "Testlar", color: "#0891b2", bg: "#ecfeff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    key: "totalAttempts", label: "Urinishlar", color: "#7c3aed", bg: "#f5f3ff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
];

function SkillCard({ skill, data }) {
  const meta = SKILL_META[skill];
  if (!meta) return null;
  const pct = data.avgBand ? (data.avgBand / 9) * 100 : 0;

  return (
    <div className="db-skill-card">
      <div className="db-skill-card-head">
        <span className="db-skill-card-pill" style={{ background: meta.light, color: meta.color }}>
          {meta.label}
        </span>
        <span className="db-skill-card-tries">{data.count} urinish</span>
      </div>

      {data.avgBand != null ? (
        <div className="db-skill-card-score" style={{ color: meta.color }}>
          {data.avgBand}<span className="db-skill-card-max">/9</span>
        </div>
      ) : (
        <div className="db-skill-card-none">Hali ma'lumot yo'q</div>
      )}

      <div className="db-skill-card-track">
        <div className="db-skill-card-fill" style={{ width: `${pct}%`, background: meta.color }} />
      </div>

      <span className="db-skill-card-pct">{pct.toFixed(1)}%</span>
    </div>
  );
}

function TestBar({ skill, count, total }) {
  const meta = SKILL_META[skill];
  if (!meta) return null;
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="db-test-row">
      <span className="db-test-name" style={{ color: meta.color }}>{meta.label}</span>
      <div className="db-test-track">
        <div className="db-test-fill" style={{ width: `${pct}%`, background: meta.color }} />
      </div>
      <span className="db-test-count">{count} ta</span>
    </div>
  );
}

const TODAY = new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminFetch("/api/admin/stats")
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error" style={{ padding: "2rem" }}>{error}</p>;

  const skillEntries = stats ? Object.entries(stats.avgBandBySkill) : [];
  const testEntries  = stats ? Object.entries(stats.testsBySkill) : [];
  const totalTests   = stats ? Object.values(stats.testsBySkill).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">{TODAY}</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="db-kpi-row">
        {KPI.map(({ key, label, icon, color, bg }) => (
          <div key={key} className="db-kpi" style={{ "--kpi-color": color, "--kpi-bg": bg }}>
            <div className="db-kpi-icon">{icon}</div>
            <div className="db-kpi-num">{stats ? stats[key] ?? 0 : <span className="db-kpi-loading" />}</div>
            <div className="db-kpi-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Unassigned warning */}
      {stats?.unassignedCount > 0 && (
        <div className="db-warn-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            <strong>{stats.unassignedCount} ta o'quvchi</strong> hali o'qituvchiga biriktirilmagan.
          </span>
          <a href="#/users" className="db-warn-link">Ko'rish →</a>
        </div>
      )}

      {/* Skills performance */}
      <div className="db-panel db-section">
        <div className="db-panel-head">
          <span>Ko'rsatkichlar bo'yicha o'rtacha ball</span>
        </div>
        <div className="db-skill-cards">
          {stats
            ? skillEntries.map(([skill, data]) => (
                <SkillCard key={skill} skill={skill} data={data} />
              ))
            : [1,2,3,4].map((i) => <div key={i} className="db-row-skeleton" />)}
        </div>
      </div>

      {/* Tests by skill */}
      <div className="db-panel db-panel--sm db-section">
        <div className="db-panel-head">
          <span>Testlar taqsimoti</span>
          {stats && <span className="db-panel-sub">Jami: {totalTests}</span>}
        </div>
        <div className="db-panel-body">
          {stats
            ? testEntries.map(([skill, count]) => (
                <TestBar key={skill} skill={skill} count={count} total={totalTests} />
              ))
            : [1,2,3,4].map((i) => <div key={i} className="db-row-skeleton" />)}
        </div>

        {stats && (
          <div className="db-test-summary">
            {testEntries.map(([skill, count]) => {
              const meta = SKILL_META[skill];
              return (
                <div key={skill} className="db-test-chip" style={{ background: meta?.light, color: meta?.color }}>
                  {meta?.label[0]} <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
