// HomePageController.ts
import { router } from '../router/router';

export function attachHomePageListeners() {
	const registerButton = document.getElementById('register-button');
	const loginButton = document.getElementById('login-button');

	if (registerButton) {
		registerButton.addEventListener('click', () => {
			router.navigate('/register');
		});
	}

	if (loginButton) {
		loginButton.addEventListener('click', () => {
			router.navigate('/login');
		});
	}
}
