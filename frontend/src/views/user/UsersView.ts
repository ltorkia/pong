import { BaseView } from '../BaseView';
import { userApi } from '../../api/user.api';
import { UserRowComponent } from '../../components/user/users/UserRowComponent';

export class UsersView extends BaseView {
	protected usersComponents = [];

	constructor(container: HTMLElement) {
		super(container, '/templates/user/users.html');
	}

	protected async mount() {
		const users = await userApi.getUsers();
		const userList = document.getElementById('user-list');

		if (userList) {
			for (const user of users) {
				let tempContainer = document.createElement('tbody');
				const rowComponent = new UserRowComponent(tempContainer, user);
				await rowComponent.render();

				const tr = tempContainer.querySelector('tr');
				if (tr) {
					userList.appendChild(tr);
				}
			}
		}
	}
}