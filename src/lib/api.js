export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const KEY_STORAGE = "ielts_admin_key";

export function getAdminKey() {
  return sessionStorage.getItem(KEY_STORAGE) ?? "";
}

export function setAdminKey(key) {
  sessionStorage.setItem(KEY_STORAGE, key);
}

export function clearAdminKey() {
  sessionStorage.removeItem(KEY_STORAGE);
}

export async function adminFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": getAdminKey(),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    clearAdminKey();
    throw new Error("Invalid admin key.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }
  return data;
}

export async function adminUpload(path, formData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "x-admin-key": getAdminKey() },
    body: formData,
  });

  if (response.status === 401) {
    clearAdminKey();
    throw new Error("Invalid admin key.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }
  return data;
}

export async function verifyAdminKey(key) {
  const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers: { "x-admin-key": key },
  });
  return response.ok;
}
