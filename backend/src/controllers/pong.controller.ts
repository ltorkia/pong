import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../config/database';

interface GameState {
  player1: {
    position: number;
    score: number;
  };
  player2: {
    position: number;
    score: number;
  };
  ball: {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
  };
}

export const pongController = {
  // Get all matches
  getAllMatches: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const matches = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `SELECT m.*, 
           u1.display_name as player1_name, 
           u2.display_name as player2_name,
           u3.display_name as winner_name
           FROM matches m
           JOIN users u1 ON m.player1_id = u1.id
           JOIN users u2 ON m.player2_id = u2.id
           JOIN users u3 ON m.winner_id = u3.id
           ORDER BY m.played_at DESC`,
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      return reply.send(matches);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  },

  // Create a new match
  createMatch: async (request: FastifyRequest<{ Body: { player1Id: number; player2Id: number; player1Score: number; player2Score: number; winnerId: number } }>, reply: FastifyReply) => {
    try {
      const { player1Id, player2Id, player1Score, player2Score, winnerId } = request.body;
      
      const result = await new Promise<any>((resolve, reject) => {
        db.run(
          `INSERT INTO matches (player1_id, player2_id, player1_score, player2_score, winner_id)
           VALUES (?, ?, ?, ?, ?)`,
          [player1Id, player2Id, player1Score, player2Score, winnerId],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });
      
      return reply.status(201).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  },

  // Get active tournaments
  getActiveTournaments: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tournaments = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `SELECT * FROM tournaments 
           WHERE status = 'active' 
           ORDER BY created_at DESC`,
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      return reply.send(tournaments);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  },

  // Create tournament
  createTournament: async (request: FastifyRequest<{ Body: { name: string } }>, reply: FastifyReply) => {
    try {
      const { name } = request.body;
      
      const result = await new Promise<any>((resolve, reject) => {
        db.run(
          `INSERT INTO tournaments (name, status)
           VALUES (?, 'active')`,
          [name],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });
      
      return reply.status(201).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
};

// WebSocket handler for real-time game
export const setupGameWebSocket = (fastify: FastifyInstance) => {
  fastify.get('/ws/game', { websocket: true }, (connection, req) => {
    const gameState: GameState = {
      player1: { position: 50, score: 0 },
      player2: { position: 50, score: 0 },
      ball: { x: 50, y: 50, velocityX: 5, velocityY: 5 }
    };

    // Send initial game state
    connection.socket.send(JSON.stringify({ type: 'gameState', data: gameState }));

    // Handle messages from client
    connection.socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'playerMove') {
          if (data.player === 1) {
            gameState.player1.position = data.position;
          } else if (data.player === 2) {
            gameState.player2.position = data.position;
          }
          
          // Broadcast updated game state
          connection.socket.send(JSON.stringify({ type: 'gameState', data: gameState }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    // Handle disconnection
    connection.socket.on('close', () => {
      console.log('Client disconnected');
    });
  });
};