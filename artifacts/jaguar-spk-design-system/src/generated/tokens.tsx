/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#f5f3ea",
      "foreground": "#1c211a",
      "border": "#d9d7c7",
      "card": "#fffefa",
      "cardForeground": "#20251e",
      "popover": "#fffefa",
      "popoverForeground": "#20251e",
      "primary": "#9b7620",
      "primaryForeground": "#17170f",
      "secondary": "#e8f0e7",
      "secondaryForeground": "#173222",
      "muted": "#ecece5",
      "mutedForeground": "#586057",
      "accent": "#ddf5e8",
      "accentForeground": "#0f432d",
      "destructive": "#a7372c",
      "destructiveForeground": "#ffffff",
      "input": "#c6c7bc",
      "ring": "#25845b",
      "chart1": "#9b7620",
      "chart2": "#1f8a64",
      "chart3": "#2fd98a",
      "chart4": "#656f63",
      "chart5": "#c76a3f",
      "sidebar": "#ecece5",
      "sidebarForeground": "#30372f",
      "sidebarBorder": "#d9d7c7",
      "sidebarPrimary": "#9b7620",
      "sidebarPrimaryForeground": "#17170f",
      "sidebarAccent": "#ddf5e8",
      "sidebarAccentForeground": "#0f432d",
      "sidebarRing": "#25845b"
    },
    "dark": {
      "background": "#040605",
      "foreground": "#eeeae0",
      "border": "#272c28",
      "card": "#0b0c12",
      "cardForeground": "#eeeae0",
      "popover": "#12141b",
      "popoverForeground": "#eeeae0",
      "primary": "#e5c04a",
      "primaryForeground": "#17170f",
      "secondary": "#1f8a64",
      "secondaryForeground": "#f4f5ee",
      "muted": "#181b19",
      "mutedForeground": "#a3a6b0",
      "accent": "#173a2d",
      "accentForeground": "#d7f3e4",
      "destructive": "#78372e",
      "destructiveForeground": "#fff4e9",
      "input": "#363c3a",
      "ring": "#2fd98a",
      "chart1": "#e5c04a",
      "chart2": "#1f8a64",
      "chart3": "#2fd98a",
      "chart4": "#c4cad6",
      "chart5": "#ff7a6b",
      "sidebar": "#0b0c12",
      "sidebarForeground": "#eeeae0",
      "sidebarBorder": "#272c28",
      "sidebarPrimary": "#e5c04a",
      "sidebarPrimaryForeground": "#17170f",
      "sidebarAccent": "#173a2d",
      "sidebarAccentForeground": "#d7f3e4",
      "sidebarRing": "#2fd98a"
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
