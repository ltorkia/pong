// ===========================================
// ANIMATION SERVICE
// ===========================================
/**
 * Service gérant les effets d'animation de l'application.
 */
export class AnimationService {
	public animateNavbarIn: boolean = false;
	public animateNavbarOut: boolean = false;

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

	/**
	 * Transition de la navbar de la position cachée vers la position visible.
	 * 
	 * - Retire la classe '-translate-y-[--navbar-height]' pour annuler la translation vers le haut.
	 * - Ajoute la classe 'translate-y-0' pour appliquer la translation vers le bas.
	 * - Retire la classe 'translate-y-0' après 300ms.
	 * 
	 * @param {HTMLElement} container - Élément HTML de la navbar à transitionner.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	public async navbarTransitionIn(container: HTMLElement): Promise<void> {
		container.classList.remove('-translate-y-[--navbar-height]');
		container.classList.add('translate-y-0');
		setTimeout(() => container.classList.remove('translate-y-0'), 300);
	}
	
	/**
	 * Transition de la navbar de la position visible vers la position cachée.
	 *
	 * - Retire la classe 'translate-y-0' pour annuler la translation vers le bas.
	 * - Ajoute la classe '-translate-y-[--navbar-height]' pour appliquer la translation vers le haut.
	 * - Retire la classe '-translate-y-[--navbar-height]' après 300ms.
	 * - Attend 200ms pour que la transition soit terminée avant de continuer.
	 *
	 * @param {HTMLElement} container - Élément HTML de la navbar à transitionner.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */	
	public async navbarTransitionOut(container: HTMLElement): Promise<void> {
		container.classList.remove('translate-y-0');
		container.classList.add('-translate-y-[--navbar-height]');
		setTimeout(() => container.classList.remove('-translate-y-[--navbar-height]'), 300);
		await new Promise(resolve => setTimeout(resolve, 200));
	}

	/**
	 * Transition de la page vers l'entrée.
	 * 
	 * - Retire la classe 'scale-90' pour annuler le zoom-out.
	 * - Ajoute la classe 'scale-100' pour appliquer le zoom-in.
	 * - Retire la classe 'scale-100' après 300ms.
	 * 
	 * @param {HTMLElement} container - Élément HTML à transitionner.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	public async pageTransitionIn(container: HTMLElement): Promise<void> {
		container.classList.remove('scale-90');
		container.classList.add('scale-100');
		setTimeout(() => container.classList.remove('scale-100'), 300);
	}

	/**
	 * Transition de la page vers la sortie.
	 * 
	 * - Ajoute la classe 'scale-90' pour appliquer le zoom-out.
	 * - Retire la classe 'scale-90' après 300ms.
	 * - Attend 120ms pour que la transition soit terminée avant de continuer.
	 * 
	 * @param {HTMLElement} container - Élément HTML à transitionner.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	public async pageTransitionOut(container: HTMLElement): Promise<void> {
		container.classList.add('scale-90');
		setTimeout(() => container.classList.remove('scale-90'), 300);
		await new Promise(resolve => setTimeout(resolve, 120));
	}

	/**
	 * Transition du modal à l'entrée.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	public async modalTransitionIn(container: HTMLElement): Promise<void> {
		container.classList.remove('hidden');
		container.classList.remove('scale-100');
		container.classList.add('scale-90');
		container.getBoundingClientRect();
		container.classList.replace('scale-90', 'scale-100');
		await new Promise(resolve => setTimeout(resolve, 200));
	}

	/**
	 * Transition du modal en sortie.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	public async modalTransitionOut(container: HTMLElement): Promise<void> {
		container.classList.remove('scale-100');
		container.classList.add('scale-90');
		await new Promise(resolve => setTimeout(resolve, 200)); // attend la fin du scale
		container.classList.add('hidden');
	}
}