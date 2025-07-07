export const alertStyles = {
	error: {
		bg: 'bg-red-100',
		text: 'text-red-700',
		border: 'border-red-400',
		icon: '<i class="fa-solid fa-circle-exclamation"></i>',
	},
	success: {
		bg: 'bg-green-100',
		text: 'text-green-700',
		border: 'border-green-400',
		icon: '<i class="fa-solid fa-circle-check"></i>',
	},
	info: {
		bg: 'bg-yellow-100',
		text: 'text-yellow-700',
		border: 'border-yellow-400',
		icon: '<i class="fa-solid fa-triangle-exclamation"></i>',
	},
} as const;

export type AlertColor = keyof typeof alertStyles;
export type AlertStyle = typeof alertStyles[AlertColor];
