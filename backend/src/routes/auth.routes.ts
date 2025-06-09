import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { request as httpRequest } from 'undici';
import jwt from 'jsonwebtoken';

// Types pour les queries et réponses
interface GoogleCallbackQuery {
	code?: string;
	error?: string;
}

interface GoogleTokenResponse {
	access_token?: string;
	error?: string;
	error_description?: string;
}

interface GoogleUserInfo {
	id: string;
	email: string;
	name: string;
	picture: string;
}

export async function authRoutes(app: FastifyInstance) {
	// Route pour démarrer le flow Google OAuth2
	app.get('/google', async (request: FastifyRequest, reply: FastifyReply) => {
		const redirectUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
		redirectUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
		redirectUrl.searchParams.set('redirect_uri', process.env.GOOGLE_CALLBACK_URL!);
		redirectUrl.searchParams.set('response_type', 'code');
		redirectUrl.searchParams.set('scope', 'openid profile email');
		redirectUrl.searchParams.set('access_type', 'offline');
		redirectUrl.searchParams.set('prompt', 'consent');

		return reply.redirect(redirectUrl.toString());
	});

	// Route callback que Google appelle après login
	app.get('/google/callback', async (request: FastifyRequest<{ Querystring: GoogleCallbackQuery }>, reply: FastifyReply) => {
		try {
			const { code, error } = request.query;
			
			if (error) {
				return reply.status(400).send({ error: `Erreur OAuth: ${error}` });
			}
			
			if (!code) {
				return reply.status(400).send({ error: 'Code manquant' });
			}

			// Échange le code contre un access_token
			const tokenRes = await httpRequest('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					client_id: process.env.GOOGLE_CLIENT_ID!,
					client_secret: process.env.GOOGLE_CLIENT_SECRET!,
					redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
					grant_type: 'authorization_code',
					code,
				}).toString(),
			});
			
			const tokenData = await tokenRes.body.json() as GoogleTokenResponse;

			// Vérification des erreurs de l'API Google
			if (tokenData.error) {
				console.error('Erreur lors de l\'échange du code:', tokenData);
				return reply.status(400).send({ 
					error: 'Erreur lors de l\'authentification',
					details: tokenData.error_description 
				});
			}

			if (!tokenData.access_token) {
				return reply.status(400).send({ error: 'Access token manquant' });
			}

			// Récupère les infos utilisateur avec access_token
			const userRes = await httpRequest('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});
			
			const userData = await userRes.body.json() as GoogleUserInfo;

			// Vérification que les données utilisateur sont complètes
			if (!userData.id || !userData.email) {
				return reply.status(400).send({ error: 'Données utilisateur incomplètes' });
			}

			// TODO: Ici enregistrer ou lire l'utilisateur dans la DB

			// Génère un JWT
			const token = jwt.sign(
				{
					id: userData.id,
					email: userData.email,
					name: userData.name,
					avatar: userData.picture,
				},
				process.env.JWT_SECRET || 'qwertyuiop0123456789',
				{ expiresIn: '1h' }
			);

			// Redirige vers le frontend avec le token dans l'URL
			return reply.redirect(`${process.env.GOOGLE_REDIRECT_FRONTEND}?token=${token}`);
		} catch (error) {
			console.error('Erreur dans le callback Google:', error);
			return reply.status(500).send({ error: 'Erreur serveur' });
		}
	});

	// Routes login/register pour plus tard
	app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
		return { message: 'Login à implémenter' };
	});

	app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
		return { message: 'Register à implémenter' };
	});
}