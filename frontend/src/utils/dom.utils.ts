// ===========================================
// DOM UTILS
// ===========================================
/**
 * Ce fichier contient des fonctions utilitaires pour manipuler le DOM.
 * 
 * Les fonctions sont conçues pour être utilisées de manière générique et
 * ne sont pas liées à un contexte spécifique.
 */

/**
 * Un objet Map qui contient les templates HTML chargés.
 * Les clés sont les chemins des templates (par exemple, "src/templates/page.html"),
 * et les valeurs sont le contenu HTML des templates.
 */
export const templateCache = new Map<string, string>();

/**
 * Charge un template HTML depuis un chemin spécifié et le met en cache.
 * Si le template est déjà présent dans le cache, retourne la version mise en cache.
 * Sinon, effectue une requête pour récupérer le template et le stocke dans le cache.
 *
 * @param {string} path - Chemin du fichier template HTML à charger.
 * @returns {Promise<string>} - Promise résolvant avec le contenu HTML du template.
 * @throws {Error} - Lance une erreur si la requête échoue.
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

export async function loadGoogleScript() {
	return new Promise((resolve, reject) => {
		if (document.getElementById('google-client-script')) {
			resolve(null);
			return;
		}
		const script = document.createElement('script');
		script.id = 'google-client-script';
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;
		script.onload = () => resolve(null);
		script.onerror = () => reject(new Error('Google script load error'));
		document.head.appendChild(script);
	});
}

/**
 * Renvoie l'élément HTML portant l'identifiant (id) passé en paramètre, dans le conteneur
 * passé en paramètre (par défaut, c'est le document courant).
 * Si l'élément n'est pas trouvé, lance une erreur.
 *
 * @param {string} elementId - Identifiant (id) de l'élément à chercher.
 * @param {Document | ParentNode} [container=document] - Conteneur dans lequel chercher l'élément.
 * @returns {HTMLElement} - L'élément HTML portant l'identifiant (id) demandé.
 * @throws {Error} - Si l'élément n'est pas trouvé dans le DOM.
 */
export function getHTMLElementById(elementId: string, container: Document | ParentNode = document): HTMLElement {
	const element = container.querySelector(`#${elementId}`);
	if (!(element instanceof HTMLElement)) {
		throw new Error(`Elément #${elementId} introuvable dans le DOM`);
	}
	return element;
}

/**
 * Renvoie l'élément HTML portant la classe CSS passée en paramètre, dans le conteneur
 * passé en paramètre (par défaut, c'est le document courant).
 * Si l'élément n'est pas trouvé, lance une erreur.
 *
 * @param {string} elementClass - Nom de la classe CSS de l'élément à chercher.
 * @param {Document | ParentNode} [container=document] - Conteneur dans lequel chercher l'élément.
 * @returns {HTMLElement} - L'élément HTML portant la classe CSS demandée.
 * @throws {Error} - Si l'élément n'est pas trouvé dans le DOM.
 */
export function getHTMLElementByClass(elementClass: string, container: Document | ParentNode = document): HTMLElement {
	const element = container.querySelector(`.${elementClass}`);
	if (!(element instanceof HTMLElement)) {
		throw new Error(`Elément .${elementClass} introuvable dans le DOM`);
	}
	return element;
}

/**
 * Renvoie l'élément HTML portant la balise HTML passée en paramètre, dans le conteneur
 * passé en paramètre (par défaut, c'est le document courant).
 * Si l'élément n'est pas trouvé, lance une erreur.
 *
 * @param {string} elementTag - Nom de la balise HTML de l'élément à chercher.
 * @param {Document | ParentNode} [container=document] - Conteneur dans lequel chercher l'élément.
 * @returns {HTMLElement} - L'élément HTML portant la balise HTML demandée.
 * @throws {Error} - Si l'élément n'est pas trouvé dans le DOM.
 */
export function getHTMLElementByTagName(elementTag: string, container: Document | ParentNode = document): HTMLElement {
	const element = container.querySelector(`${elementTag}`);
	if (!(element instanceof HTMLElement)) {
		throw new Error(`Elément ${elementTag} introuvable dans le DOM`);
	}
	return element;
}

/**
 * Retourne un élément HTML de type <a> ayant l'attribut href donné, dans le conteneur
 * passé en paramètre (par défaut, le document).
 * Si l'élément n'existe pas, lance une erreur.
 *
 * @param {string} hrefValue - Valeur de l'attribut href du lien à chercher (ex: "/logout").
 * @param {(Document | ParentNode)} [container=document] - Conteneur dans lequel chercher l'élément.
 * @returns {HTMLAnchorElement} - L'élément <a> trouvé.
 * @throws {Error} - Si l'élément n'est pas trouvé.
 */
export function getHTMLAnchorElement(hrefValue: string, container: Document | ParentNode = document): HTMLAnchorElement {
	const element = container.querySelector(`a[href="${hrefValue}"]`);
	if (!(element instanceof HTMLAnchorElement)) {
		throw new Error(`Elément a[href="${hrefValue}"] introuvable dans le DOM`);
	}
	return element;
}

/**
 * Alterne entre deux classes CSS sur un élément, avec une classe optionnelle.
 * Si l'élément a la classe `classA`, elle est remplacée par `classB` (et `classC` ajoutée si fournie).
 * Sinon, `classB` (et `classC`) sont retirées, et `classA` ajoutée.
 *
 * @param {(Element | null)} el - Élément HTML à modifier.
 * @param {string} classA - Première classe CSS à alterner.
 * @param {string} classB - Deuxième classe CSS à alterner.
 * @param {string} [classC] - Classe CSS optionnelle à ajouter si l'élément a `classA`.
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

/**
 * Affiche un message d'erreur sur la page actuelle.
 *
 * Récupère l'élément HTML <div id="alert"> et y injecte le message d'erreur
 * préfixé d'un icône de triangle d'avertissement.
 *
 * @param {string} message - Le message d'erreur à afficher.
 */
export function showError(message: string): void {
	const alertDiv = getHTMLElementById('alert');
	const cautionIcon = '<i class="fa-solid fa-circle-exclamation"></i> ';
	alertDiv.innerHTML = cautionIcon + message;
	alertDiv.classList.remove('hidden');
}