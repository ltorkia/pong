export const templateCache = new Map<string, string>();

/**
 * Charge un template HTML depuis un chemin en le mettant en cache.
 * Si le template a déjà été chargé, retourne la version mise en cache
 * pour éviter des requêtes fetch répétées et améliorer les perfs.
 */
export async function loadTemplate(path: string): Promise<string> {
	if (templateCache.has(path)) {
		return templateCache.get(path)!;
	}
	const response = await fetch(path);
	if (!response.ok) {
		throw new Error(`Le template '${path}' n'a pas pu être chargé`);
	}
	const html = await response.text();
	templateCache.set(path, html);
	return html;
}

/**
 * Récupère un élément du DOM par son id.
 * Throw une erreur si introuvable.
 */
export function getHTMLElementById(elementId: string): HTMLElement {
	const element = document.getElementById(elementId);
	if (!(element instanceof HTMLElement)) {
		throw new Error(`Elément #${elementId} introuvable dans le DOM`);
	}
	return element;
}

/**
 * Récupère un élément du DOM par sa classe.
 * Throw une erreur si introuvable.
 */
export function getHTMLElementByClass(elementClass: string): HTMLElement {
	const element = document.querySelector(`.${elementClass}`);
	if (!(element instanceof HTMLElement)) {
		throw new Error(`Elément .${elementClass} introuvable dans le DOM`);
	}
	return element;
}

/**
 * Récupère un élément HTML de type <a> (lien) à partir d'un sélecteur CSS,
 * dans un conteneur donné (document par défaut).
 * Throw une erreur si introuvable.
 */
export function getHTMLAnchorElement(elementSelector: string, container: Document | ParentNode = document): HTMLAnchorElement {
	const element = container.querySelector(elementSelector);
	if (!(element instanceof HTMLAnchorElement)) {
		throw new Error(`Elément ${elementSelector} introuvable dans le DOM`);
	}
	return element;
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