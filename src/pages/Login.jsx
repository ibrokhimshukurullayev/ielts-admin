import { useState } from "react";
import { setAdminKey, verifyAdminKey } from "../lib/api";

export function Login({ onSuccess }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setChecking(true);
    try {
      const valid = await verifyAdminKey(key);
      if (!valid) {
        setError("Invalid admin key.");
        return;
      }
      setAdminKey(key);
      onSuccess();
    } catch {
      setError("Couldn't reach the API. Is the main app running?");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="card" onSubmit={handleSubmit}>
        <h1>IELTStation Admin</h1>
        <p className="muted">Enter the admin key to continue.</p>
        <input
          type="password"
          placeholder="Admin key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoFocus
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={checking}>
          {checking ? "Checking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
