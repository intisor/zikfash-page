# ZikFash Landing Page Optimization Guide

This document chronicles the errors discovered, architectural mistakes corrected, and mathematical layout fixes applied to perfect the responsive UI and Master's Cut animation of the ZikFash landing page.

---

## 1. Feature Grid Horizontal Overflow

### **The Mistake**
On mobile devices, the `.feature-grid` relied on auto-fit CSS grid configurations that forced multi-column rendering. This pushed content horizontally, causing an unwanted side-scroll experience.

### **The Fix**
- Reconfigured `.feature-grid` to a strict single-column layout (`grid-template-columns: 1fr`) in the `@media (max-width: 768px)` override.
- Bounded `.feature-card-visual` components using `max-width: 400px` and `width: 100%` so they fluidly scale and stack vertically without breaking the viewport constraints.

---

## 2. Onboarding Form "Capsule" Alignment

### **The Mistake**
The mobile layout for the shop name, phone number, and currency picker was stretching. The currency `select` element was blowing out its grid column, causing structural misalignment, and vertical gaps were too wide due to inherited margins.

### **The Fix**
- **Capsule UI Engineering**: Fused the phone number input and currency picker into a single seamless "pill".
- **Grid Constraints**: Forced the `.secondary-row` layout to exactly `grid-template-columns: 1fr 65px` and overrode the currency picker's `min-width: 0 !important` to stop the grid blowout.
- **Mathematical Border Curves**: Recalculated border radii to ensure perfect nesting (Outer Radius: 20px - Padding: 8px = Inner Radius: 12px).
- **Tightened Spacing**: Stripped the `.main-row` (Shop Name) `margin-bottom` down to `0`, relying purely on the parent container's `gap: 12px` to tighten vertical density.

---

## 3. "Master's Cut" Animation Math & Synchronization

### **The Mistake**
The 15-second cinematic scissor reveal suffered from a major timing desync on mobile. The scissors appeared to complete their travel before the cut finished, snipping empty space. The forward movement relied on an `ease` animation curve, while the blades snipped at a constant `linear` rate. Furthermore, the coordinate math assumed bounding-box positioning rather than true intersection positioning.

### **The Fix**
- **Interpolation Sync**: Changed both the `#scissors` movement and the gap expansion (`#cut`) from `ease` to `linear` so the 5 structural snips lock tightly with the horizontal travel speed.
- **Fabric Clamping**: Restrained `--fab-w` using `min(80vw, 320px)` to guarantee mathematical travel distances never outpace physical max-widths.
- **True Cutting Point Origin**: Restored the tip offset (`--tip-o`) to `186px`. This is not the physical tip of the blade (310px), but rather the **precise mathematical average intersection point** of the blades as they snip, guaranteeing the cut starts exactly at the left edge and completes exactly at the right edge.
- **Geometric Centering**: Nudged the entire scissors container to `calc(50% - 44px)`. Because the mechanical hinge sits 44px down the SVG, this mathematically locks the blade intersection directly onto the `Y = 50%` centerline of the fabric.

---

## 4. 3D Optical Illusion & Z-Index Layering

### **The Mistake**
The visual illusion of scissors slicing through paper broke down due to stacking contexts. The `#cut` line (gap eraser) was rendering *on top* of the scissors. The text spans ("IK" and "Fash") were trapped inside a parent `#text` element whose opacity animation generated a strict CSS stacking context, preventing them from weaving between the 3D layers.

### **The Fix**
- **Seamless Erasure**: Shifted `.half#top` and `.half#bottom` so they mathematically overlap by `1px` (`translateY(-124px)` and `translateY(-1px)`). The `#cut` line was then positioned at `calc(50% - 1px)` with a thickness of `2px` to perfectly erase this overlap, leaving a clean, transparent gap.
- **Scissor Stacking**: Bumped `#scissors` to `z-index: 25`, allowing it to sit above the `#cut` gap (20) so the gap trails authentically from behind the nut, rather than drawing over it.
- **Bottom Blade Immersion**: Lifted `.half#bottom` to `z-index: 30`. This covers the bottom blade of the scissors while leaving the top blade exposed (`z-index: 5` on `.half#top`), completely solidifying the 3D slicing effect.
- **Breaking the Text Stacking Context**: 
  - Eradicated the parent `#text` wrapper in the HTML to destroy its stacking context.
  - Set `#firstline` ("IK") to `z-index: 35`, increasing font size and placing it securely *above* the entire assembly.
  - Set `#secondline` ("Fash") to `z-index: 10`, pushing it down visually (`top: calc(50% + 148px)`) to sit cleanly underneath `.half#bottom`. Because both elements are within the scaled `#logo-rig`, their offsets are natively responsive.
