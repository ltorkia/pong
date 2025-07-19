import Fastify from 'fastify'
import { Lobby } from './game.types' // adjust the import

declare module 'fastify' {
  interface FastifyInstance {
    lobby: Lobby
  }
}