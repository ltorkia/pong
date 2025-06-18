import { BasePage } from './BasePage';

export class LoginPage extends BasePage {

	constructor(container: HTMLElement) {
		super(container, '/templates/login.html');
	}
	
	protected attachListeners(): void {
		
		const form = document.getElementById('login-form');
		
		if (!(form instanceof HTMLFormElement)) {
			console.error('Formulaire non trouvé ou invalide');
			return;
		}

		form.addEventListener('submit', async (event) => {
			event.preventDefault();

			const formData = new FormData(form);
			const data = Object.fromEntries(formData.entries());

			try {
				const response = await fetch('/api/auth/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});

				let result;
				try {
					result = await response.json();
				} catch {
					// La réponse n'est pas JSON valide
					alert('Erreur serveur : réponse invalide');
					return;
				}

				if (!response.ok) {
					console.error('Erreur d’authentification :', result);
					alert(`Erreur : ${result.errorMessage || result.message || 'Inconnue'}`);
					return;
				}

				console.log('Utilisateur connecté :', result);
				alert('Connexion réussie !');
			} catch (err) {
				console.error('Erreur réseau ou serveur', err);
				alert('Erreur réseau.');
			}
		});

	}
}
