import { z } from 'zod';

export const RegisterInputSchema = z.object({
	username : z.string(),
	email: z.string().email(),
	password: z.string().min(3),
	// avatar: z.object(),
	question: z.coerce.number().int().min(1).max(3),
	answer: z.string(),
});

export const LoginInputSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});


export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;