import { useEffect, useRef, useState } from "react";
import { adminFetch, adminUpload } from "../lib/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SKILL_LABELS = {
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};

const HAS_TEXT_FIELDS = (skill) => skill === "READING" || skill === "LISTENING";

function jsonTemplate(skill) {
  const base = {
    title: skill === "LISTENING" ? "Listening Test 1" : "Reading Test 1",
    passages: [
      {
        id: 1,
        title: skill === "LISTENING" ? "Part 1" : "Passage 1",
        content: skill === "LISTENING" ? "Transcript text goes here..." : "Passage text goes here...",
        questions: [
          { id: 1, type: "true-false-not-given", question: "Question text...", answer: "TRUE" },
        ],
      },
    ],
    questionGroups: [
      {
        from: 1,
        to: 6,
        instruction:
          "Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.",
      },
    ],
  };
  if (skill === "LISTENING") {
    const { title, ...rest } = base;
    return JSON.stringify({ title, audioUrl: "/audio/listening-test-1.mp3", ...rest }, null, 2);
  }
  return JSON.stringify(base, null, 2);
}

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function emptyForm(skill) {
  if (HAS_TEXT_FIELDS(skill)) {
    return { id: null, slug: "" };
  }
  return { id: null, slug: "", title: "", prompt: "", minWords: "", taskNumber: "2", imageUrl: "" };
}

