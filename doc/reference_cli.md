# API & WebSocket Reference

## Api
- GET /api/me
- GET /api/validate-session/:id
- POST /api/auth/register
- POST /api/auth/2FAsend/:method
- POST /api/auth/2FAreceive/:method
- POST /api/auth/google
- POST /api/auth/logout

## Game
- POST /api/game/playgame
- GET /api/user/:id/games

## Tournament
- POST /api/tournament/dismantle_tournament
- POST /api/tournament/update_tournament_games

## WebSocket Messages
- start_game
- decount_game
- end
- GameData
- msg

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

### POST /api/tournament/dismantle_tournament
Dismantles a tournament (owner only).
**Body:**  
```json
{
  "tournamentID": number,
  "playerID": number
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

## WebSocket Messages

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
- Display message to