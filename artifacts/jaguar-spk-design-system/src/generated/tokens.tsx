/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#F9F6E7",
      "foreground": "#050505",
      "border": "#D4AF37",
      "card": "#fffefa",
      "cardForeground": "#050505",
      "popover": "#fffefa",
      "popoverForeground": "#050505",
      "primary": "#00FF9D",
      "primaryForeground": "#050505",
      "secondary": "#D4AF37",
      "secondaryForeground": "#050505",
      "muted": "#ecece5",
      "mutedForeground": "#45453C",
      "accent": "#E5C04A",
      "accentForeground": "#050505",
      "destructive": "#a7372c",
      "destructiveForeground": "#ffffff",
      "input": "#D4AF37",
      "ring": "#00FF9D",
      "chart1": "#D4AF37",
      "chart2": "#00FF9D",
      "chart3": "#E5C04A",
      "chart4": "#656f63",
      "chart5": "#c76a3f",
      "sidebar": "#ecece5",
      "sidebarForeground": "#050505",
      "sidebarBorder": "#D4AF37",
      "sidebarPrimary": "#00FF9D",
      "sidebarPrimaryForeground": "#050505",
      "sidebarAccent": "#E5C04A",
      "sidebarAccentForeground": "#050505",
      "sidebarRing": "#00FF9D"
    },
    "dark": {
      "background": "#050505",
      "foreground": "#F9F6E7",
      "border": "#16211A",
      "card": "#0D140F",
      "cardForeground": "#F9F6E7",
      "popover": "#111A14",
      "popoverForeground": "#F9F6E7",
      "primary": "#00FF9D",
      "primaryForeground": "#050505",
      "secondary": "#D4AF37",
      "secondaryForeground": "#050505",
      "muted": "#16211A",
      "mutedForeground": "#C6C8BE",
      "accent": "#E5C04A",
      "accentForeground": "#050505",
      "destructive": "#78372e",
      "destructiveForeground": "#fff4e9",
      "input": "#354139",
      "ring": "#00FF9D",
      "chart1": "#D4AF37",
      "chart2": "#00FF9D",
      "chart3": "#E5C04A",
      "chart4": "#c4cad6",
      "chart5": "#ff7a6b",
      "sidebar": "#0D140F",
      "sidebarForeground": "#F9F6E7",
      "sidebarBorder": "#16211A",
      "sidebarPrimary": "#00FF9D",
      "sidebarPrimaryForeground": "#050505",
      "sidebarAccent": "#D4AF37",
      "sidebarAccentForeground": "#050505",
      "sidebarRing": "#00FF9D"
    },
    "brandId2026": {
      "background": "#08120A",
      "surface": "#0D1F10",
      "border": "#1C3A22",
      "neon": "#A6FF00",
      "jaguarGreen": "#00A651",
      "gold": "#FFC400",
      "text": "#FFFFFF",
      "muted": "#A7C4AD"
    }
  },
  "fontFamily": {
    "sans": [
      "IBM Plex Sans Thai",
      "Bai Jamjuree",
      "sans-serif"
    ],
    "serif": [
      "Georgia",
      "serif"
    ],
    "mono": [
      "JetBrains Mono",
      "monospace"
    ]
  },
  "radius": "1rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
