import { currentService, notifService } from './user.service';
import { AppNotification } from '../../shared/models/notification.model';
import type { NotificationModel } from '../../shared/types/notification.types';
import { isNotificationModel } from '../../shared/utils/app.utils';

export class WebSocketService {
	private webSocket: WebSocket | undefined;

	public getWebSocket() {
		return this.webSocket;
	}

	public async openWebSocket() {
		this.webSocket = new WebSocket(`${location.origin}/api/ws/`);

		if (!this.webSocket)
			console.log("Websocket problem");
		else
			console.log("WEBSOCKET CONNECTED!");

		this.webSocket.onmessage = async (event) => {
			const dataArray = JSON.parse(event.data);
			if (Array.isArray(dataArray) 
				&& dataArray.every(isNotificationModel)) {
				const data = dataArray as NotificationModel[];
				const formatedData = AppNotification.fromJSONArray(data) as AppNotification[];
				console.log('Notification reçue:', formatedData);
				await notifService.handleNotifications(formatedData);
			}
		};
	}

	public webSocketHandler() {
		if (this.webSocket)
			this.webSocket.onclose = () => console.log("websocket closed");
	}
	
	constructor() {
		if (currentService.getCurrentUser())
			this.openWebSocket();
	}
}
