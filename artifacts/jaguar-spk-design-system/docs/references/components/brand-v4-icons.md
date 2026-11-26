# JAGUAR SPK Brand ID 2026 v4 icons

`BrandV4Icon` provides the 16 supplied JAGUAR SPK v4 marks in duotone SVG,
monochrome SVG, and 128/512px PNG variants. It validates icon names at compile
time and accepts an `assetBase` so consumers can serve the same source pack from
their own public directory.

```tsx
import { BrandV4Icon } from "@workspace/jaguar-spk-design-system/components/ui/brand-v4-icon";

<BrandV4Icon name="pos-counter" variant="duotone" size={24} assetBase="/brand/v4" />;
```

The default asset base points to the design-system preview. App consumers should
set it to the public path where the v4 pack is deployed. Icons are decorative by
default; provide `alt` only when the image itself communicates information not
already present in nearby text.
