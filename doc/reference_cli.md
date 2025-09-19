# API & WebSocket Reference

## Auth
- GET /api/me
- GET /api/validate-session/:id
- POST /api/auth/register
- POST /api/auth/login
<!-- - POST /api/auth/2FAsend/:method -->
<!-- - POST /api/auth/2FAreceive/:method -->
<!-- - POST /api/auth/google -->
- POST /api/auth/logout

## Game
- POST /api/game/playgame
- GET /api/user/:id/games

<!-- ## Tournament
- POST /api/game/new_tournament
- POST /api/game/start_tournament
- POST /api/game/dismantle_tournament
- POST /api/tournament/update_tournament_games
- POST /api/game/leave_tournament
- POST /api/game/join_tournament
- POST /api/game/player_ready
- GET /api/game/tournaments/:tournamentID -->

## WebSocket Messages
- start_game
- decount_game
- end
- GameData
- msg

---







- GET /api/users/:userID


### GET /api/users/:userID
Fetches a user by their ID.

**Params:**  
- `userID`: User ID

**Returns:**  
- 200 OK: User object
- 404 Not Found: User not found

---



## Auth

### GET /api/me
Gets the currently authenticated user.
**Headers:**  
- Requires valid authentication (JWT token or session cookie)

**Returns:**  
- 200 OK: User object (with email and other details)
- 401 Unauthorized: If not authenticated or session expired

---

### GET /api/validate-session/:id
Validates the session of a user by their ID.

**Params:**  
- `id`: User ID

**Headers:**  
- Requires valid authentication (JWT token or session cookie)

**Returns:**  
- 200 OK: `{ "valid": true }` if the session is valid
- 200 OK: `{ "valid": false }` if the session is not valid
- 401 Unauthorized: If not authenticated

---

### POST /api/auth/register
Registers a new user.

**Body:**  
- FormData containing user registration fields (e.g., username, password, email, etc.)

**Returns:**  
- 200 OK: `{ user: User, ... }` if registration succeeds
- 400 Bad Request: `{ errorMessage: string }` if registration fails

---

### POST /api/auth/login
Logs in a user.

**Body:**  
```json
{
  "username": "string",
  "password": "string"
}
```

**Returns:**  
- 200 OK: `{ user: User, ... }` if login succeeds
- 200 OK: `{ user: User, active2Fa: true, ... }` if 2FA required
- 400 Bad Request: `{ errorMessage: string }` if login fails

---

### POST /api/auth/2FAsend/:method
Sends a 2FA code to the user.

**Params:**  
- `method`: Two-factor authentication method (e.g., "email", "sms", "app")

**Body:**  
```json
{
  "username": "string",
  // other required fields
}
```

**Returns:**  
- 200 OK: Confirmation or QR code URL (if applicable)
- 400 Bad Request: `{ errorMessage: string }` if sending fails

---

### POST /api/auth/2FAreceive/:method
Verifies the 2FA code for a user.

**Params:**  
- `method`: Two-factor authentication method

**Body:**  
```json
{
  "username": "string",
  "code": "string"
}
```

**Returns:**  
- 200 OK: `{ user: User, ... }` if verification succeeds
- 400 Bad Request: `{ errorMessage: string }` if verification fails

---

### POST /api/auth/google
Logs in a user via Google OAuth.

**Body:**  
```json
{
  "id_token": "string"
}
```

**Returns:**  
- 200 OK: `{ user: User, ... }` if login succeeds
- 400 Bad Request: `{ errorMessage: string }` if login fails

---

### POST /api/auth/logout
Logs out the current user.

**Returns:**  
- 200 OK: `{ message: string }` if logout succeeds
- 400 Bad Request: `{ errorMessage: string }` if logout fails

---

## Game
<!-- a adapter ppour juste game local -->
### POST /api/game/playgame 
Starts matchmaking or a game.
**Body:**  
```json
{
  "type": "multi" | "local" | "tournament",
  "playerID": number,
  "tournamentID": number | undefined
}
```
**Returns:**  
- 200 OK: Game started, game info
- 400 Bad Request: Validation error

---

### GET /api/user/:id/games
Gets all games for a user.
**Params:**  
- `id`: User ID  
**Returns:**  
- 200 OK: List of games (array of game objects)
- 404 Not Found: User not found

---

## Tournament

  
  
### POST /api/game/new_tournament
Creates a new tournament.

**Body:**  
Tournament object (see your Tournament type for details)

