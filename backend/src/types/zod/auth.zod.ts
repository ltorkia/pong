import { z } from 'zod';

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
	username: z.string().optional() ,
	email: z.string().email().optional(),
	currPassword: z.string().min(3).nullable().optional(),
	newPassword: z.string().min(3).nullable().optional(),
	active2FA: z.string().optional(),
});


export type ModUserInput = z.infer<typeof ModUserInputSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type TwoFAInput = z.infer<typeof TwoFAInputSchema>;