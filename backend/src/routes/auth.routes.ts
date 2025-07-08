import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { RegisterInputSchema, LoginInputSchema } from '../types/zod/auth.zod';
import { insertUser, getUser, getUserP, majLastlog, eraseCode2FA, insertCode2FA, getUser2FA, insertAvatar } from '../db/user';
import { generateJwt, setAuthCookie, setStatusCookie, clearAuthCookies } from '../helpers/auth.helpers';
import { GoogleUserInfo, UserPassword, User2FA } from '../types/user.types';
import { UserModel } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur
import nodemailer from 'nodemailer';

async function ProcessAuth(app: FastifyInstance, user: Partial<UserPassword>, reply: FastifyReply) {
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
	await majLastlog(username);
}

import { MultipartFile } from '@fastify/multipart';
import fs from 'node:fs'; // pour commande creation de dossier
import { pipeline } from 'node:stream/promises'; // pour telechargement du fichier
// import { fileTypeFromStream } from 'file-type'; //pour checker si a la lecture du fichier on a ce qui est attendu en fonction du type


function CheckFormatAvatar(reply: FastifyReply, avatarFile: MultipartFile)
{
	const extension: Record<AvatarMimeType, string> = {
		'image/jpeg': '.jpeg',
		'image/png': '.png',
		'image/jpg': '.jpg',
		'image/webp': '.webp',
		'image/gif': '.gif'
	};
	const avatarType = avatarFile.mimetype as AvatarMimeType;
	if (!(avatarType in extension))
		return reply.status(400).send({ statusCode: "400", errorMessage: "file no supported" });
	else
		return;
}


type AvatarMimeType = 'image/jpeg' | 'image/png' | 'image/jpg' | 'image/webp' | 'image/gif';
async function GetAvatarFromFront(user: Partial<UserPassword>, reply: FastifyReply, avatarFile: MultipartFile) {

	// // check du format
	const extension: Record<AvatarMimeType, string> = {
		'image/jpeg': '.jpeg',
		'image/png': '.png',
		'image/jpg': '.jpg',
		'image/webp': '.webp',
		'image/gif': '.gif'
	};

	// //check format via mimetype, + a voir si on decide de lire le fichier aussi pour s assurer du truc 
	// // const fileStream = avatarFile.file;
	// // const detectedType = await fileTypeFromStream(fileStream);
	const avatarType = avatarFile.mimetype as AvatarMimeType;

	// // if (!detectedType || detectedType.mime != avatarType || !(avatarType in extension))
	// if (!(avatarType in extension))
	// 	return reply.status(400).send({ statusCode: "400", message: "file no supported" });

	// rename l image
	const filename = user.username! + extension[avatarType];

	// Telechargement de l avatar
	// const fileStreamNew = avatarFile.file;
	// const avatarBuffer = await fileStreamNew.toBuffer();
	await fs.promises.mkdir('./uploads/avatars/', { recursive: true });
	await pipeline(avatarFile.file, fs.createWriteStream(`./uploads/avatars/${filename}`))
	insertAvatar(filename, user.username!)
	return (reply.status(200).send({ statusCode: "200", message: "avatar added" }));
	// return reply.status(200).send({statusCode: "200", message:"avatar added"});	
}


const PORT = 3001;

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
        if (checkUser.code_2FA_expire_at < Date.now())
            return (reply.status(400).send({ message: "Timeout" }));
        if (result.data.password != checkUser.code_2FA)
            return (reply.status(400).send({ message: "Wrong code" }));

        const user: UserModel | null = await getUser(null, result.data.email);
        if (!user) {
            return reply.status(500).send({
                statusCode: 500,
                errorMessage: 'Impossible de récupérer l’utilisateur après insertion'
            });
        }
        ProcessAuth(app, checkUser, reply);
        return reply.status(200).send({
            statusCode: 200,
            message: 'Successfully logged in.',
            user: user
        });
    });
}

