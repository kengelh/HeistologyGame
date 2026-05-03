const fs = require('fs');
let content = fs.readFileSync('/Users/kengel/Documents/VibeCode/Heistology/components/GameBoard.tsx', 'utf8');

const replacement = `
    const ISO_W = 80;
    const ISO_H = 40;

    // Calculate the total pixel dimensions of the grid container.
    const mapWidthTiles = mapToRender[0]?.length || 20;
    const mapHeightTiles = mapToRender.length || 20;
    
    // In 2D: width = cols * 40, height = rows * 40
    // In Iso: diamond width total = (cols + rows) * (ISO_W / 2). Height = (cols + rows) * (ISO_H / 2)
    const containerWidth = isIsometric 
        ? (mapWidthTiles + mapHeightTiles) * (ISO_W / 2) 
        : mapWidthTiles * TILE_SIZE;
        
    const containerHeight = isIsometric 
        ? (mapWidthTiles + mapHeightTiles) * (ISO_H / 2) + 200 // padding for top extrusions
        : mapHeightTiles * TILE_SIZE;

    // Helper to abstract 2D vs 2.5D coordinates
    const getPos = (x, y, layerOffset = 0) => {
        if (!isIsometric) {
            return {
                left: x * TILE_SIZE,
                top: y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                zIndex: layerOffset // in 2D we just use standard fixed layers
            };
        }
        
        // Iso Projection
        // We shift the entire diamond right so x=0, y=Max doesn't go off screen.
        const offsetX = mapHeightTiles * (ISO_W / 2);
        const offsetY = 100; // Push down to leave room for tall walls at y=0, x=0
        
        return {
            left: (x - y) * (ISO_W / 2) + offsetX - (ISO_W / 2),
            top: (x + y) * (ISO_H / 2) + offsetY,
            width: ISO_W,
            height: ISO_H,
            // Magic sorting: Lower Y + X means "further back" (closer to top of screen).
            // Multiply by 10 to give space for layers.
            zIndex: Math.floor(x + y) * 10 + layerOffset 
        };
    };

    const activePlayerProjected = projectedPlayers[currentPlayer];
    const playerPixelPos = activePlayerProjected ? {
        x: isIsometric ? getPos(activePlayerProjected.x, activePlayerProjected.y).left + (ISO_W/2) : (activePlayerProjected.x + 0.5) * TILE_SIZE,
        y: isIsometric ? getPos(activePlayerProjected.x, activePlayerProjected.y).top + (ISO_H/2) : (activePlayerProjected.y + 0.5) * TILE_SIZE,
    } : null;
`;

content = content.replace(
    /    \/\/ Calculate the total pixel dimensions of the grid container\.[\s\S]*?    \} : null;/,
    replacement.trim()
);

fs.writeFileSync('/Users/kengel/Documents/VibeCode/Heistology/components/GameBoard.tsx', content);

