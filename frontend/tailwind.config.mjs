/** @type {import('tailwindcss').Config} */

import { fonts, colorsTheme1, images } from './src/config/theme.config'

// ===========================================
// TAILWIND CONFIG
// ===========================================
/**
 * Configuration de Tailwind CSS pour le projet.
 *
 * Les paramètres sont regroupés en 3 catégories :
 * - `content`: les fichiers à surveiller pour les mises à jour,
 * - `theme`: les paramètres de personnalisation du thème (dont certaines
 *            propriétés sont importées de theme.config),
 * - `plugins`: les plugins à charger.
 */
export default {
	/**
	 * Les fichiers à surveiller pour les mises à jour (hot-reload).
	 * Les modifications sont détectées pour reconstruire le CSS si nécessaire.
	 */
	content: [
		"./public/**/*.html",
		"./src/**/*.{js,ts,html,css}",
		"./node_modules/@fortawesome/fontawesome-free/**/*.js"
	],

	/**
	 * Les paramètres de personnalisation du thème.
	 */
	theme: {
		/**
		 * Les polices de caractères.
		 */
		extend: {
			fontFamily: {
				'title': fonts.cinzel,
				'home': fonts.garamond,
				'classic': fonts.arial,
			},
			/**
			 * Les couleurs.
			 */
			colors: {
				'main-font-color': colorsTheme1.white,
				'body-bg-color': colorsTheme1.darkBlue,
				'nav-link-color': colorsTheme1.white,
				'btn-font-color': colorsTheme1.white,
				'btn-google-color': colorsTheme1.pastelBlue,
			},
			/**
			 * Les images de fond.
			 */
			backgroundImage: {
				'body-bg-img': images.forestWallpaper
			},
			/**
			 * Les padding et marges.
			 */
			spacing: {
				'p': '0.5rem',
				'p-tablet': '3rem',
				'p-desktop': '3rem',
				'p-wide': '3rem',
				'p-extra-wide': '3rem',
			},
			/**
			 * Les hauteurs des éléments.
			 */
			height: {
				'navbar': '62px',
				'footer': '34px',
			},
			/**
			 * Les écrans pour le mode responsive.
			 */
			screens: {
				'mobile': '390px',
				'tablet': '768px',
				'desktop': '1024px',
				'wide': '1280px',
				'extra-wide': '1536px'
			},
			/**
			 * Les animations via Keyframes css.
			 */
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
			/**
			 * Les animations (adaptation des Keyframes).
			 */
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

	/**
	 * Les plugins à charger pour ajouter des fonctionnalités à Tailwind CSS.
	 */
	plugins: [],
}