export function TestsBySkill({ skill }) {
  const [tests, setTests]       = useState([]);
  const [error, setError]       = useState(null);
  const [form, setForm]         = useState(emptyForm(skill));
  const [formError, setFormError] = useState(null);
  const [jsonText, setJsonText] = useState(jsonTemplate(skill));
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState(null);
  const imgInputRef = useRef(null);

  const load = () => {
    adminFetch(`/api/admin/tests?skill=${skill}`)
      .then((data) => setTests(data.tests))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    setForm(emptyForm(skill));
    setFormError(null);
    setJsonText(jsonTemplate(skill));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill]);

  const startEdit = (test) => {
    if (HAS_TEXT_FIELDS(skill)) {
      setForm({ id: test.id, slug: test.slug });
      // inject title into JSON so the editor shows it
      const content = typeof test.content === "string" ? JSON.parse(test.content) : test.content;
      setJsonText(JSON.stringify({ title: test.title, ...content }, null, 2));
    } else {
      setForm({
        id: test.id,
        slug: test.slug,
        title: test.title,
        prompt: test.content.prompt ?? "",
        minWords: test.content.minWords ?? "",
        taskNumber: String(test.content.taskNumber ?? "2"),
        imageUrl: test.content.imageUrl ?? "",
      });
    }
    setFormError(null);
  };

  const startCreate = () => {
    setForm(emptyForm(skill));
    setJsonText(jsonTemplate(skill));
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    let title, content;

    if (HAS_TEXT_FIELDS(skill)) {
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        setFormError("JSON yaroqsiz. Saqlashdan oldin xatoni tuzating.");
        return;
      }
      title = parsed.title ?? parsed.passages?.[0]?.title;
      if (!title?.trim()) {
        setFormError("JSON ichida root \"title\" yoki passages[0].title bo'lishi shart.");
        return;
      }
      // auto-generate slug from title on create; keep existing slug on edit
      if (!form.id) {
        form.slug = slugify(title);
      }
      // strip title out of stored content to avoid duplication
      const { title: _t, ...rest } = parsed;
      content = rest;
    } else {
      title = form.title;
      content = {
        prompt: form.prompt,
        minWords: Number(form.minWords) || undefined,
        taskNumber: Number(form.taskNumber) || 2,
        ...(String(form.taskNumber) === "1" && form.imageUrl ? { imageUrl: form.imageUrl } : {}),
      };
    }

    try {
      if (form.id) {
        await adminFetch(`/api/admin/tests/${form.id}`, {
          method: "PATCH",
          body: { skill, slug: form.slug, title, content },
        });
      } else {
        await adminFetch("/api/admin/tests", {
          method: "POST",
          body: { skill, slug: form.slug, title, content },
        });
      }
      startCreate();
      load();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    setImgError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await adminUpload("/api/admin/upload", fd);
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      setImgError(err.message);
    } finally {
      setImgUploading(false);
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this test?")) return;
    await adminFetch(`/api/admin/tests/${id}`, { method: "DELETE" });
    load();
  };

  if (error) return <p className="error">{error}</p>;

  const label = SKILL_LABELS[skill];
  const editingTitle = HAS_TEXT_FIELDS(skill)
    ? (() => { try { return JSON.parse(jsonText).title || ""; } catch { return ""; } })()
    : form.title;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{label} testlar</h1>
          <p className="muted">{label} testlarini boshqaring.</p>
        </div>
        <span className={`badge badge-${skill.toLowerCase()}`}>{label}</span>
      </div>

      {/* Tests list */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Slug</th>
              <th>Title</th>
              {skill === "WRITING" && <th>Task</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 && (
              <tr>
                <td colSpan={skill === "WRITING" ? 4 : 3} className="muted empty-cell">
                  Hali {label.toLowerCase()} test yo'q.
                </td>
              </tr>
            )}
            {tests.map((test) => (
              <tr key={test.id}>
                <td>{test.slug}</td>
                <td>{test.title}</td>
                {skill === "WRITING" && (
                  <td>
                    <span className={`badge ${test.content?.taskNumber === 1 ? "badge-listening" : "badge-reading"}`}>
                      Task {test.content?.taskNumber ?? 2}
                    </span>
                  </td>
                )}
                <td className="actions">
                  <button type="button" className="ghost" onClick={() => startEdit(test)}>Edit</button>
                  <button type="button" className="danger" onClick={() => handleDelete(test.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / edit form */}
      <h2 className="section-title">
        {form.id ? `Tahrirlash: ${editingTitle}` : `Yangi ${label.toLowerCase()} test`}
      </h2>
      <form className="card form-card" onSubmit={handleSubmit}>

        {!HAS_TEXT_FIELDS(skill) && (
          <label style={{ maxWidth: 320 }}>
            Slug
            <input
              placeholder="writing-task-1"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </label>
        )}

        {HAS_TEXT_FIELDS(skill) ? (
          <>
            <label>
              <span>
                Content JSON&nbsp;
                <span className="muted" style={{ fontWeight: 400 }}>
                  — test nomi <code>title</code> yoki <code>passages[0].title</code>dan olinadi
                </span>
              </span>
              <textarea
                rows={28}
                className="code"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                spellCheck={false}
              />
            </label>
          </>
        ) : (
          <>
            <label style={{ maxWidth: 320 }}>
              Sarlavha (title)
              <input
                placeholder="Writing Task 1 — Bar chart"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>

            <div className="form-grid">
              <label>
                Task raqami
                <select
                  value={form.taskNumber ?? "2"}
                  onChange={(e) => setForm({ ...form, taskNumber: e.target.value, imageUrl: "" })}
                >
                  <option value="1">Task 1 — grafik / jadval / tasvir</option>
                  <option value="2">Task 2 — esse / argument</option>
                </select>
              </label>
              <label>
                Minimum so'z
                <input
                  type="number"
                  min={0}
                  value={form.minWords}
                  onChange={(e) => setForm({ ...form, minWords: e.target.value })}
                />
              </label>
            </div>

            {String(form.taskNumber) === "1" && (
              <div className="writing-img-block">
                <p className="writing-img-label">
                  Task 1 rasmi <span className="muted">(o'quvchi ko'radi)</span>
                </p>
                {form.imageUrl ? (
                  <div className="writing-img-preview">
                    <img src={`${API_BASE_URL}${form.imageUrl}`} alt="Task 1" />
                    <button
                      type="button"
                      className="danger"
                      onClick={() => setForm({ ...form, imageUrl: "" })}
                    >
                      Rasmni olib tashlash
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={imgInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleImageUpload}
                      disabled={imgUploading}
                      style={{ display: "none" }}
                    />
                    <div className="writing-img-drop" onClick={() => imgInputRef.current?.click()}>
                      {imgUploading ? (
                        <span className="muted">Yuklanmoqda…</span>
                      ) : (
                        <>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <span>Rasm yuklash uchun bosing</span>
                          <span className="muted" style={{ fontSize: "0.75rem" }}>PNG, JPG, WEBP — maks 10 MB</span>
                        </>
                      )}
                    </div>
                  </>
                )}
                {imgError && <p className="error">{imgError}</p>}
              </div>
            )}

            <label>
              Prompt
              <textarea
                rows={6}
                placeholder={
                  String(form.taskNumber) === "1"
                    ? "Grafik/jadval haqida vazifani kiriting..."
                    : "Esse mavzusini kiriting..."
                }
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              />
            </label>
          </>
        )}

        {formError && <p className="error">{formError}</p>}
        <div className="row">
          <button type="submit">
            {form.id ? "Saqlash" : `${label} test yaratish`}
          </button>
          {form.id && (
            <button type="button" className="ghost" onClick={startCreate}>
              Bekor qilish
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
