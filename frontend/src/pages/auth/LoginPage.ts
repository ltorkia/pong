import { BasePage } from '../BasePage';
import { RouteConfig } from '../../types/routes.types';
import { User } from '../../models/user.model';
import { getHTMLElementById } from '../../helpers/dom.helper';

export class LoginPage extends BasePage {

	constructor(config: RouteConfig, container: HTMLElement, currentUser: User | null) {
		super(config, container, currentUser);
	}

	protected attachListeners(): void {
		const form = getHTMLElementById('login-form') as HTMLFormElement;
		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			const formData = new FormData(form);
			const data = Object.fromEntries(formData.entries()) as Record<string, string>;
			await this.userController.loginController(data);
		});
	}
}
