const fs = require('fs');
let content = fs.readFileSync('/Users/kengel/Documents/VibeCode/Heistology/components/Tile.tsx', 'utf8');

const mapping = [
    { target: 'IsoBlock topClass="bg-stone-300" sideDarkClass="bg-stone-500" sideLightClass="bg-stone-400" height={30} w="30%" d="30%" x="35%" y="35%"', replace: 'IsoSprite topColor="#f8fafc" leftColor="#94a3b8" rightColor="#cbd5e1" thickness={30} scale={0.4} className="z-10"' },
    { target: 'IsoBlock topClass="bg-cyan-300" sideDarkClass="bg-cyan-600" sideLightClass="bg-cyan-500" height={28} w="50%" d="50%" x="25%" y="0%"', replace: 'IsoSprite topColor="#22d3ee" leftColor="#0891b2" rightColor="#06b6d4" thickness={28} scale={0.5} className="z-10"' },
    { target: 'IsoBlock topClass="bg-yellow-300" sideDarkClass="bg-yellow-500" sideLightClass="bg-yellow-400" height={8} w="50%" d="40%" x="25%" y="30%"', replace: 'IsoSprite topColor="#fde047" leftColor="#eab308" rightColor="#facc15" thickness={8} scale={0.5} className="z-10"' },
    { target: 'IsoBlock topClass="bg-indigo-300" sideDarkClass="bg-indigo-500" sideLightClass="bg-indigo-400" height={16} w="60%" d="20%" x="20%" y="0%"', replace: 'IsoSprite topColor="#a5b4fc" leftColor="#6366f1" rightColor="#818cf8" thickness={16} scale={0.4} className="z-10"' },
    { target: 'IsoBlock topClass="bg-blue-300" sideDarkClass="bg-blue-500" sideLightClass="bg-blue-400" height={12} w="80%" d="40%" x="10%" y="30%"', replace: 'IsoSprite topColor="#93c5fd" leftColor="#3b82f6" rightColor="#60a5fa" thickness={12} scale={0.6} className="z-10"' },
    { target: 'IsoBlock topClass="bg-amber-300" sideDarkClass="bg-amber-600" sideLightClass="bg-amber-500" height={16} w="100%" d="40%" x="0%" y="30%"', replace: 'IsoSprite topColor="#fcd34d" leftColor="#d97706" rightColor="#f59e0b" thickness={16} scale={0.7} className="z-10"' },
    { target: 'IsoBlock topClass="bg-red-400" sideDarkClass="bg-red-600" sideLightClass="bg-red-500" height={12} w="20%" d="40%" x="80%" y="30%"', replace: 'IsoSprite topColor="#f87171" leftColor="#dc2626" rightColor="#ef4444" thickness={12} scale={0.3} className="z-10"' }
];

mapping.forEach(m => {
    content = content.replace(m.target, m.replace);
});

fs.writeFileSync('/Users/kengel/Documents/VibeCode/Heistology/components/Tile.tsx', content);
