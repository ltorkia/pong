export const templateCache = new Map<string, string>();

/**
 * Charge un template HTML depuis un chemin en le mettant en cache.
 * Si le template a déjà été chargé, retourne la version mise en cache
 * pour éviter des requêtes fetch répétées et améliorer les perfs.
 */
export async function loadCachedTemplate(path: string): Promise<string> {
	if (templateCache.has(path)) {
		return templateCache.get(path)!;
	}
	const res = await fetch(path);
	if (!res.ok) {
		throw new Error(`Erreur chargement template: ${path}`);
	}
	const html = await res.text();
	templateCache.set(path, html);
	return html;
}

/**
 * Alterne entre deux classes CSS sur un élément, avec une classe optionnelle.
 * Si l'élément a la classe classA, elle est remplacée par classB (et classC ajoutée si fournie).
 * Sinon, classB (et classC) sont retirées, et classA ajoutée.
 */
export function toggleClass(el: Element | null, classA: string, classB: string, classC?: string): void {
	if (!el) return;
	if (el.classList.contains(classA)) {
		el.classList.remove(classA);
		el.classList.add(classB);
		if (classC) {
			el.classList.add(classC);
		}
	} else {
		if (classC) {
			el.classList.remove(classC);
		}
		el.classList.remove(classB);
		el.classList.add(classA);
	}
}