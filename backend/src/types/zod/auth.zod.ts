import { z } from 'zod';

export const RegisterInputSchema = z.object({
	username : z.string(),
	email: z.string().email(),
	password: z.string().min(3),
	question: z.coerce.number().int().min(1).max(3),
	answer: z.string(),
});

export const LoginInputSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

export const ModUserInputSchema = z.object({
	username : z.string(),
	email: z.string().email(),
	currPassword: z.string().min(3).nullable(),
	newPassword: z.string().min(3).nullable(),
	question: z.coerce.number().int().min(1).max(3),
	answer: z.string(),
});


export type ModUserInput = z.infer<typeof ModUserInputSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;