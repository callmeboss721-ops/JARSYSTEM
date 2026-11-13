# V3 mobile tab bar

- Visual/content source: user-provided `jaguar-spk-design-system-v3_1794533773590.html`;
  see [`../v3-source.md`](../v3-source.md).
- Implementation: `src/components/ui/mobile-tab-bar.tsx`.
- Preview story: `src/preview/demos/mobile-tab-bar.tsx`, lazily registered as
  `mobile-tab-bar`.
- Five local tabs switch the visible sample panel. The center QR affordance is
  only a visual/demo selection and does not request camera permission.
- Keyboard focus and selected-state semantics are included. The preview styles
  address the 375px, 768px, and 1280px responsive widths.
- Dependencies: existing `lucide-react` and React.
- Status: implemented.
