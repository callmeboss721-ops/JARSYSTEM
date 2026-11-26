# JAGUAR SPK Brand ID 2026 · Clean Executive Dark

## Source and approved scope

Palette reference: `attached_assets/JAGUAR_SPK_—_Official_Brand_ID_UI_UX_Asset_Pack_(37_SVG_+_PNG_1795465265229.html`.

The owner selected a calmer, cleaner visual tone for the JAGUAR SPK web app. These values supersede the earlier accent-heavy Brand ID palette; the supplied logo and mascot artwork remain unchanged.

The approved scope is all customer-facing routes and the staff/owner counter and dashboard routes in `artifacts/jaguar-house`. Other artifacts and the Design System v3 defaults remain unchanged.

## Tokens

The single source of truth is `tokens.json` under `color.brandId2026`. Generated CSS and TypeScript outputs must only be changed by running the token generator.

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#090D0B` | Deep matte obsidian canvas |
| `surface` | `#101713` | Card and panel surface |
| `surfaceRaised` | `#16201B` | Secondary elevated surface |
| `border` | `#232A26` | Subtle white-tinted boundaries |
| `neon` | `#A6FF00` | Keyboard focus and small indicators only |
| `jaguarGreen` | `#22C572` | Cannabis accents, active and success states |
| `gold` | `#E8BE42` | Primary actions, Kratom highlights and reward totals |
| `text` | `#F5F7F5` | Primary text |
| `muted` | `#9AA8A0` | Secondary text; at least 4.5:1 on the dark surfaces |
| `qrQuietZone` | `#FFFFFF` | Pure white QR canvas and quiet zone |

## Application

Use the generated semantic mapping by setting `data-brand-theme="2026"` on the JAGUAR SPK app root. Do not re-declare these color values in the consuming app. V3 remains the default for any surface outside the approved scope.

Use flat, quiet surfaces with subtle borders. Keep ambient gradients and heavy shadows out of the app shell, and retain the supplied logos and mascots without cropping.

