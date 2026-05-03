# 2.5D Translation Plan

1. Create `components/IsoSprite.tsx`
   - Accepts parameters: `baseType`, `topColor`, `leftColor`, `rightColor`, `zHeight` (px).
   - Generates exact SVG polygons. The SVG's `viewBox` will be large enough to encapsulate the height.
   - For example, if grid is 48x24
   - `width=48, height=24 + zHeight`

2. Update `Tile.tsx`
   - If `isIsometric`, instead of rendering `<IsoBlock>` divs, render `<IsoSprite>`.
   - Update `renderIcon` and `renderBackground` to use specific colors for specific types.
   - Walls = tall thick bricks.
   - Floor = thin slabs.

3. Update `GameBoard.tsx`
   - Iterate over all rendered elements.
   - If `isIsometric`, calculate `left` and `top` using Cartesian-to-Isometric projection.
   ```js
   const isoLeft = (x - y) * 24; // 48 / 2
   const isoTop = (x + y) * 12; // 24 / 2
   // Offset into the center of the board
   ```
   - Calculate dynamical `zIndex`.
   ```js
   const zIndex = (x + y) * 100 + layerOffset;
   ```

4. Update `index.css`
   - Remove ALL `.is-isometric #game-board-grid-parent...` rules! 
   - No more `rotateX` or `preserve-3d`. The board is purely standard 2D. 
