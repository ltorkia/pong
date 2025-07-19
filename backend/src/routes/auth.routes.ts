import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { RegisterInput, RegisterInputSchema, LoginInputSchema } from '../types/zod/auth.zod';
import { insertUser, getUser, getUserP, getUser2FA } from '../db/user';
import { insertAvatar , eraseCode2FA, insertCode2FA} from '../db/usermaj';
import { ProcessAuth, clearAuthCookies } from '../helpers/auth.helpers';
import { GetAvatarFromBuffer, bufferizeStream } from '../helpers/image.helpers';
import { GoogleUserInfo, UserPassword, User2FA, FastifyFileSizeError } from '../types/user.types';
import { UserModel } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur
import { DB_CONST } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { Buffer } from 'buffer';
import nodemailer from 'nodemailer';

async function doubleAuth(app: FastifyInstance) {
    app.post('/2FAsend', async (request: FastifyRequest, reply: FastifyReply) => {
        const user = await LoginInputSchema.safeParse(request.body);
        if (!user.success) {
            const error = user.error.errors[0];
            console.log(error);
            return reply.status(400).send({
                statusCode: 400,
                errorMessage: error.message + " in " + error.path
            });
        }
        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            const resInsert = await insertCode2FA(user.data.email, code);
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
                to: user.data.email,
                subject: 'Votre code de vérification',
                text: `Votre code est : ${code}`,
            });
            return (reply.status(200).send({
                statusCode: 200,
                message: 'Code 2FA envoyé avec succès.'
            }));
        } catch (err) {
            console.log(err)
            request.log.error(err);
            return reply.status(500).send({
                statusCode: 500,
                errorMessage: 'Erreur serveur lors de l\'envoi 2FA'
            });
        }
    });

    app.post('/2FAreceive', async (request: FastifyRequest, reply: FastifyReply) => {
        const result = LoginInputSchema.safeParse(request.body); //c est le meme format que pour login input avec les memes checks
        if (!result.success) {
            const error = result.error.errors[0];
            return reply.status(400).send({
                statusCode: 400,
                errorMessage: error.message + " in " + error.path
            });
        }
        const checkUser: User2FA = await getUser2FA(result.data.email);
        if (!checkUser)
            return (reply.status(400).send({ message: "email doesn't exist" }));
        eraseCode2FA(checkUser.email);
        if (checkUser.code2FaExpireAt < Date.now())
            return (reply.status(400).send({ message: "Timeout" }));
        if (result.data.password != checkUser.code2Fa)
            return (reply.status(400).send({ message: "Wrong code" }));

        const user: UserModel | null = await getUser(null, result.data.email);
        if (!user) {
            return reply.status(500).send({
                statusCode: 500,
                errorMessage: 'Impossible de récupérer l’utilisateur après insertion'
            });
        }
        await ProcessAuth(app, checkUser, reply);
        return reply.status(200).send({
            statusCode: 200,
            message: 'Successfully logged in.',
            user: user
        });
    });
}

// export async function formdataParsing(request: FastifyRequest, reply: FastifyReply) => {
// try {
// 			const elements = await request.parts({
// 				limits: {
//     			fileSize: 5 * 1024 * 1024}
// 			}); //separe les differents elements recuperes

// 			let dataText: Record<string, string> = {}; //stockera les elements textes
// 			// const fs = require('node:fs') //permet de creer dossier et fichiers
// 			// const { pipeline } = require('node:stream/promises') //pour transferer fichier ? 
// 			let avatarFile; //stockera le file de l avatar


// 			//preparsing qui dispatch datatext d un cote et l avatar de l autre
// 			for await (const element of elements) {
// 				console.log(element);
// 				if (element.type === 'file' && element.fieldname === 'avatar' && element.filename != '') {
// 					avatarFile = element;
// 					break ;
// 				} else if (element.type === 'field' && typeof element.value === 'string') {
// 					dataText[element.fieldname] = element.value;
// 				}
// 			}

// 			//check les datas texts pour voir si elles correspondent a ce qu on attend
// 			const result = RegisterInputSchema.safeParse(dataText);
// 			// const result = RegisterInputSchema.safeParse(request.body);
// 			if (!result.success) {
// 				const error = result.error.errors[0];
// 				return reply.status(400).send({ statusCode: 400, errorMessage: error.message + " in " + error.path });
// 			}
// 		} catch (err) {
// 			request.log.error(err);
// 			return reply.status(500).send({
// 				errorMessage: 'Erreur serveur lors de l\'inscription',
// 			});
// 		}
		

// }

