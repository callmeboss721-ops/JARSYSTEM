# JAGUAR SPK Design System v3 reference

- Source file: `attached_assets/jaguar-spk-design-system-v3_1794533773590.html`
- Kind: user-provided visual and content reference for the design-system
  artifact; not an app or deployment source.
- The uploaded JAGUAR MEMBER three-step poster is shown on the design-system
  overview as provided; a compressed WebP copy keeps loading light without
  cropping the artwork.
- Provenance: v3 describes a Thai-first JAGUAR SPK DRINK design system with
  searchable icons/signature marks, interactive controls, ten-slot collecting
  tracks, rank emblems, and mobile tabs.
- Palette reference: `#050505`, `#0D140F`, `#00FF9D`, `#D4AF37`, `#E5C04A`.
  Package DTCG light/dark roles map green to primary actions and gold to
  secondary/emphasis.
- Port status: React implementations and lazy preview stories are implemented
  in the design-system package. Existing Jaguar logo and rank artwork remain
  unchanged.
- Safety boundary: the uploaded HTML is read only as design/content input. Its
  script is not copied, served, evaluated, or executed. React renders
  components; no `dangerouslySetInnerHTML` is used.
- Business boundary: all newly added controls are local demo behavior. The
  collecting track demonstrates ten positions and a ready state; it does not
  encode redemption rules. Rank names/order are existing source catalog
  content; no tier benefits, eligibility thresholds, or new business rules are
  inferred from the HTML.
- Current implementation details:
  - Icon catalog: 32 everyday icons, 12 signature icons, filtering, size
    selection, and clipboard feedback.
  - Controls: loading/success button states, icon controls, switch, dropdown,
    and segmented selection.
  - Track: independent local demo counters, separate club accents, accessible
    labels, and ready-to-redeem state.
  - Ranks: selectable ten-rank shield emblems with level-specific line glyphs
    and color accents; the original `RankEmblem` artwork API remains available.
  - Mobile navigation: five selectable tabs; scan selection does not open a
    camera.
