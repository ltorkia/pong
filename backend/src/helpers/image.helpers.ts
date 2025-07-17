import { insertAvatar } from '../db/usermaj';
import { UserPassword, AvatarResult } from '../types/user.types';
import { AvatarMimeType } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur
import { IMAGE_CONST } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { MultipartFile } from '@fastify/multipart';
import { Buffer } from 'buffer';
import path from 'node:path';
import fs from 'node:fs'; // pour commande creation de dossier
import { FastifyReply } from 'fastify';

/**
 * Convertit un flux en un tampon.
 * @param {NodeJS.ReadableStream} stream - Le Flux Node.js lisible.
 * @returns {Promise<Buffer>} Un tampon contenant les données du flux.
 */
export async function bufferizeStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
	}
	return Buffer.concat(chunks);
}

/**
 * Enregistre un avatar à partir d'un tampon.
 * @param {Partial<UserPassword>} user - Informations de l'utilisateur.
 * @param {MultipartFile} avatarFile - Fichier envoyé contenant l'avatar.
 * @param {Buffer} buffer - Tampon contenant les données du fichier.
 * @returns {Promise<AvatarResult>} Une promesse qui se résout avec un objet { success: boolean, errorMessage?: string, statusCode?: number }.
 * Si success est à false, un message d'erreur est fourni, ainsi qu'un code d'erreur HTTP.
 */
export async function GetAvatarFromBuffer(reply: FastifyReply, user: Partial<UserPassword>, avatarFile: MultipartFile, buffer: Buffer): Promise<AvatarResult> {
	try {
		const avatarType = avatarFile.mimetype as AvatarMimeType;
		if (!(avatarType in IMAGE_CONST.EXTENSIONS)){

			return reply.status(400).send({
				success: false,
				statusCode: 400,
				errorMessage: IMAGE_CONST.ERRORS.TYPE_ERROR,
			});
		}
			// return { success: false, errorMessage: IMAGE_CONST.ERRORS.TYPE_ERROR, statusCode: 400 };
		if (buffer.length > IMAGE_CONST.MAX_SIZE) {
			return reply.status(400).send({
				success: false,
				statusCode: 400,
				errorMessage: IMAGE_CONST.ERRORS.SIZE_LIMIT,
			});
			// return { success: false, errorMessage: IMAGE_CONST.ERRORS.SIZE_LIMIT, statusCode: 400 };
		}

		const filename = (user.username! + IMAGE_CONST.EXTENSIONS[avatarType]).toLowerCase();
		const resolvedPath = path.resolve(`.${IMAGE_CONST.ROUTE_API}`);
		const filepath = path.join(resolvedPath, filename);

		try {
			await fs.promises.mkdir(IMAGE_CONST.ROUTE_API, { recursive: true });
			await fs.promises.writeFile(filepath, buffer);
			await insertAvatar(filename, user.username!);
			return { success: true };
		} catch (err) {
			console.error('Erreur lors de l’enregistrement de l’avatar :', err);
			return { success: false, errorMessage: 'Error uploading avatar', statusCode: 500 };
		}
	} catch (error) {
		console.error('Erreur dans GetAvatarFromBuffer:', error);
		throw error
	}
}