export async function authRoutes(app: FastifyInstance) {
	// REGISTER
	app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const elements = await request.parts({
				limits: {
    			fileSize: 5 * 1024 * 1024}
			}); //separe les differents elements recuperes

			let dataText: Record<string, string> = {}; //stockera les elements textes
			let avatarFile; //stockera le file de l avatar
			let avatarBuffer: Buffer | null = null; //buffer de l'avatar pour la sauvegarde en deux parties


			//preparsing qui dispatch datatext d un cote et l avatar de l autre
			for await (const element of elements) {
				// console.log(element);
				if (element.type === 'file' && element.fieldname === 'avatar' && element.filename != '') {
					avatarFile = element;
					avatarBuffer = await bufferizeStream(element.file);
				} else if (element.type === 'field' && typeof element.value === 'string') {
					dataText[element.fieldname] = element.value;
				}
			}

			//check les datas texts pour voir si elles correspondent a ce qu on attend
			const result = RegisterInputSchema.safeParse(dataText);
			if (!result.success) {
				const error = result.error.errors[0];
				return reply.status(400).send({ statusCode: 400, errorMessage: error.message + " in " + error.path });
			}
			//on cree l user avec les donnees a inserer une fois le safeparse effectue
			let userToInsert = result.data as RegisterInput; //datatext

			//on hash le password dans un souci de confidentialite
			userToInsert.password = await bcrypt.hash(userToInsert.password, 10);

			const resultinsert = await insertUser(userToInsert, null);
			if (resultinsert.statusCode !== 201) {
				return reply.status(resultinsert.statusCode).send({
					statusCode: resultinsert.statusCode,
					errorMessage: resultinsert.message || 'Erreur lors de l’insertion de l’utilisateur',
				});
			}

			const user: UserModel = await getUser(null, userToInsert.email);
			if (avatarFile && avatarBuffer) {
				GetAvatarFromBuffer(reply, user, avatarFile, avatarBuffer)
			}

			if (!user.active2Fa) {
				await ProcessAuth(app, { id: user.id, username: user.username }, reply);
			}

			return reply.status(200).send({
				statusCode: 200,
				message: 'Successful registration.'
			});

			
		} catch (err) {

			const e = err as FastifyFileSizeError;

			request.log.error(err);
			if (e.code === 'FST_REQ_FILE_TOO_LARGE') {
    			return (reply.status(413).send({ errorMessage: "Fichier trop volumineux (max 5 Mo)" }));}
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de l\'inscription',
			});
		}
	});

	// LOGIN
	app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const result = LoginInputSchema.safeParse(request.body);

			if (!result.success) {
				const error = result.error.errors[0];
				return reply.status(400).send({
					statusCode: 400,
					errorMessage: error.message + " in " + error.path
				});
			}

			const validUser: UserPassword | null = await getUserP(result.data.email);
			if (!validUser) {
				return reply.status(401).send({
					statusCode: 401,
					errorMessage: 'Email invalid or unknown.'
				});
			}

			if (validUser && validUser.registerFrom === DB_CONST.USER.REGISTER_FROM.GOOGLE) {
				return reply.status(402).send({
					statusCode: 402,
					errorMessage: 'Email already register from Google.'
				});
			}

			const isPassValid = await bcrypt.compare(result.data.password, validUser.password);
			if (!isPassValid) {
				return reply.status(401).send({
					statusCode: 401,
					errorMessage: 'Password does not match.'
				});
			}

			const user: UserModel = await getUser(validUser.id);
			if (!user.active2Fa) {
				await ProcessAuth(app, validUser, reply);
			}

			return reply.status(200).send({
				statusCode: 200,
				user: user,
				message: 'All infos are correct.'
			});
			
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				statusCode: 500,
				errorMessage: 'Erreur serveur lors de la connexion',
			});
		}
	});
	doubleAuth(app); //si deja fait voir si on genere pas un cookie type pour pas avoir a le refaire une seconde fois quand on se log sur le mm ordi


	// LOGOUT
	app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
		clearAuthCookies(reply);
		return reply.status(200).send({
			statusCode: 200,
			message: 'Déconnecté'
		});
	});

	app.post('/google', async (request: FastifyRequest, reply: FastifyReply) => {
		const { id_token } = request.body as { id_token: string };
		if (!id_token) {
			return reply.status(400).send({ errorMessage: 'Token Google manquant' });
		}

		try {
			// Vérification rapide du token Google (signature, audience, expiration)
			const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
			if (!verifyRes.ok) {
				return reply.status(401).send({ errorMessage: 'Token Google invalide' });
			}
			const payload = await verifyRes.json() as {
				email: string;
				aud: string;
			};

			if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
				return reply.status(401).send({ errorMessage: 'Token Google non destiné à cette application' });
			}

			// Décodage du JWT Google (pour extraire given_name, picture, etc.)
			const parts = id_token.split('.');
			if (parts.length !== 3) {
				return reply.status(400).send({ errorMessage: 'Format de token invalide' });
			}

			const payloadDecoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as GoogleUserInfo;

			const email = payloadDecoded.email;
			const username = payloadDecoded.givenName ?? payloadDecoded.name?.split(' ')[0] ?? 'GoogleUser';
			const avatar = payloadDecoded.picture ?? DB_CONST.USER.DEFAULT_AVATAR;
			let user = await getUserP(email);
			if (user && user.password) {
				return reply.status(403).send({ errorMessage: 'Account already registered with a local password.' });
			}

			if (!user) {
				await insertUser({ email, username }, true);
				user = await getUserP(email);
				if (!user) {
					return reply.status(500).send({ errorMessage: 'An error occurred while creating your Google account.' });
				}
			}
			// On update l'avatar Google en bdd à chaque reconnexion
			await insertAvatar(avatar, username);

			await ProcessAuth(app, user, reply);
			const userData: UserModel = await getUser(null, email);
			return reply.status(200).send({
				statusCode: 200,
				message: 'Connexion Google réussie',
				user: userData
			});

		} catch (err) {
			console.error('Erreur Google Sign-In:', err);
			return reply.status(500).send({ errorMessage: 'Erreur serveur' });
		}
	});
}