import { FastifyInstance } from 'fastify';
import {z } from 'zod';
import bcrypt from 'bcrypt';
import { insertUser } from '../db';
import { UserToRegister, GetUserForRegistration } from '../types';


// const userSchema = z.object({
//   pseudo: z.string(),
//   email: z.string().email(),
//   password: z.string(),
// });

// type User = z.infer<typeof userSchema>;

export async function authRoutes(app: FastifyInstance) {
	app.post('/api/auth/login', async (request, reply) => {
		return { message: 'Login à implémenter' };
	});

	app.post('/api/auth/register', async (request, reply) => {
		console.log("test\n");
		console.log(request.body);
		const safeRegister: z.ZodType<GetUserForRegistration> = z.object({
		// const safeRegister = z.object({
			pseudo : z.string(),
			email: z.string().email(),
			password: z.string(),
		});
		const result = safeRegister.safeParse(request.body);
		console.log("test 2 :");
		if (!result)
		{
			reply.status(400).send({ error: 'Invalid data' });
			return;
		};
		const validUser = result.data;
		if (validUser){
			validUser.password = await bcrypt.hash(validUser.password, 10);
			await insertUser(validUser);
		}
		console.log(validUser);
		return { message : 'new person register !'}
	});

}
