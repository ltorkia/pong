import { FastifyInstance, FastifyReply } from 'fastify';

export function generateJwt(app: FastifyInstance, user: { id: number; email: string; name: string; avatar?: string }) {
	return app.jwt.sign(user, { expiresIn: '7d' });
}

export function setAuthCookie(reply: FastifyReply, token: string) {
	reply.setCookie('auth_token', token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: 60 * 60 * 24 * 7,
	});
}