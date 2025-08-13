import { z } from 'zod';
import { TwoFaMethod} from '../../shared/types/user.types';
import { DB_CONST } from '../../shared/config/constants.config'; // ajuste le chemin si besoin

export const RegisterInputSchema = z.object({
	username : z.string(),
	email: z.string().email(),
	password: z.string().min(3),
});

export const LoginInputSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

export const TwoFAInputSchema = z.object({
	email: z.string().email(),
	pageName: z.string(),
});


export const ModUserInputSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  currPassword: z.string().min(3).nullable().optional(),
  newPassword: z.string().min(3).nullable().optional(),
  twoFaMethod: z.enum([
    DB_CONST.USER.ACTIVE_2FA.EMAIL_CODE,
    DB_CONST.USER.ACTIVE_2FA.QR_CODE,
    DB_CONST.USER.ACTIVE_2FA.DISABLED,
  ]).optional(),
});

export const FriendsInputSchema = z.object({
  friendId: z.number(),
});

export const NotificationInputSchema = z.object({
  userId: z.number(),
  receiverId: z.number(),
  content: z.string(),
});

export type ModUserInput = z.infer<typeof ModUserInputSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type TwoFAInput = z.infer<typeof TwoFAInputSchema>;
export type FriendInput = z.infer<typeof FriendsInputSchema>;
export type NotificationInput = z.infer<typeof NotificationInputSchema>;