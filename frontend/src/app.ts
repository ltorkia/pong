import './styles/main.css';
import { router } from './router/router';
import { HomePage } from './pages/HomePage';

let appInstance: TranscendanceApp;

class TranscendanceApp {
	public router = router;

	constructor() {
		this.setupRoutes();
        this.router.navigate(location.pathname);
	}

	private setupRoutes() {
		this.router.register('/', () => {
			console.log('Accueil');
			const appDiv = document.getElementById('app');
			if (appDiv) {
				const homePage = new HomePage(appDiv);
				homePage.render();
			} else {
				console.error("La div #app est introuvable");
			}
		});
	
		this.router.register('/register', () => {
			console.log('Register');
			document.getElementById('app')!.innerHTML = `REGISTERRR`;
		});
	
		this.router.register('/login', () => {
			console.log('Login');
			document.getElementById('app')!.innerHTML = `LOGIN`;
		});
	
		this.router.register('/game', () => {
			console.log('Jeu');
			document.getElementById('app')!.innerHTML = `GAAAAME`;
		});
	}
}

document.addEventListener('DOMContentLoaded', () => {
	appInstance = new TranscendanceApp();
});
