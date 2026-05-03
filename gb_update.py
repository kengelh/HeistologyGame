import re

with open('/Users/kengel/Documents/VibeCode/Heistology/components/GameBoard.tsx', 'r') as f:
    text = f.read()

# Replace basic tile renderers
text = re.sub(
    r'style=\{\{\s*left:\s*([a-zA-Z0-9_.]+)\s*\*\s*TILE_SIZE,\s*top:\s*([a-zA-Z0-9_.]+)\s*\*\s*TILE_SIZE,\s*width:\s*TILE_SIZE,\s*height:\s*TILE_SIZE\s*\}\}',
    r'style={getPos(\1, \2)}',
    text
)

# For laser beams and borders, they have custom heights and transforms:
# Let's target lines manually.

with open('/Users/kengel/Documents/VibeCode/Heistology/components/GameBoard.tsx', 'w') as f:
    f.write(text)

print("done")
