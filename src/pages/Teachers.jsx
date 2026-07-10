import { useEffect, useRef, useState } from "react";
import { adminFetch, adminUpload } from "../lib/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

function Avatar({ name, avatarUrl, size = 32 }) {
  const { bg, color } = avatarStyle(name);
  if (avatarUrl) {
    return (
      <img
        className="avatar"
        src={`${API_BASE_URL}${avatarUrl}`}
        alt={name}
        style={{ width: size, height: size, objectFit: "cover" }}
      />
    );
  }
  return (
    <span
      className="avatar"
      style={{ background: bg, color, width: size, height: size, fontSize: size * 0.34 + "px" }}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

function GroupCard({ group, teacherStudents, onRenamed, onDeleted, onMembersChanged }) {
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(group.name);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const renameRef = useRef(null);

  const startRename = () => {
    setRenameVal(group.name);
    setRenaming(true);
    setTimeout(() => renameRef.current?.select(), 10);
  };

  const commitRename = async () => {
    if (!renameVal.trim() || renameVal.trim() === group.name) {
      setRenaming(false);
      return;
    }
    setSaving(true);
    try {
      await adminFetch(`/api/admin/groups/${group.id}`, {
        method: "PATCH",
        body: { name: renameVal.trim() },
      });
      setRenaming(false);
      onRenamed(group.id, renameVal.trim());
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`"${group.name}" guruhini o'chirasizmi?`)) return;
    try {
      await adminFetch(`/api/admin/groups/${group.id}`, { method: "DELETE" });
      onDeleted(group.id);
    } catch (e) { setErr(e.message); }
  };

  const addMember = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    try {
      const { member } = await adminFetch(`/api/admin/groups/${group.id}/members`, {
        method: "POST",
        body: { studentId: selectedStudent },
      });
      setSelectedStudent("");
      setAddingMember(false);
      onMembersChanged(group.id, [...group.members, member]);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const removeMember = async (studentId) => {
    try {
      await adminFetch(`/api/admin/groups/${group.id}/members/${studentId}`, { method: "DELETE" });
      onMembersChanged(group.id, group.members.filter((m) => m.student.id !== studentId));
    } catch (e) { setErr(e.message); }
  };

  const memberIds = new Set(group.members.map((m) => m.student.id));
  const available = teacherStudents.filter((s) => !memberIds.has(s.id));

  return (
    <div className="grp-card">
      <div className="grp-card-top">
        <div className="grp-icon">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.5 3A1.5 1.5 0 0 1 3 1.5h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 10.12 3.5H13A1.5 1.5 0 0 1 14.5 5v7A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12V3z"/>
          </svg>
        </div>
        <div className="grp-card-title">
          {renaming ? (
            <input
              ref={renameRef}
              className="grp-rename-input"
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              disabled={saving}
            />
          ) : (
            <span className="grp-name" onDoubleClick={startRename} title="Nomni o'zgartirish uchun ikki marta bosing">
              {group.name}
            </span>
          )}
          <span className="grp-count">{group.members.length} o'q.</span>
        </div>
        <div className="grp-card-actions">
          <button type="button" className="icon-btn" title="Nom o'zgartirish" onClick={startRename}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-2.5-2.5zM14 6.207 10.293 2.5 3.5 9.293V10.5h1.207L14 3.707zM1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
            </svg>
          </button>
          <button type="button" className="icon-btn danger-icon" title="Guruhni o'chirish" onClick={handleDelete}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
          </button>
        </div>
      </div>

      {err && <p className="grp-err">{err}</p>}

      <div className="grp-members">
        {group.members.length === 0 ? (
          <p className="grp-empty">Guruhda hech kim yo'q</p>
        ) : (
          group.members.map((m) => (
            <div key={m.id} className="grp-member-row">
              <Avatar name={m.student.name} size={24} />
              <span className="grp-member-name">{m.student.name}</span>
              <span className="grp-member-username">@{m.student.username}</span>
              <button
                type="button"
                className="grp-remove-btn"
                title="Guruhdan chiqarish"
                onClick={() => removeMember(m.student.id)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="grp-add-area">
        {addingMember ? (
          <div className="grp-add-row">
            <select
              autoFocus
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">O'quvchi tanlang...</option>
              {available.map((s) => (
                <option key={s.id} value={s.id}>{s.name} · @{s.username}</option>
              ))}
            </select>
            <button type="button" onClick={addMember} disabled={!selectedStudent || saving}>
              Qo'sh
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => { setAddingMember(false); setSelectedStudent(""); }}
            >
              Bekor
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="grp-add-btn"
            onClick={() => setAddingMember(true)}
            disabled={available.length === 0}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            {available.length === 0 ? "Barcha o'quvchilar qo'shilgan" : "O'quvchi qo'shish"}
          </button>
        )}
      </div>
    </div>
  );
}

function GroupPanel({ teacher, onClose }) {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const d = await adminFetch(`/api/admin/teachers/${teacher.id}/groups`);
      setGroups(d.groups);
      setStudents(d.students);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [teacher.id]);

  const createGroup = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { group } = await adminFetch(`/api/admin/teachers/${teacher.id}/groups`, {
        method: "POST",
        body: { name: newName.trim() },
      });
      setGroups((g) => [...g, { ...group, members: [] }]);
      setNewName("");
    } catch (e) { setErr(e.message); }
    finally { setCreating(false); }
  };

  const handleRenamed = (id, name) =>
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, name } : g)));

  const handleDeleted = (id) =>
    setGroups((gs) => gs.filter((g) => g.id !== id));

  const handleMembersChanged = (id, members) =>
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, members } : g)));

  return (
    <div className="grp-panel">
      <div className="grp-panel-header">
        <div className="grp-panel-title">
          <Avatar name={teacher.name} avatarUrl={teacher.avatarUrl} size={28} />
          <div>
            <span className="grp-panel-teacher">{teacher.name}</span>
            <span className="grp-panel-sub">guruhlarini boshqarish</span>
          </div>
        </div>
        <form className="grp-new-form" onSubmit={createGroup}>
          <input
            placeholder="Yangi guruh nomi..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" disabled={creating || !newName.trim()}>
            {creating ? "…" : "+ Guruh"}
          </button>
        </form>
        <button type="button" className="grp-close-btn" onClick={onClose} title="Yopish">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>

      <div className="grp-panel-body">
        {err && <p className="grp-err" style={{ marginBottom: "0.75rem" }}>{err}</p>}
        {loading ? (
          <div className="grp-loading">
            <span className="grp-spinner" />
            <span>Yuklanmoqda...</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="grp-empty-state">
            <div className="grp-empty-icon">
              <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3zm-8.322.12C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139z"/>
              </svg>
            </div>
            <p>Hali guruh yo'q</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-3)", marginTop: "0.2rem" }}>
              Yuqoridagi maydonga nom yozing va guruh yarating
            </p>
          </div>
        ) : (
          <div className="grp-grid">
            {groups.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                teacherStudents={students}
                onRenamed={handleRenamed}
                onDeleted={handleDeleted}
                onMembersChanged={handleMembersChanged}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(null);
  const avatarInputRef = useRef(null);
  const avatarTargetId = useRef(null);

  const load = () =>
    adminFetch("/api/admin/teachers")
      .then((d) => setTeachers(d.teachers))
      .catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCreating(true);
    try {
      const { teacher } = await adminFetch("/api/admin/teachers", { method: "POST", body: form });
      setSuccess(`"@${form.username}" muvaffaqiyatli yaratildi.`);
      setForm({ name: "", username: "", email: "", password: "" });
      setTeachers((prev) => [...prev, { ...teacher, groupCount: 0, studentCount: 0 }]);
    } catch (err) { setError(err.message); }
    finally { setCreating(false); }
  };

  const openAvatarPicker = (e, teacherId) => {
    e.stopPropagation();
    avatarTargetId.current = teacherId;
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    const teacherId = avatarTargetId.current;
    if (!file || !teacherId) return;
    setAvatarUploading(teacherId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await adminUpload("/api/admin/upload", fd);
      const { teacher } = await adminFetch(`/api/admin/teachers/${teacherId}`, {
        method: "PATCH",
        body: { avatarUrl: url },
      });
      setTeachers((prev) => prev.map((t) => (t.id === teacherId ? { ...t, avatarUrl: teacher.avatarUrl } : t)));
    } catch (err) {
      alert(err.message);
    } finally {
      setAvatarUploading(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const toggle = (id) => setExpanded((p) => (p === id ? null : id));

  return (
    <div className="page">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={handleAvatarChange}
      />
      <div className="page-header">
        <div>
          <h1>O'qituvchilar</h1>
          <p className="muted">O'qituvchi akkauntlarini yarating va guruhlarini boshqaring.</p>
        </div>
        <div className="pill pill-neutral">{teachers.length} ta</div>
      </div>

      {/* Add teacher */}
      <div className="form-section form-card">
        <div className="form-section-header">
          <h2>Yangi o'qituvchi qo'shish</h2>
        </div>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <label>
              To'liq ism
              <input required placeholder="Masalan: Aziz Karimov"
                value={form.name} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label>
              Username <span className="hint">(kirish uchun)</span>
              <input required placeholder="teacher_aziz"
                value={form.username}
                onChange={(e) => set("username", e.target.value.trim().toLowerCase())} />
            </label>
            <label>
              Email <span className="hint">(ixtiyoriy)</span>
              <input type="email" placeholder="aziz@school.uz"
                value={form.email} onChange={(e) => set("email", e.target.value)} />
            </label>
            <label>
              Parol
              <input type="password" required placeholder="Kamida 6 ta belgi"
                value={form.password} onChange={(e) => set("password", e.target.value)} />
            </label>
          </div>
          {error   && <p className="error">{error}</p>}
          {success && <p className="success-msg">{success}</p>}
          <div className="row" style={{ marginTop: "1.25rem" }}>
            <button type="submit" disabled={creating}>
              {creating ? "Yaratilmoqda..." : "O'qituvchi yaratish"}
            </button>
          </div>
        </form>
      </div>

      {/* Teacher list */}
      <p className="section-title">Mavjud o'qituvchilar</p>

      {teachers.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--text-3)", padding: "2.5rem" }}>
          Hali o'qituvchi yo'q — yuqorida birinchisini yarating.
        </div>
      ) : (
        <div className="teacher-list">
          {teachers.map((t) => {
            const isOpen = expanded === t.id;
            const { bg, color } = avatarStyle(t.name);
            return (
              <div key={t.id} className={`teacher-card${isOpen ? " teacher-card--open" : ""}`}>
                <div
                  className="teacher-card-row"
                  onClick={() => toggle(t.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && toggle(t.id)}
                >
                  <div className="teacher-identity">
                    <div className="teacher-avatar-wrap">
                      {t.avatarUrl ? (
                        <img
                          className="avatar"
                          src={`${API_BASE_URL}${t.avatarUrl}`}
                          alt={t.name}
                          style={{ width: 38, height: 38, objectFit: "cover" }}
                        />
                      ) : (
                        <span className="avatar" style={{ background: bg, color, width: 38, height: 38, fontSize: "1rem" }}>
                          {t.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                      <button
                        type="button"
                        className="avatar-upload-btn"
                        title="Rasm yuklash"
                        disabled={avatarUploading === t.id}
                        onClick={(e) => openAvatarPicker(e, t.id)}
                      >
                        {avatarUploading === t.id ? (
                          <span style={{ fontSize: "0.55rem" }}>…</span>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                            <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    <div>
                      <div className="teacher-name">{t.name}</div>
                      <div className="teacher-meta">@{t.username}{t.email ? ` · ${t.email}` : ""}</div>
                    </div>
                  </div>

                  <div className="teacher-stats">
                    <div className="teacher-stat">
                      <span className="teacher-stat-num">{t.studentCount}</span>
                      <span className="teacher-stat-label">o'quvchi</span>
                    </div>
                    <div className="teacher-stat-divider" />
                    <div className="teacher-stat">
                      <span className="teacher-stat-num">{t.groupCount ?? 0}</span>
                      <span className="teacher-stat-label">guruh</span>
                    </div>
                  </div>

                  <div className="teacher-date">{new Date(t.createdAt).toLocaleDateString("uz-UZ")}</div>

                  <div className={`teacher-expand-btn${isOpen ? " open" : ""}`}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </div>
                </div>

                {isOpen && (
                  <GroupPanel teacher={t} onClose={() => setExpanded(null)} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
