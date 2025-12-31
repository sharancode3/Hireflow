export type ThemeName = "light" | "soft-dark" | "high-contrast";

export const THEME_STORAGE_KEY = "talvion_theme_v1";

export function isThemeName(v: unknown): v is ThemeName {
  return v === "light" || v === "soft-dark" || v === "high-contrast";
}

export function loadTheme(): ThemeName {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeName(raw)) return raw;
  return "light";
}

export function saveTheme(theme: ThemeName) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyTheme(theme: ThemeName) {
  const el = document.documentElement;
  el.setAttribute("data-theme", theme);
}
