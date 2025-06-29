import { User } from '../models/user.model';

// Classe de gestion de l’utilisateur courant (singleton)
export class UserStore {
	private currentUser: User | null = null;

	public getCurrentUser(): User | null {
		return this.currentUser;
	}

	public setCurrentUser(user: User) {
		this.currentUser = user;
		localStorage.setItem('currentUser', JSON.stringify(user.toPublicJSON()));
		console.log(`[${this.constructor.name}] Utilisateur stocké :`, user.id);
	}

	public clearCurrentUser() {
		if (!this.currentUser) return;
		this.currentUser = null;
		localStorage.removeItem('currentUser');
		console.log(`[${this.constructor.name}] Utilisateur supprimé`);
	}

	public restoreFromStorage(): User | null {
		this.currentUser = null;
		const userJSON = localStorage.getItem('currentUser');
		if (userJSON) {
			try {
				const raw = JSON.parse(userJSON);
				this.currentUser = User.fromJSON(raw);
				console.log(`[${this.constructor.name}] User restauré :`, this.currentUser.id);
			} catch {
				console.warn(`[${this.constructor.name}] JSON invalide dans localStorage`);
				localStorage.removeItem('currentUser');
			}
		}
		return this.currentUser;
	}
}

export const userStore = new UserStore();
