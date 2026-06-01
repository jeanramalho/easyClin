---
name: Kinetic Medical
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434656'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#952200'
  on-tertiary: '#ffffff'
  tertiary-container: '#bf3003'
  on-tertiary-container: '#ffddd5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbd2'
  tertiary-fixed-dim: '#ffb4a1'
  on-tertiary-fixed: '#3c0800'
  on-tertiary-fixed-variant: '#891e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
---

## Brand & Style
The design system is engineered for a premium Health & Management SaaS environment that balances enterprise-grade reliability with a human-centric interface. The personality is authoritative yet approachable, stripping away the sterile coldness of traditional clinical software in favor of a "Modern Enterprise" aesthetic.

The visual direction prioritizes **Minimalism** and **High-Clarity**. It utilizes generous whitespace to reduce cognitive load during complex data entry and financial reporting. By combining soft geometric shapes with a rigorous systematic grid, the interface evokes an emotional response of calm control, ensuring practitioners feel supported rather than overwhelmed.

## Colors
The palette is anchored by a vibrant **Primary Blue**, selected for its associations with precision and modern technology. This blue serves as the primary action color and brand signifier. 

For the **Light Mode**, we use a pure white base with layered neutral grays to define hierarchy. **Dark Mode** is not a simple inversion; it utilizes deep charcoal and navy-tinted blacks (`#0B0E14`) to maintain depth and reduce eye strain during late-shift usage. Surface levels in dark mode use subtle shifts in value rather than heavy borders to differentiate containers.

### Status Palette
- **Active / Approved:** Emerald Green (Success)
- **Pending / Trial:** Amber Gold (Warning/Attention)
- **Expired / Suspended:** Crimson Red (Error/Critical)
- **Neutral / Draft:** Slate Gray

## Typography
This design system utilizes **Inter** as the sole typeface for the interface to ensure maximum legibility across dense clinical data and financial BI dashboards. The typeface is used with a tight tracking (letter-spacing) on larger headlines to maintain a modern, "packaged" feel.

For tabular data and financial figures, use `font-feature-settings: "tnum"` (tabular figures) to ensure columns of numbers align perfectly. Labels use a slightly heavier weight and increased tracking for clarity at small sizes.

## Layout & Spacing
The design system follows a strict **8px linear scale** for all padding, margins, and heights. The layout is based on a **12-column fluid grid** for desktop, collapsing to 4 columns for mobile devices.

- **Desktop (1280px+):** 12 columns, 24px gutters, 40px side margins.
- **Tablet (768px - 1279px):** 8 columns, 16px gutters, 24px side margins.
- **Mobile (Up to 767px):** 4 columns, 16px gutters, 16px side margins.

For complex data tables, a "Compact" mode is supported where the baseline unit shifts to 4px to increase information density without sacrificing alignment.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Ambient Shadows**. Instead of harsh borders, surfaces are lifted using soft, multi-layered shadows with a slight blue tint (`rgba(0, 82, 255, 0.08)`) to maintain brand consistency even in the shadows.

- **Level 0 (Base):** The main canvas background.
- **Level 1 (Cards):** Subtle shadow (4px blur) used for primary content containers.
- **Level 2 (Modals/Dropdowns):** Pronounced shadow (16px blur) to indicate temporary overlay.
- **Dark Mode Depth:** In dark mode, elevation is primarily shown by lightening the background hex of the surface (e.g., Level 0 is black, Level 1 is dark gray).

## Shapes
This design system uses a **Rounded** shape language to soften the industrial nature of enterprise software. 
- **Standard Radius:** 8px (0.5rem) for buttons, input fields, and small cards.
- **Large Radius:** 16px (1rem) for main dashboard containers and modals.
- **Pill Radius:** Used exclusively for status badges and tags to distinguish them from actionable buttons.

## Components

### Buttons
Primary buttons use the solid brand blue with white text. Secondary buttons use a light blue ghost style (Light Mode) or a subtle gray border (Dark Mode). Active states should include a subtle 2px scale-down effect to feel tactile.

### Status Badges
Badges use a "Low-Contrast" fill style: a high-transparency background (10%) with a high-contrast text color of the same hue. 
- *Active:* Green background/text.
- *Suspended:* Red background/text.

### Cards
Cards are the primary structural unit. They must have a 1px border (`#E2E8F0` in light mode) and a Level 1 shadow. Headers within cards should be separated by a subtle divider.

### Data Tables
Tables are clean with no vertical borders. Horizontal borders use a hair-line width (1px). Row hover states must use a subtle background shift to assist with horizontal eye tracking.

### Form Fields
Inputs use an 8px radius. The focus state is a 2px outer ring in the primary blue color with a 2px offset, ensuring accessibility and high visibility.