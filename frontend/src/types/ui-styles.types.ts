export const alertStyles = {
	error: {
        baseClass: 'alert-error',
		icon: '<i class="fa-solid fa-circle-exclamation"></i>',
	},
	success: {
        baseClass: 'alert-success',
		icon: '<i class="fa-solid fa-circle-check"></i>',
	},
	info: {
        baseClass: 'alert-info',
		icon: '<i class="fa-solid fa-triangle-exclamation"></i>',
	},
} as const;

export type AlertTheme = keyof typeof alertStyles;
export type AlertStyle = typeof alertStyles[AlertTheme];