export async function authRoutes(app: FastifyInstance) {

	// REGISTER
	app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const elements = await request.parts(); //separe les differents elements recuperes
			let dataText: Record<string, string> = {}; //stockera les elements textes
			// const fs = require('node:fs') //permet de creer dossier et fichiers
			// const { pipeline } = require('node:stream/promises') //pour transferer fichier ? 
			let avatarFile; //stockera le file de l avatar


			//preparsing qui dispatch datatext d un cote et l avatar de l autre
			for await (const element of elements) {
				console.log(element);
				if (element.type === 'file' && element.fieldname === 'avatar' && element.filename != '') {
					avatarFile = element;
				} else if (element.type === 'field' && typeof element.value === 'string') {
					dataText[element.fieldname] = element.value;
				}
			}

			//check les datas texts pour voir si elles correspondent a ce qu on attend
			const result = RegisterInputSchema.safeParse(dataText);
			// const result = RegisterInputSchema.safeParse(request.body);
			if (!result.success) {
				const error = result.error.errors[0];
				return reply.status(400).send({ statusCode: 400, errorMessage: error.message + " in " + error.path });
			}
			//on cree l user avec les donnees a inserer une fois le safeparse effectue
			let userToInsert = result.data; //datatext

			//on hash le password dans un souci de confidentialite

			userToInsert.password = await bcrypt.hash(userToInsert.password, 10);

			//logique a ameliorer pour eviter de faire +ieurs requetes a la db MAIS EN ATTENDANT
			// >
			// on insere les donnes de l user dans la dbet on check si c est ok

			const resultinsert = await insertUser(userToInsert, null);
			if (resultinsert.statusCode !== 201) {
				return reply.status(resultinsert.statusCode).send({
					statusCode: resultinsert.statusCode,
					errorMessage: resultinsert.message || 'Erreur lors de l’insertion de l’utilisateur',
				});
			}

			// if (resultinsert.statusCode === 201) 
			// {
			const user: UserModel = await getUser(null, userToInsert.email);
			const userAuth: Partial<UserPassword> = {
				id: user.id,
				username: user.username
			}
			// !!!TODO PIPELINE A SECURISER PEUT FOUTRE LA MERDE
			if (avatarFile) {
				await GetAvatarFromFront(user, reply, avatarFile);
				return;
			}
			// si on veut skip la double auth -> decommenter ligne suivante
			// ProcessAuth(app, userAuth, reply);
			// 	return reply.status(200).send({
			// 		message: 'Successful registration.',
			// 		user: user,
			// 		statusCode: 200 // -> convention json pour donner toutes les infos au front
			// // if (resultinsert.statusCode !== 201) {
			// // 	return reply.status(resultinsert.statusCode).send({
			// // 		statusCode: resultinsert.statusCode,
			// // 		errorMessage: resultinsert.message || 'Erreur lors de l’insertion de l’utilisateur',
			// 	});
			// }
			// return reply.status(200).send({
			// 	statusCode: 200,
			// 	message: 'Successful registration.'
			// });
			return reply.status(200).send({
				statusCode: 200,
				message: 'Successful registration.'
			});
			// }
			// }

		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de l’inscription',
			});
		}
		return reply.status(200).send({
			statusCode: 200,
			message: 'Successful registration.'
		});
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

			if (validUser && validUser.register_from == 'google') {
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
			return reply.status(200).send({
				statusCode: 200,
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
			const username = payloadDecoded.given_name ?? payloadDecoded.name?.split(' ')[0] ?? 'GoogleUser';
			const avatar = payloadDecoded.picture ?? '';

			let user = await getUserP(email);
			if (user && user.password) {
				return reply.status(403).send({ errorMessage: 'Account already registered with a local password.' });
			}

			if (!user) {
				await insertUser({ email, username, avatar }, true);
				user = await getUserP(email);
				if (!user) {
					return reply.status(500).send({ errorMessage: 'An error occurred while creating your Google account.' });
				}
			}

			ProcessAuth(app, user, reply);
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