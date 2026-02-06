// frontend/src/styles/themes.js
export const THEMES = {
  default: {
    label: "Standard",
    tokens: {
      pageBg: "#0b0b0c",
      panelBg: "rgba(20, 20, 22, 0.55)",
      panelBorder: "rgba(233, 216, 166, 0.14)",

      textMain: "rgba(245, 239, 220, 0.92)",
      textDim: "rgba(233, 216, 166, 0.70)",
      textGold: "#e9d8a6",

      goldLine: "rgba(233, 216, 166, 0.18)",
    },
  },

  gryffindor: {
    label: "Gryffindor",
    tokens: {
      pageBg: "#0b0b0c",
      panelBg: "rgba(20, 14, 14, 0.58)",
      panelBorder: "rgba(255, 190, 120, 0.16)",

      textMain: "rgba(245, 239, 220, 0.92)",
      textDim: "rgba(255, 210, 170, 0.70)",
      textGold: "#ffb86b",

      goldLine: "rgba(255, 184, 107, 0.18)",
    },
  },

  slytherin: {
    label: "Slytherin",
    tokens: {
      pageBg: "#070a09",
      panelBg: "rgba(12, 20, 16, 0.58)",
      panelBorder: "rgba(120, 255, 190, 0.12)",

      textMain: "rgba(235, 245, 240, 0.92)",
      textDim: "rgba(175, 240, 210, 0.70)",
      textGold: "#7CFFB6",

      goldLine: "rgba(124, 255, 182, 0.18)",
    },
  },

  ravenclaw: {
    label: "Ravenclaw",
    tokens: {
      pageBg: "#07080c",
      panelBg: "rgba(14, 16, 24, 0.60)",
      panelBorder: "rgba(140, 180, 255, 0.14)",

      textMain: "rgba(235, 240, 250, 0.92)",
      textDim: "rgba(180, 205, 255, 0.72)",
      textGold: "#8FB6FF",

      goldLine: "rgba(143, 182, 255, 0.18)",
    },
  },

  hufflepuff: {
    label: "Hufflepuff",
    tokens: {
      pageBg: "#0b0b0c",
      panelBg: "rgba(18, 18, 14, 0.60)",
      panelBorder: "rgba(255, 230, 120, 0.16)",

      textMain: "rgba(245, 239, 220, 0.92)",
      textDim: "rgba(255, 240, 180, 0.70)",
      textGold: "#FFE27A",

      goldLine: "rgba(255, 226, 122, 0.18)",
    },
  },
};

export const DEFAULT_THEME_KEY = "default";

export function applyTheme(themeKey) {
  const t = THEMES[themeKey] || THEMES[DEFAULT_THEME_KEY];
  const root = document.documentElement;

  for (const [k, v] of Object.entries(t.tokens)) {
    root.style.setProperty(`--hp-${k}`, v);
  }
}

export function themeStorageKey(email) {
  return `hpTheme:${(email || "guest").toLowerCase()}`;
}

export function loadThemeKey(email) {
  try {
    return localStorage.getItem(themeStorageKey(email)) || DEFAULT_THEME_KEY;
  } catch {
    return DEFAULT_THEME_KEY;
  }
}

export function saveThemeKey(email, key) {
  try {
    localStorage.setItem(themeStorageKey(email), key);
  } catch {}
}
