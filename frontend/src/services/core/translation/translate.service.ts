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
	// public setLocale(locale: Locale): void {
	// 	if (this.translations[locale]) {
	// 		this.currentLocale = locale;
	// 		localStorage.setItem('locale', locale);
	// 	}
	// }

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
	// public t(path: string): string {
	// 	const keys = path.split('.');
	// 	let value: any = this.translations[this.currentLocale];

	// 	for (const key of keys) {
	// 		if (!value) 
	// 			return path;
	// 		value = value[key];
	// 	}

	// 	return typeof value === 'string' ? value : path;
	// }

public setLocale(locale: Locale): void {
    console.log('Setting locale to:', locale);
    console.log('Available translations:', Object.keys(this.translations));
    console.log('Translation exists:', !!this.translations[locale]);
    
    if (this.translations[locale]) {
        this.currentLocale = locale;
        localStorage.setItem('locale', locale);
        console.log('Locale set successfully to:', this.currentLocale);
    } else {
        console.error('Translation not found for locale:', locale);
    }
}

public t(path: string): string {
    console.log('Translating path:', path, 'with locale:', this.currentLocale);
    const keys = path.split('.');
    let value: any = this.translations[this.currentLocale];
    console.log('Starting translation object:', value);

    for (const key of keys) {
        if (!value) {
            console.log('Value is null/undefined at key:', key);
            return path;
        }
        value = value[key];
        console.log('After key', key, ':', value);
    }

    const result = typeof value === 'string' ? value : path;
    console.log('Final translation result:', result);
    return result;
}

	/**
	 * Traduit les éléments HTML qui ont l'attribut data-ts (clé de traduction).
	 * Exemple: <p data-ts="home.welcome"></p>
	 * La clé est passée à la méthode t() pour obtenir la traduction.
	 * Met aussi à jour le selecteur de langue de la navbar.
	 */
	public translatePage(): void {
		document.querySelectorAll<HTMLElement>('[data-ts]').forEach(el => {
			const key = el.dataset.ts!;
			el.textContent = this.t(key);
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
	 */
	public updateLanguage(selectedLang?: Locale) {
		if (selectedLang)
			this.setLocale(selectedLang);
		this.translatePage();
	}
}
// i18n ->librairie ou truc pour le faire en klks ligns aussi