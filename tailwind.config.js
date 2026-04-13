/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./roster.ts",
    "./scenarios.ts",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'text-orange-400', 'text-red-400', 'text-sky-400', 'text-pink-400', 'text-emerald-500', 'text-yellow-400',
    'text-blue-500', 'text-gray-400', 'text-teal-400', 'text-indigo-400', 'text-fuchsia-400', 'text-blue-600',
    'text-orange-500', 'text-rose-500', 'text-slate-400', 'text-cyan-400', 'text-lime-500', 'text-amber-500',
    'text-emerald-600', 'text-blue-700', 'text-yellow-600', 'text-gray-600',
    'text-red-500', 'text-blue-400', 'text-cyan-500', 'text-slate-300', 'text-slate-900', 'text-slate-400'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        blueprint: '#1e3a8a',
        parchment: '#f5f5dc',
        evidence: '#991b1b',
        ink: '#1d4ed8',
      },
      fontFamily: {
        typewriter: ['Special Elite', 'Courier Prime', 'monospace'],
        handwriting: ['Gloria Hallelujah', 'Architects Daughter', 'cursive'],
      }
    }
  },
  plugins: [],
}

