# ZikFash "Deterministic" Animation Rig Guide

This document defines the mathematical "Graph" used to control the ZikFash hero animation. Instead of manual coordinates, the rig is driven by a centralized Control Panel of CSS variables.

## 1. The Control Panel (style.css -> #logo-rig)
The entire animation is governed by variables at the top of `#logo-rig`. Adjusting these values changes the behavior across both Desktop and Mobile viewports simultaneously.

| Variable | Type | Default (Desktop) | Purpose |
| :--- | :--- | :--- | :--- |
| `--fab-w` | **Where** | `400px` | Total width of the fabric. Controls travel distance. |
| `--tip-o` | **Where** | `310px` | Mechanical offset from scissor center to blade tip. |
| `--assemble-x` | **Where** | `-150px` | Final "Z" logo horizontal resting position. |
| `--start-delay`| **When** | `2s` | Settle time before any movement starts. |
| `--anim-dur` | **When** | `10s` | Speed of the scissors gliding across the fabric. |
| `--paper-delay`| **When** | `11s` | When the fabric halves begin their flight animation. |
| `--text-delay` | **When** | `17s` | When the final typography fades in. |
| `--rig-flatten-dur`| **How** | `2s` | Speed of the 3D-to-2D flattening transition. |
| `--transform-dur` | **How** | `5s` | Speed of the mechanical Z-assembly. |

---

## 2. Spatial Logic: "WHERE" it happens
The coordinate system is calculated using the center of the viewport (`50%`) as the origin. 

*   **Fabric Start Point:** `calc(50% - (var(--fab-w) / 2))`
*   **Scissor Origin at Start:** `calc(50% - (var(--fab-w) / 2) - var(--tip-o))`
*   **Scissors Final Assembly:** `calc(50% + var(--assemble-x))`

### Example Modification:
**Goal:** Make the scissors start further "off-screen" to the left.
**Action:** Increase `--tip-o`. For example, setting it to `400px` will push the scissors' starting body further left while keeping the blade tip perfectly aligned with the fabric start.

---

## 3. Timeline Logic: "WHEN" it happens
The animation follows a strict sequence synchronized between CSS and JavaScript.

1.  **Settle Phase** (`--start-delay`): The initial wait for the user to focus on the fabric.
2.  **Cutting Phase** (`--anim-dur`): The primary scissors glide and line growth.
3.  **Transformation Trigger** (`script.js`): A JavaScript timeout triggers the `.transformed` class.
    *   *Equation:* `transformationDelay = --anim-dur + --start-delay + 0.5s buffer`.
4.  **Assembly Phase** (`--transform-dur`): Mechanical parts morph into the "Z" shape.
5.  **Reveal Phase** (`--text-delay`): Final branding lockup fades in.

---

## 4. Mechanical Logic: "HOW" it works
The "Z" shape is formed by the mechanical rotation of two parent assemblies around a single hinge.

*   **The Diagonal:** Controlled by `#bottom-part` rotation.
*   **The Bars:** Controlled by `#top-part` translation and the split-blade segment.
*   **Flattening:** Controlled by the transition on `#logo-rig` when the `.transformed` class is added.

---

## 5. Examples of Behavior Modifications

### Slow down the entire mobile experience:
In the `@media (max-width: 480px)` block:
1.  Increase `--anim-dur` to `12s`.
2.  Update `--paper-delay` to `13s` (Duration + 1s).
3.  Update `--text-delay` to `18s`.
4.  **IMPORTANT:** Update `script.js` variable `transformationDelay` for mobile to `14500` (12s + 2s + 0.5s).

### Change the final logo position:
Adjust `--assemble-x`. 
*   To move the logo **Right**: Change `-150px` to `-100px`.
*   To move the logo **Left**: Change `-150px` to `-200px`.

### Fix "Air Cutting" at the end:
If the scissors keep snipping after the fabric ends, decrease `--snip-dur`. 
*   *Perfect Sync Formula:* `--snip-dur = (--anim-dur * 0.9) / 5`.
