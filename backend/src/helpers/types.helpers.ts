import { camelCase, mapKeys } from 'lodash';
import { ZodSchema } from 'zod';
import { ParsingError} from '../types/utils.types';
import {FastifyRequest} from 'fastify';

/**
 * Transforme un objet dont les clefs sont en snake_case en un objet
 * dont les clefs sont en camelCase.
 * Permet de mapper les objets provenant de la BDD vers les objets
 * de type UserModel, SafeUserModel etc.
 * 
 * @param {Object} obj - L'objet a transformer
 * @returns {Object | null} L'objet transformé ou null si l'objet est null
 */
export function snakeToCamel<T>(obj: T): T | null {
	if (!obj) {
		return null
	};
	return mapKeys(obj, (_value: unknown, key: string) => camelCase(key)) as T;
}

/**
 * Transforme un tableau d'objet dont les clefs sont en snake_case en un tableau
 * d'objet dont les clefs sont en camelCase.
 * Permet de mapper les tableaux d'objet provenant de la BDD vers les tableaux
 * d'objet de type UserModel, SafeUserModel etc.
 * 
 * @param {Array<Object | null> | null | undefined} arr - Le tableau a transformer
 * @returns {Array<Object | null> | null} Le tableau transforme ou null si le tableau est null
 */
export function snakeArrayToCamel<T extends object>(arr: (T | null)[] | null | undefined): (T | null)[] | null {
	if (!arr) {
		return null;
	}
	return arr.map(item => snakeToCamel(item));
}

export function isParsingError(obj: unknown): obj is ParsingError {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'statusCode' in obj &&
		'errorMessage' in obj
	);
}

export async function checkParsing<T>(schema: ZodSchema<T>, body: unknown): Promise<T | ParsingError> {
  const result = await schema.safeParseAsync(body); // safeParseAsync recommandé si schema asynchrone
  if (!result.success) {
	const error = result.error.errors[0];
	console.log(error);
	return {
	  statusCode: 400,
	  errorMessage: `${error.message} in ${error.path.join('.')}`,
	};
  }
  return result.data;
}

	export async function adaptBodyForPassword(request: FastifyRequest): Promise<Record<string, any> | void>
	{
		const body = request.body as Record<string, any>; //c est bon any ?
				// Renommage explicite pour etre ok avec ts et js
				if ("curr-password" in body) {
					body["currPassword"] = body["curr-password"];
					delete body["curr-password"];
				}

				if ("new-password" in body) {
					body["newPassword"] = body["new-password"];
					delete body["new-password"];
				}

				if(body["currPassword"] == '')
					body["currPassword"] = null;
				if(body["newPassword"] == '')
					body["newPassword"] = null;
		return (body);
	}