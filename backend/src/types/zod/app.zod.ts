import { z } from 'zod';
import { FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config';

export const NotificationInputSchema = z.object({
	from: z.number(),
	to: z.number(),
	type: z.enum([
		FRIEND_REQUEST_ACTIONS.ADD,
		FRIEND_REQUEST_ACTIONS.ACCEPT,
		FRIEND_REQUEST_ACTIONS.DELETE,
		FRIEND_REQUEST_ACTIONS.BLOCK,
	]),
	content: z.string().optional(),
});

export const NotifInputSchema = z.object({
	notifId: z.number(),
	friendId: z.number(),
});

export type NotificationInput = z.infer<typeof NotificationInputSchema>;
export type NotifInput = z.infer<typeof NotifInputSchema>;