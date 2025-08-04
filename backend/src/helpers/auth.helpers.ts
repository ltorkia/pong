import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/jwt.types';
import { getUser } from '../db/user';
import { UserPassword } from '../types/user.types';
import { COOKIES_CONST, DB_CONST } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { insertCode2FAEmail, insertCode2FAQrcode, majLog } from '../db/usermaj';
import nodemailer from 'nodemailer';
import * as speakeasy from 'speakeasy';

/**
 * Génère un token JWT pour un utilisateur donné
 * @returns Token JWT signé valide 7 jours
 */
export function generateJwt(app: FastifyInstance, user: JwtPayload) {
	return app.jwt.sign(user, { expiresIn: '7d' });
}

/**
 * Génère un token JWT pour l'utilisateur, le stocke dans un cookie sécurisé
 * et met à jour le timestamp de la dernière connexion dans la base.
 * @param app Instance de Fastify
 * @param user Informations de l'utilisateur
 * @param reply Réponse HTTP
 */
export async function ProcessAuth(app: FastifyInstance, user: Partial<UserPassword>, reply: FastifyReply) {
	// const user = await getUser(null, userToGet);
	// Création d'un token JWT qui sera utilisé par le frontend pour les requêtes authentifiées
	// JWT = JSON Web Token = format pour transporter des informations de manière sécurisée entre deux parties, ici le frontend et le backend.
	const userId = user.id!;
	const username = user.username!;
	const token = generateJwt(app, {
		id: userId
	});
	setAuthCookie(reply, token);
	setStatusCookie(reply);
	await majLog(username, DB_CONST.USER.STATUS.ONLINE);
}

/**
 * Définit le cookie principal d'authentification (sécurisé, HttpOnly)
 * Ce cookie contient le vrai token JWT et n'est pas accessible en JavaScript
 * Personne ne peut s'emparer de la session d'un utilisateur.
 */
export function setAuthCookie(reply: FastifyReply, token: string) {
	reply.setCookie(COOKIES_CONST.AUTH.TOKEN_KEY, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: 60 * 60 * 24 * 7,
	});
}

/**
 * Définit le cookie compagnon pour indiquer la présence d'une session active
 * Ce cookie est lisible en JavaScript et permet d'éviter les appels API inutiles
 * Il ne contient aucune information sensible, juste un indicateur booléen.
 */
export function setStatusCookie(reply: FastifyReply) {
	reply.setCookie(COOKIES_CONST.AUTH.STATUS_KEY, COOKIES_CONST.AUTH.STATUS_VALUE, {
		path: '/',
		httpOnly: false,
		sameSite: 'none',
		secure: true,
		maxAge: 60 * 60 * 24 * 7, // 7 jours même durée que le cookie principal
	});
}
	// sameSite : 'lax',
/**
 * Supprime les cookies d'authentification lors de la déconnexion
 * Nettoie à la fois le cookie principal et le cookie compagnon
 */
export function clearAuthCookies(reply: FastifyReply) {
	// le cookie principal (token JWT)
	reply.clearCookie(COOKIES_CONST.AUTH.TOKEN_KEY, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax', 
		secure: true,
	});
	// sameSite : 'lax',
	
	// le cookie compagnon (statut)
	reply.clearCookie(COOKIES_CONST.AUTH.STATUS_KEY, {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure: true,
	});
}
// sameSite : 'lax',

/*propose un nouveau nom pour register*/
export async function searchNewName(username: string) {
	const now = Date.now();
	const digits = now.toString().split('');
	const len = digits.length;
	console.log( now + " " + digits + " " + len);
	
	for (let i = 0; i < len; i++)
	{
		if (i === 0)
			username += "_";
		username += digits[i];
		if (!await getUser(null, username))
			break ;
	}
	return username;
}

export async function GenerateQRCode(reply: FastifyReply, email: string)
{
	var secret = speakeasy.generateSecret();
	const secretTwoFa = secret.base32;
	const resInsert = insertCode2FAQrcode(email, secretTwoFa);
	if (!resInsert) {
		return reply.status(500).send({
			statusCode: 500,
			errorMessage: 'Erreur lors de l’insertion du code 2FA'
		});
	}
	return reply.status(200).send({statusCode: 200, otpauth_url: secret.otpauth_url})
}

export async function GenerateEmailCode(reply: FastifyReply, email: string)
{
	const code = Math.floor(100000 + Math.random() * 900000).toString();
	const resInsert = await insertCode2FAEmail(email, code);
	if (!resInsert) {
		return reply.status(500).send({
			statusCode: 500,
			errorMessage: 'Erreur lors de l’insertion du code 2FA'
		});
	}
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL_2FA,
			pass: process.env.PASS_EMAIL,
		},
	});

	await transporter.sendMail({
		from: '"Sécurité" <no-reply@transcendance.com>',
		to: email,
		subject: 'Votre code de vérification',
		text: `Votre code est : ${code}`,
	});
	return (reply.status(200).send({
		statusCode: 200,
		message: 'Code 2FA envoyé avec succès.'
	}));
}