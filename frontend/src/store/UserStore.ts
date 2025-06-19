export type User = {
	id: number;
	username: string;
};

class UserStore {
	private user: User | null = null;

	getCurrentUser(): User | null {
		return this.user;
	}

	setCurrentUser(user: User) {
		this.user = user;
	}

	clearCurrentUser() {
		this.user = null;
	}
}

// Stocker notifications, préférences etc...

export const userStore = new UserStore();

export function initUserStore(rawUser: any): void {
	if (!userStore.getCurrentUser()) {
		const currentUser: User = {
			id: rawUser.id as number,
			username: rawUser.username as string
		};
		userStore.setCurrentUser(currentUser);
		
		// Sauvegarder dans localStorage (stringify)
		localStorage.setItem('currentUser', JSON.stringify(currentUser));

		console.log('[initUserStore] Utilisateur stocké :', currentUser.id);
	}
}
