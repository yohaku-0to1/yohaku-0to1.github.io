# 3D Skill Galaxy Implementation

I have implemented the "Skill Galaxy" feature, a 3D interactive visualization of your tools and links using Three.js.

## Changes Made

### 1. `index.html`
- Added **Three.js** import map and ES module shims to the `<head>`.
- Added a new **Skill Galaxy Section** (`#skill-galaxy-section`) above the Links section.
- Imported `js/galaxy.js` as a module at the end of the body.

### 2. `js/data.js`
- Updated data declarations (`PROFILE_DATA`, `TOOLS_DATA`, `links`, etc.) to explicitly attach to the `window` object (e.g., `window.TOOLS_DATA = ...`). This ensures they are accessible to the module-based `galaxy.js`.

### 3. `js/galaxy.js` (New File)
- Implemented the 3D scene using **Three.js**.
- Features:
    - **Interactive Nodes**: Tools (Pink) and Links (Blue) are represented as 3D icosahedrons.
    - **Orbit Controls**: Users can rotate, zoom, and pan the galaxy.
    - **CSS2D Labels**: Text labels that always face the screen and are clickable.
    - **Starfield Background**: A particle system for a space-like atmosphere.
    - **Raycasting**: Hover effects (glow/scale up) and click-to-visit functionality.

## Verification
- **Visuals**: The galaxy should appear in the new section with a black background and floating nodes.
- **Interaction**: Dragging should rotate the view. Hovering over a node should highlight it. Clicking a node or its label should open the corresponding URL.
- **Data**: The nodes should correspond to the items in your `TOOLS_DATA` and `links` arrays.

## Next Steps
- You can customize the colors, shapes, or animation speeds in `js/galaxy.js` (look for the `CONFIG` object).
- If you add more tools or links to `js/data.js`, they will automatically appear in the galaxy.
