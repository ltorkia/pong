/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,ts}', './public/index.html'],
	theme: {
		extend: {
			colors: {
			'pong-blue': '#0051ff',
			'pong-red': '#ff0051',
			'pong-background': '#000000',
			},
		},
	},
	plugins: [],
}