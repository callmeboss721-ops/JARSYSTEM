# JAGUAR SPK Brand ID 2026 palette

## Source and approved scope

Palette reference: `attached_assets/JAGUAR_SPK_—_Official_Brand_ID_UI_UX_Asset_Pack_(37_SVG_+_PNG_1795465265229.html`.

The owner specified the implementation values below for the JAGUAR SPK web app. The app uses the official source asset as provenance and the explicitly confirmed application values as the token values.

The approved scope is all customer-facing routes and the staff/owner counter and dashboard routes in `artifacts/jaguar-house`. Other artifacts and the Design System v3 defaults remain unchanged.

## Tokens

The single source of truth is `tokens.json` under `color.brandId2026`. Generated CSS and TypeScript outputs must only be changed by running the token generator.

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#08120A` | Deep Jaguar Black canvas |
| `surface` | `#0D1F10` | Card and panel surface |
| `neon` | `#A6FF00` | High-emphasis action and focus |
| `jaguarGreen` | `#00A651` | Brand green and category identity |
| `gold` | `#FFC400` | Kratom category and reward emphasis |
| `text` | `#FFFFFF` | Primary text and QR quiet zone |
| `border` | `#1C3A22` | Structural boundaries |
| `muted` | `#A7C4AD` | Secondary text |

## Application

Use the generated semantic mapping by setting `data-brand-theme="2026"` on the JAGUAR SPK app root. Do not re-declare these color values in the consuming app. V3 remains the default for any surface outside the approved scope.

