/** @type {import('tailwindcss').Config} */

import { fonts, colorsTheme1, images } from './src/styles/theme/theme'

export default {
	content: [
		"./index.html",
		"./public/templates/**/*.html",
		"./src/**/*.{js,ts,jsx,tsx}",
  		"./node_modules/@fortawesome/fontawesome-free/**/*.js"
	],
	theme: {
		extend: {
			fontFamily: {
				'title': fonts.cinzel,
				'home': fonts.garamond,
				'classic': fonts.arial,
			},
			colors: {
				'site-title-color': colorsTheme1.greyishGreen,
				'main-font-color': colorsTheme1.white,
				'gradient-nav-bg-color-1': colorsTheme1.vdarkBlue,
				'gradient-nav-bg-color-2': colorsTheme1.lightForestGreen,
				'body-bg-color': colorsTheme1.vdarkBlue,
				'footer-font-color': colorsTheme1.vlightGrey,
				'footer-bg-color': colorsTheme1.vdarkBlue,
				'nav-link-color': colorsTheme1.white,
				'nav-hover-link-color': colorsTheme1.fireflyYellow,
				'nav-focus-link-color': colorsTheme1.fireflyYellow,
				'box-bg-color': colorsTheme1.darkBlue,
				'box-border-color': colorsTheme1.vdarkBlue,
				'gradient-btn-color-1': colorsTheme1.deepCyan,
				'gradient-btn-color-2': colorsTheme1.deepSky,
				'btn-gradient-border-color': colorsTheme1.deepCyan,
				'btn-bg-color': colorsTheme1.darkBlue,
				'btn-bg-color-hover': colorsTheme1.lightForestGreen,
				'btn-border-color': colorsTheme1.darkBlue,
				'btn-google-color': colorsTheme1.pastelBlue,
				'btn-font-color': colorsTheme1.white,
				'online-btn-color': colorsTheme1.fadeForestGreen,
				'section-title-color': colorsTheme1.fireflyYellow
			},
			backgroundImage: {
				'body-bg-img': images.forestWallpaper,
				'avatar-default-img': images.avatarDefault
			},
			keyframes: {
				logoGlow: {
					'0%': {
						textShadow: `
							0 0 10px rgba(100, 200, 255, 0.8),
							0 0 20px rgba(100, 200, 255, 0.6),
							0 0 30px rgba(100, 200, 255, 0.4),
							0 0 40px rgba(100, 200, 255, 0.2)
						`
					},
					'100%': {
						textShadow: `
							0 0 15px rgba(100, 200, 255, 1),
							0 0 25px rgba(100, 200, 255, 0.8),
							0 0 35px rgba(100, 200, 255, 0.6),
							0 0 45px rgba(100, 200, 255, 0.4)
						`
					}
				},
				letterFloat: {
					'0%, 100%': {
						transform: 'translateY(0px) rotate(0deg)'
					},
					'25%': {
						transform: 'translateY(-5px) rotate(1deg)'
					},
					'50%': {
						transform: 'translateY(-2px) rotate(0deg)'
					},
					'75%': {
						transform: 'translateY(-8px) rotate(-1deg)'
					}
				},
				logoAppear: {
					'0%': {
						opacity: '0',
						transform: 'scale(0.5) translateY(30px)'
					},
					'50%': {
						opacity: '0.7',
						transform: 'scale(1.1) translateY(-5px)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1) translateY(0)'
					}
				}
			},
			animation: {
				'logo-glow': 'logoGlow 3s ease-in-out infinite alternate',
				'letter-float-1': 'letterFloat 4s ease-in-out infinite',
				'letter-float-2': 'letterFloat 4s ease-in-out infinite 0.2s',
				'letter-float-3': 'letterFloat 4s ease-in-out infinite 0.4s',
				'letter-float-4': 'letterFloat 4s ease-in-out infinite 0.6s',
				'logo-appear': 'logoAppear 1s ease-out',
			}
		},
	},
	plugins: [],
}