import { API_BASE_URL } from "../lib/api";

export const AVATAR_PALETTES = [
  { bg: "#e0e7ff", color: "#3730a3" },
  { bg: "#dcfce7", color: "#166534" },
  { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#fed7aa", color: "#9a3412" },
  { bg: "#dbeafe", color: "#1e40af" },
  { bg: "#f3e8ff", color: "#7e22ce" },
];

export function avatarStyle(name) {
  const code = (name?.toUpperCase().charCodeAt(0) ?? 65) - 65;
  return AVATAR_PALETTES[Math.abs(code) % AVATAR_PALETTES.length];
}

export function resolveAvatarUrl(avatarUrl) {
  return /^https?:\/\//.test(avatarUrl) ? avatarUrl : `${API_BASE_URL}${avatarUrl}`;
}

export function Avatar({ name, avatarUrl, size = 32 }) {
  const { bg, color } = avatarStyle(name);
  if (avatarUrl) {
    return (
      <img
        className="avatar"
        src={resolveAvatarUrl(avatarUrl)}
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
