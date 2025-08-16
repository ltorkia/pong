import { NotificationModel } from '../types/notification.types';	// en rouge car dossier local 'shared' != dossier conteneur
import type { FriendRequestAction } from '../types/notification.types';
import { FRIEND_REQUEST_ACTIONS } from '../config/constants.config';

// ===========================================
// APPNOTIFICATION MODEL
// ===========================================

export class AppNotification {

	constructor(
		public id: number,
		public from: number,
		public to: number,
		public type: FriendRequestAction,
		public content: string | null,
		public createdAt: string,
		public status: number
	) {}

	// ============================================================================
	// MÉTHODE DE SÉRIALISATION (OBJECT → JSON)
	// ============================================================================

	public toJSON(): NotificationModel {
		return {
			id: this.id,
			from: this.from,
			to: this.to,
			type: this.type,
			content: this.content,
			createdAt: this.createdAt,
			status: this.status
		};
	}

	// ============================================================================
	// MÉTHODE DE DÉSÉRIALISATION (JSON → OBJECT)
	// ============================================================================

	public static fromJSON(data: Partial<NotificationModel>): AppNotification {

		if (!data) {
			throw new Error('Données manquantes pour créer une notification');
		}

		return new AppNotification(
			data.id ?? 0,
			data.from ?? 0,
			data.to ?? 0,
			data.type ?? FRIEND_REQUEST_ACTIONS.DELETE,
			data.content ?? '',
			data.createdAt ?? '',
			data.status ?? 0
		);
	}

	// ============================================================================
	// MÉTHODES STATIQUES SUR TABLEAUX DE NOTIFS
	// ============================================================================

	public static fromJSONArray(notifs: Partial<NotificationModel>[]): AppNotification[] {
		return notifs.map(notif => this.fromJSON(notif));
	}

	public static toJSONArray(notifs: AppNotification[]): NotificationModel[] {
		return notifs.map(notif => notif.toJSON());
	}
}