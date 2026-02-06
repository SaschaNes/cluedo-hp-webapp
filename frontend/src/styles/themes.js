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

      // Section header (wie TopBar, aber leicht “tiefer”)
      headerBgTop: "rgba(32,32,36,0.92)",
      headerBgBottom: "rgba(14,14,16,0.92)",
      headerBorder: "rgba(233, 216, 166, 0.18)",

      // Row colors (fix falsch bleibt rot in ALLEN themes)
      rowNoBg: "rgba(255, 35, 35, 0.16)",
      rowNoText: "#ffb3b3",
      rowNoBorder: "rgba(255,35,35,0.55)",

      rowOkBg: "rgba(0, 190, 80, 0.16)",
      rowOkText: "#baf3c9",
      rowOkBorder: "rgba(0,190,80,0.55)",

      rowMaybeBg: "rgba(140, 140, 140, 0.12)",
      rowMaybeText: "rgba(233,216,166,0.85)",
      rowMaybeBorder: "rgba(233,216,166,0.22)",

      rowEmptyBg: "rgba(255,255,255,0.06)",
      rowEmptyText: "rgba(233,216,166,0.75)",
      rowEmptyBorder: "rgba(0,0,0,0)",

      // Background
      bgImage: "url('/bg/marauders-map-blur.jpg')",
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

      headerBgTop: "rgba(42,18,18,0.92)",
      headerBgBottom: "rgba(18,10,10,0.92)",
      headerBorder: "rgba(255, 184, 107, 0.22)",

      rowNoBg: "rgba(255, 35, 35, 0.16)",
      rowNoText: "#ffb3b3",
      rowNoBorder: "rgba(255,35,35,0.55)",

      rowOkBg: "rgba(255, 184, 107, 0.16)",
      rowOkText: "#ffd2a8",
      rowOkBorder: "rgba(255,184,107,0.55)",

      rowMaybeBg: "rgba(140, 140, 140, 0.04)",
      rowMaybeText: "rgba(255,210,170,0.85)",
      rowMaybeBorder: "rgba(255,184,107,0.22)",

      rowEmptyBg: "rgba(255,255,255,0.06)",
      rowEmptyText: "rgba(255,210,170,0.75)",
      rowEmptyBorder: "rgba(0,0,0,0)",

      // Background
      bgImage: "url('/bg/gryffindor.png')",
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

      headerBgTop: "rgba(14,28,22,0.92)",
      headerBgBottom: "rgba(10,14,12,0.92)",
      headerBorder: "rgba(124, 255, 182, 0.22)",

      rowNoBg: "rgba(255, 35, 35, 0.16)",
      rowNoText: "#ffb3b3",
      rowNoBorder: "rgba(255,35,35,0.55)",

      rowOkBg: "rgba(124, 255, 182, 0.16)",
      rowOkText: "rgba(190,255,220,0.92)",
      rowOkBorder: "rgba(124,255,182,0.55)",

      rowMaybeBg: "rgba(120, 255, 190, 0.02)",
      rowMaybeText: "rgba(175,240,210,0.85)",
      rowMaybeBorder: "rgba(120,255,190,0.22)",

      rowEmptyBg: "rgba(255,255,255,0.04)",
      rowEmptyText: "rgba(175,240,210,0.75)",
      rowEmptyBorder: "rgba(0,0,0,0)",

      // Background
      bgImage: "url('/bg/slytherin.png')",
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

      headerBgTop: "rgba(18,22,40,0.92)",
      headerBgBottom: "rgba(10,12,20,0.92)",
      headerBorder: "rgba(143, 182, 255, 0.22)",

      rowNoBg: "rgba(255, 35, 35, 0.16)",
      rowNoText: "#ffb3b3",
      rowNoBorder: "rgba(255,35,35,0.55)",

      rowOkBg: "rgba(143, 182, 255, 0.16)",
      rowOkText: "rgba(210,230,255,0.92)",
      rowOkBorder: "rgba(143,182,255,0.55)",

      rowMaybeBg: "rgba(140, 180, 255, 0.04)",
      rowMaybeText: "rgba(180,205,255,0.85)",
      rowMaybeBorder: "rgba(143,182,255,0.22)",

      rowEmptyBg: "rgba(255,255,255,0.06)",
      rowEmptyText: "rgba(180,205,255,0.78)",
      rowEmptyBorder: "rgba(0,0,0,0)",

      // Background
      bgImage: "url('/bg/ravenclaw.png')",
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

      headerBgTop: "rgba(34,30,14,0.92)",
      headerBgBottom: "rgba(16,14,8,0.92)",
      headerBorder: "rgba(255, 226, 122, 0.22)",

      rowNoBg: "rgba(255, 35, 35, 0.16)",
      rowNoText: "#ffb3b3",
      rowNoBorder: "rgba(255,35,35,0.55)",

      rowOkBg: "rgba(255, 226, 122, 0.16)",
      rowOkText: "rgba(255,240,190,0.92)",
      rowOkBorder: "rgba(255,226,122,0.55)",

      rowMaybeBg: "rgba(255, 226, 122, 0.04)",
      rowMaybeText: "rgba(255,240,180,0.85)",
      rowMaybeBorder: "rgba(255,226,122,0.22)",

      rowEmptyBg: "rgba(255,255,255,0.06)",
      rowEmptyText: "rgba(255,240,180,0.78)",
      rowEmptyBorder: "rgba(0,0,0,0)",

      // Background
      bgImage: "url('/bg/hufflepuff.png')",
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