**Returns:**  
- 200 OK: Tournament created
- 400 Bad Request: Error message

---


### POST /api/game/start_tournament
Starts a tournament.

**Body:**  
```json
{
  "type": "start_tournament",
  "playerID": number,
  "tournamentID": number
}
```
**Returns:**  
- 200 OK: Tournament started
- 400 Bad Request: Error message

---

### POST /api/game/dismantle_tournament
Dismantles a tournament (owner only).

**Body:**  
```json
{
  "type": "dismantle_tournament",
  "playerID": number,
  "tournamentID": number
}
```
**Returns:**    
- 200 OK: Tournament deleted
- 403 Forbidden: Not owner
- 404 Not Found: Tournament not found
- 400 Bad Request: Validation error

---

### POST /api/tournament/update_tournament_games
Updates tournament games after a round.
**Body:**  
```json
{
  "tournamentID": number
}
```
**Returns:**  
- 200 OK: Tournament games updated
- 404 Not Found: Tournament not found
- 400 Bad Request: Validation error

---

### POST /api/game/leave_tournament
Removes a user from a tournament lobby.

**Body:**  
```json
{
  "type": "tournament_lobby_update",
  "playerID": number,
  "tournamentID": number,
  "players": []
}
```
**Returns:**  
- 200 OK: User removed from tournament
- 400 Bad Request: Error message

---


### POST /api/game/join_tournament
Adds a user to a tournament lobby.

**Body:**  
```json
{
  "type": "tournament_lobby_update",
  "playerID": number,
  "tournamentID": number,
  "players": []
}
```
**Returns:**  
- 200 OK: User joined tournament
- 400 Bad Request: Error message

  ---


### POST /api/game/player_ready
Sets a user's ready status in a tournament.

**Body:**  
```json
{
  "type": "player_ready_update",
  "playerID": number,
  "tournamentID": number,
  "ready": boolean
}
```
**Returns:**  
- 200 OK: Ready status updated
- 400 Bad Request: Error message

---

  

### GET /api/game/tournaments/:tournamentID
Fetches a tournament by its ID.

**Params:**  
- `tournamentID`: Tournament ID

**Returns:**  
- 200 OK: Tournament object
- 404 Not Found: Tournament not found

---



## WebSocket Messages


### Endpoint
- `GET /ws` (WebSocket connection)

**Description:**  
Establishes a WebSocket connection for real-time communication (game events, player actions, etc.).

**Authentication:**  
- Requires user to be authenticated (session or JWT).

**On Connect:**  
- Adds the user to the server's WebSocket user list.

**On Close:**  
- Removes the user and player from the server lists.

**On Message:**  
- Receives and logs messages from the client (for game controls, chat, etc.).

---

### Example Usage (Node.js CLI)
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:4883/ws', {
  headers: { /* authentication headers if needed */ }
});

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'move', direction: 'up' }));
});

ws.on('message', (msg) => {
  console.log('Received:', msg);
});
```

---

### Message Types

- **move**: Send paddle movement
  ```json
  { "type": "move", "direction": "up" }
  ```
- **start_game**: Game started
- **decount_game**: Countdown before game starts
- **end**: Game ended
- **GameData**: Game state update
- **msg**: Informational message

---

**Summary:**  
- Reference `/ws` in your CLI docs if you use real-time features.
- Explain connection, authentication, and message types.
- Provide example usage for CLI/WebSocket clients.

### start_game
Sent when the game starts.
**Payload:**  
```json
{
  "type": "start_game",
  "gameID": number,
  "otherPlayer": { "id": number, "alias": string, ... }
}
```
**Client should:**  
- Initialize game UI
- Display opponent info

---

### decount_game
Countdown before game starts.
**Payload:**  
```json
{
  "type": "decount_game",
  "message": number, // seconds left
  "gameID": number
}
```
**Client should:**  
- Show countdown timer

---

### end
Game ended, send final score.
**Payload:**  
```json
{
  "type": "end",
  "score": [number, number]
}
```
**Client should:**  
- Display final score
- Show end game panel

---

### GameData
Regular game state updates (ball, paddles, score, etc.).
**Payload:**  
```json
{
  "type": "GameData",
  "score": [number, number],
  "ball": { "x": number, "y": number },
  "paddles": [{ "y": number }, { "y": number }],
  // ...other game state
}
```
**Client should:**  
- Update game canvas and score

---

### msg
Informational message.
**Payload:**  
```json
{
  "type": "msg",
  "msg": string
}
```
**Client should:**  
- Display message to...
