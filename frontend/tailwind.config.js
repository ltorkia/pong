/** @type {import('tailwindcss').Config} */
export default {
	content: [
	  "./index.html",
	  "./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
	  extend: {
		colors: {
		  'neon-blue': '#00f5ff',
		  'neon-pink': '#ff006e',
		  'neon-green': '#39ff14',
		  'dark-bg': '#0a0a0a',
		  'game-bg': '#1a1a1a',
		  'pong-blue': '#0051ff',
		  'pong-red': '#ff0051',
		},
		fontFamily: {
		  'game': ['Orbitron', 'monospace']
		}
	  },
	},
	plugins: [],
}