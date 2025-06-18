import { BasePage } from './BasePage';
import { router } from '../router/router';

export class LoginPage extends BasePage {

	constructor(container: HTMLElement) {
		super(container, '/templates/login.html');
	}
	
	protected attachListeners(): void {
		
		const form: HTMLElement | null = document.getElementById('login-form');
		
		if (!(form instanceof HTMLFormElement)) {
			console.error('Formulaire non trouvé ou invalide');
			return;
		}

		form.addEventListener('submit', async (event: Event): Promise<void> => {
			event.preventDefault();

			const formData: FormData = new FormData(form);
			const data: Record<string, string> = Object.fromEntries(formData.entries()) as Record<string, string>;

			try {
				const response = await fetch('/api/auth/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
					credentials: 'include'
				});

				const result = await response.json();
				if (!response.ok || result.errorMessage) {
					console.error('Erreur d’authentification :', result);
					alert(result.errorMessage || result.message || 'Erreur inconnue');
					return;
				}

				console.log('Utilisateur connecté :', result);
				alert('Connexion réussie !');

				// Redirection SPA vers home
                router.navigate('/');

			} catch (err) {
				console.error('Erreur réseau ou serveur', err);
				alert('Erreur réseau.');
			}
		});

	}
}
