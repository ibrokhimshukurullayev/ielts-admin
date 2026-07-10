import { useState } from "react";
import { NavLink, Route, BrowserRouter, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { TestsBySkill } from "./pages/TestsBySkill";
import { Users } from "./pages/Users";
import { Teachers } from "./pages/Teachers";
import { clearAdminKey, getAdminKey } from "./lib/api";

function Layout({ onLogout }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">PZ</span>
          <h2>Prep<span>Zone</span> Admin</h2>
        </div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>

          <span className="nav-group-label">Tests</span>
          <NavLink to="/tests/reading">Reading</NavLink>
          <NavLink to="/tests/listening">Listening</NavLink>
          <NavLink to="/tests/writing">Writing</NavLink>
          <NavLink to="/tests/speaking">Speaking</NavLink>

          <span className="nav-group-label">Other</span>
          <NavLink to="/users">Users</NavLink>
          <NavLink to="/teachers">Teachers</NavLink>
        </nav>
        <button type="button" onClick={onLogout} className="logout">Log out</button>
      </aside>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tests/reading" element={<TestsBySkill skill="READING" />} />
          <Route path="/tests/listening" element={<TestsBySkill skill="LISTENING" />} />
          <Route path="/tests/writing" element={<TestsBySkill skill="WRITING" />} />
          <Route path="/tests/speaking" element={<TestsBySkill skill="SPEAKING" />} />
          <Route path="/users" element={<Users />} />
          <Route path="/teachers" element={<Teachers />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getAdminKey()));

  const handleLogout = () => {
    clearAdminKey();
    setAuthed(false);
  };

  return (
    <BrowserRouter>
      {authed ? <Layout onLogout={handleLogout} /> : <Login onSuccess={() => setAuthed(true)} />}
    </BrowserRouter>
  );
}
