import { z } from 'zod';
import { FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config';

export const NotificationInputSchema = z.object({
	id: z.number().optional(),
	from: z.number(),
	to: z.number(),
	type: z.enum([
		FRIEND_REQUEST_ACTIONS.ADD,
		FRIEND_REQUEST_ACTIONS.ACCEPT,
		FRIEND_REQUEST_ACTIONS.DELETE,
		FRIEND_REQUEST_ACTIONS.BLOCK,
	]),
	content: z.string().optional(),
	createdAt: z.string().optional(),
	status: z.number().optional()
});

export const NotifInputSchema = z.object({
	id: z.number(),
	to: z.number(),
	from: z.number(),
});

export type NotificationInput = z.infer<typeof NotificationInputSchema>;
export type NotifInput = z.infer<typeof NotifInputSchema>;