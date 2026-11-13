# V3 icon catalog

- Visual/content source: user-provided `jaguar-spk-design-system-v3_1794533773590.html`;
  see [`../v3-source.md`](../v3-source.md).
- Implementation: `src/components/ui/icon-catalog.tsx`.
- Preview story: `src/preview/demos/brand-icon.tsx`, registered as `brand-icons`
  through a lazy import in `src/preview/registry.tsx`.
- Behavior: searches icon names in English/Thai, selects 16/20/24/32px sizes,
  copies SVG markup from the rendered React icon, and announces copy feedback.
- Catalog: 32 everyday icons and the complete 12-icon signature set from v3.
- Dependencies: existing `lucide-react`; no new package or raw HTML execution.
- Status: implemented.
