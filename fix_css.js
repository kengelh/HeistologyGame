const fs = require('fs');
let content = fs.readFileSync('/Users/kengel/Documents/VibeCode/Heistology/index.css', 'utf8');

// Strip out .is-isometric 3D rotation logic
content = content.replace(/\/\* Isometric Diorama Perspective \*\/[\s\S]*?\.is-isometric #game-board-grid-parent::after \{[\s\S]*?\}/, '');

fs.writeFileSync('/Users/kengel/Documents/VibeCode/Heistology/index.css', content);
