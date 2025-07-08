import { RouteConfig } from '../types/routes.types';
import { BaseComponent } from '../components/base/base.component';
import { ComponentName, ComponentConfig } from '../types/components.types';

	/**
	 * Vérifie si la configuration d'un composant est valide pour la page actuelle.
	 *
	 * La configuration est considérée comme valide si le type (persistant ou non) et
	 * la visibilité (publique ou privée) du composant correspondent aux attentes
	 * pour la page actuelle.
	 *
	 * @param {RouteConfig} config La configuration de la route actuelle.
	 * @param {ComponentConfig} componentConfig La configuration du composant à vérifier.
	 * @param {boolean} [isPersistent=true] Indique si le composant est persistant sur plusieurs pages.
	 * @returns {boolean} Retourne true si la configuration du composant est valide, false sinon.
	 */
	export function isValidConfig(config: RouteConfig, componentConfig: ComponentConfig, isPersistent: boolean = true): boolean {
		const isVisibilityMismatch = !shouldRenderComponent(config, componentConfig);
		const isTypeMismatch = isPersistent !== componentConfig.isPersistent;

		if (isVisibilityMismatch || isTypeMismatch) {
			return false;
		}
		return true;
	}

	/**
	 * Détermine si un composant doit être rendu sur la page actuelle en fonction
	 * de la visibilité (publique/privée) de la page et du composant.
	 *
	 * Si la page est publique, seuls les composants publics sont rendus.
	 * Si la page est privée, seuls les composants privés sont rendus.
	 *
	 * @param {RouteConfig} config La configuration de la route actuelle.
	 * @param {ComponentConfig} componentConfig La configuration du composant à vérifier.
	 * @returns {boolean} Retourne true si le composant doit être rendu, false sinon.
	 */
	export function shouldRenderComponent(config: RouteConfig, componentConfig: ComponentConfig): boolean {
		return config.isPublic === componentConfig.isPublic;
	}

	/**
	 * Ajoute une instance de composant au tableau des instances de composants.
	 *
	 * Cette méthode stocke l'instance de composant donnée dans le tableau
	 * componentInstances en utilisant le nom du composant fourni comme clé.
	 * Cela permet de retrouver et de gérer facilement les instances de composants
	 * associées à la page.
	 *
	 * @param {Record<ComponentName | string, BaseComponent>} componentInstances - Le tableau des instances de composants de la page actuelle.
	 * @param {ComponentName} componentName - Le nom du composant.
	 * @param {BaseComponent} componentInstance - L'instance du composant à stocker.
	 */
	export function addToComponentInstances(componentInstances: Record<ComponentName | string, BaseComponent>, componentName: ComponentName | string, componentInstance: BaseComponent): void {
		componentInstances[componentName] = componentInstance;
	}

	/**
	 * Retourne l'instance d'un composant par son nom.
	 *
	 * Cherche l'instance du composant enregistrée dans
	 * la propriété componentInstances de la page en utilisant le nom
	 * du composant comme clé.
	 * Si l'instance est trouvée, la retourne, sinon retourne undefined.
	 *
	 * @template T Le type de l'instance du composant attendue.
	 * @param {Record<ComponentName | string, BaseComponent>} componentInstances Le tableau des instances de composants de la page actuelle.
	 * @param {string} name Le nom du composant à retrouver.
	 * @returns {T | undefined} L'instance du composant trouvée, ou undefined si pas trouvée.
	 */
	export function getComponentInstance<T>(componentInstances: Record<ComponentName | string, BaseComponent>, componentName: ComponentName | string): T | undefined {
		return componentInstances[componentName] as T;
	}