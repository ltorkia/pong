import en from './en.json';
import fr from './fr.json';
import ja from './ja.json';

// ===========================================
// TRANSLATE SERVICE
// ===========================================
/**
 * Service de traduction.
 */
export type Locale = 'en' | 'fr' | 'ja';
export class TranslateService {
	// private currentUser?: User = currentService.getCurrentUser();
	private currentLocale: Locale = 'fr';
	private translations: Record<string, any> = { en, fr, ja };

	constructor() {
		const saved = localStorage.getItem('locale') as Locale | null;
		this.currentLocale = saved ?? 'fr';
	}

	/**
	 * Choisit la langue de traduction
	 * et l'enregistre dans le localStorage.
	 * @param locale La langue à utiliser (en, fr, ja).
	 */
	public setLocale(locale: Locale): void {
		if (this.translations[locale]) {
			this.currentLocale = locale;
			localStorage.setItem('locale', locale);
		} else {
			console.error('Translation not found for locale:', locale);
		}
	}

	/**
	 * Renvoie la langue actuelle choisie.
	 * @returns La langue actuelle (en, fr, ja).
	 */
	public getLocale() {
		return this.currentLocale;
	}

	/**
	 * Traduit un texte en fonction de la locale actuelle.
	 * @param path Chemin de la clé de traduction.
	 * @returns La traduction si elle existe, sinon la clé de traduction.
	 */
	public t(path: string): string {
		const keys = path.split('.');
		let value: any = this.translations[this.currentLocale];

		for (const key of keys) {
			if (!value) {
				console.log('Value is undefined at key:', key);
				return path;
			}
			value = value[key];
		}

		const result = typeof value === 'string' ? value : path;
		return result;
	}

	/**
	 * Traduit les éléments HTML qui ont l'attribut data-ts (clé de traduction).
	 * Exemple: <p data-ts="home.welcome"></p>
	 * La clé est passée à la méthode t() pour obtenir la traduction.
	 * Met aussi à jour le selecteur de langue de la navbar.
	 */
	public translatePage(root: ParentNode = document): void {
		root.querySelectorAll<HTMLElement>('[data-ts]').forEach(el => {
			const key = el.dataset.ts!;
			const dataType = el.dataset.type;
			const content = this.t(key);

			// Appliquer la traduction au bon endroit
			if (dataType === 'placeholder' && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement))
				el.placeholder = content;
			else if (dataType === 'title') 
				el.setAttribute('title', content);
			else
				el.textContent = content;
		});

		// Mets à jour le select si présent
		const langSelect = document.querySelector<HTMLSelectElement>('#lang-switch');
		if (langSelect)
			langSelect.value = this.currentLocale;
	}

	/**
	 * Met à jour la langue de la page en fonction de la locale actuelle.
	 * Si un paramètre selectedLang est fourni, il est utilisé pour définir la
	 * nouvelle langue de la page.
	 * Ensuite, la méthode translatePage() est appelée pour traduire les éléments
	 * HTML qui ont l'attribut data-ts (clé de traduction).
	 * @param selectedLang Nouvelle langue à utiliser (en, fr, ja).
	 * @param root Le nœud racine dans lequel effectuer la traduction. Par défaut, c'est le document entier.
	 */
	public updateLanguage(selectedLang?: Locale, root?: ParentNode): void {
		if (selectedLang)
			this.setLocale(selectedLang);
		this.translatePage(root ?? document);
	}
}