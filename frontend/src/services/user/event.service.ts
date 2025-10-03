// ============================================================================
// EVENT SERVICE
// ============================================================================
/**
 * Service de bus d'événements pour la communication découplée entre composants,
 * principalement pour la gestion des amis, affichage des boutons sur les pages de profil
 * et la liste des utilisateur.
 * Permet aux composants de s'abonner et d'émettre des événements sans se connaître.
 */

type EventCallback = (data?: any) => void | Promise<void>;

export class EventService {
	private events = new Map<string, Set<EventCallback>>();

	/**
	 * S'abonne à un événement.
	 * 
	 * @param {string} eventName - Nom de l'événement à écouter
	 * @param {EventCallback} callback - Fonction appelée quand l'événement est émis
	 */
	public on(eventName: string, callback: EventCallback): void {
		if (!this.events.has(eventName)) {
			this.events.set(eventName, new Set());
		}
		this.events.get(eventName)!.add(callback);
	}

	/**
	 * Se désabonne d'un événement.
	 * 
	 * @param {string} eventName - Nom de l'événement
	 * @param {EventCallback} callback - Fonction à retirer
	 */
	public off(eventName: string, callback: EventCallback): void {
		const callbacks = this.events.get(eventName);
		if (callbacks) {
			callbacks.delete(callback);
			if (callbacks.size === 0) {
				this.events.delete(eventName);
			}
		}
	}

	/**
	 * Émet un événement à tous les abonnés.
	 * 
	 * @param {string} eventName - Nom de l'événement à émettre
	 * @param {any} data - Données à transmettre aux abonnés
	 */
	public async emit(eventName: string, data?: any): Promise<void> {
		const callbacks = this.events.get(eventName);
		if (callbacks) {
			for (const callback of callbacks) {
				try {
					await callback(data);
				} catch (error) {
					console.error(`Erreur dans le handler de l'événement ${eventName}:`, error);
				}
			}
		}
	}

	/**
	 * Nettoie tous les listeners.
	 */
	public cleanup(): void {
		this.events.clear();
	}

	/**
	 * Affiche tous les événements enregistrés (debug).
	 */
	public debug(): void {
		console.log('=== Event Bus Debug ===');
		for (const [eventName, callbacks] of this.events.entries()) {
			console.log(`Event: ${eventName}, Listeners: ${callbacks.size}`);
		}
	}
}