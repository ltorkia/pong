import { FastifyInstance } from 'fastify';
import {z } from 'zod';
import bcrypt from 'bcrypt';
import { insertUser } from '../db';
import { UserToRegister, GetUserForRegistration } from '../types';
import { safeRegister } from '../ztypes';

export async function authRoutes(app: FastifyInstance) {
	app.post('/api/auth/login', async (request, reply) => {
		return { message: 'Login à implémenter' };
	});

	app.post('/api/auth/register', async (request, reply) => {
		console.log(request.body);
		const result = safeRegister.safeParse(request.body);
		// console.log("Résultat de safeParse :", result);
		if (!result.success)
		{
			// console.log("Error de Zod = ", result.error.errors[0].path, " : ", result.error.errors[0].message);
			reply.status(400).send({
				errorPath: result.error.errors[0].path,
				errorMessage: result.error.errors[0].message});
			return;
		}
		const validUser = result.data;
		validUser.password = await bcrypt.hash(validUser.password, 10);
		const resultinsert = await insertUser(validUser);
		reply.status(resultinsert.statusCode).send(resultinsert.message);
		return;
	});
}
