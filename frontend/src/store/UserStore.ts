export type User = {
	id: number;
	username: string;
};

export class UserStore {
	private user: User | null = null;

	public getCurrentUser(): User | null {
		return this.user;
	}

	public setCurrentUser(user: User) {
		this.user = user;
		localStorage.setItem('currentUser', JSON.stringify(user));
		console.log('[UserStore] Utilisateur stocké :', user.id);
	}

	public clearCurrentUser() {
		if (!this.user) {
			return;
		}
		this.user = null;
		localStorage.removeItem('currentUser');
		console.log('[UserStore] Utilisateur supprimé');
	}

	public restoreFromStorage(): void {
		const userJSON = localStorage.getItem('currentUser');
		if (userJSON) {
			try {
				const user: User = JSON.parse(userJSON);
				this.user = user;
				console.log('[UserStore] User restauré :', user.id);
			} catch {
				console.warn('[UserStore] JSON invalide dans localStorage');
				localStorage.removeItem('currentUser');
			}
		}
	}
}

export const userStore = new UserStore();