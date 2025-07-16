// ===========================================
// UI STYLES CONFIG
// ===========================================
/**
 * Ce fichier contient les configurations de l'interface utilisateur (UI).
 *
 * Il contient des constantes pour les styles d'alertes et d'autres paramètres
 * liés à l'apparence de l'application.
 */

/**
 * Constante qui contient les styles d'alertes.
 *
 * Les clés de cet objet sont les noms des types d'alertes (par exemple, "error",
 * "success", etc.), et les valeurs sont des objets qui contiennent les classes
 * CSS pour les alertes correspondantes et le code HTML pour les icônes de ces
 * alertes.
 */
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