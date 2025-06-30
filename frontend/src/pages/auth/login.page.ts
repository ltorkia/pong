import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { getHTMLElementById } from '../../utils/dom.utils';
import { userService } from '../../services/user.service';

export class LoginPage extends BasePage {

	constructor(config: RouteConfig) {
		super(config);
	}

	protected attachListeners(): void {
		const form = getHTMLElementById('login-form') as HTMLFormElement;
		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			const formData = new FormData(form);
			const data = Object.fromEntries(formData.entries()) as Record<string, string>;
			await userService.loginUser(data);
		});
	}
}
