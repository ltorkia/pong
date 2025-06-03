/** @type {import('tailwindcss').Config} */

import { fonts, colorsTheme1, images } from './src/styles/theme/theme'

export default {
	content: [
		"./index.html",
		"./public/templates/**/*.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				'title-font': fonts['cinzel'],
				'home-font': fonts['garamond'],
				'classic-font': fonts['arial'],
			},
			colors: {
				'site-title-color': colorsTheme1['greyishGreen'],
				'main-font-color': colorsTheme1['white'],
				'gradient-nav-bg-color-1': colorsTheme1['vdarkBlue'],
				'gradient-nav-bg-color-2': colorsTheme1['lightForestGreen'],
				'body-bg-color': colorsTheme1['vdarkBlue'],
				'footer-font-color': colorsTheme1['vlightGrey'],
				'footer-bg-color': colorsTheme1['vdarkBlue'],
				'nav-link-color': colorsTheme1['white'],
				'nav-hover-link-color': colorsTheme1['fireflyYellow'],
				'nav-focus-link-color': colorsTheme1['fireflyYellow'],
				'box-bg-color': colorsTheme1['darkBlue'],
				'box-border-color': colorsTheme1['vdarkBlue'],
				'gradient-btn-color-1': colorsTheme1['deepCyan'],
				'gradient-btn-color-2': colorsTheme1['deepSky'],
				'btn-bg-color': colorsTheme1['darkBlue'],
				'btn-border-color': colorsTheme1['darkBlue'],
				'btn-font-color': colorsTheme1['white'],
				'online-btn-color': colorsTheme1['fadeForestGreen'],
				'section-title-color': colorsTheme1['fireflyYellow']
			},
			backgroundImage: {
				'body-bg-img': images['forestWallpaper'],
				'avatar-default-img': images['avatarDefault'],
			},
		},
	},
	plugins: [],
}