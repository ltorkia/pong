# 🏓 Pong Game - 42 Project

## General Architecture

### Technical Constraints
- **Single Page Application (SPA)**: Smooth navigation with full browser history support (Back/Forward buttons)
- **Docker Containerization**: The application runs with a single command: `docker compose up --build`

### Technologies
- **Frontend**: TypeScript + Tailwind CSS  
- **Backend**: Fastify with Node.js  
- **Database**: SQLite  
- **Containerization**: Docker  

---

## Pong Game

### Gameplay Features
- **Live Game**: Two players can compete in real-time Pong matches directly in the browser  
- **Shared Controls**: In local mode, both players use the same keyboard  
- **Remote Players Module**: Two players can play together remotely from different machines  
- **Strict Rules**: Equal paddle speed for all players  

### Full Local Tournament System
- **Multi-Player Tournament**: A complete system allowing multiple players to compete in successive rounds  
- **Clear Interface**: Visual display of who plays against whom and in what order  
- **Basic Registration System**:  
  - Each player must enter an alias before starting the tournament  
  - An alias can be linked to a registered user account  
- **Automatic Matchmaking**:  
  - Automatic organization of participants  
  - Announcement of the next match  
  - Match order management  

### Security
- **Password Hashing**: All stored passwords are hashed using bcrypt  
- **Attack Protection**:  
  - Protection against XSS (Cross-Site Scripting)  
  - Protection against SQL injections  
- **Universal HTTPS**:  
  - All connections use HTTPS  
  - WebSockets run over `wss`  
- **Input Validation**:  
  - Comprehensive validation for all user inputs  
- **Credential Management**:  
  - Environment variables, API keys, and credentials are stored in `.env` files  
  - `.env` files are ignored by git  

### Strict Development Rules
- **Prohibited**: Any library or tool that provides a complete, ready-made solution for an entire feature or module  
- **Allowed**: Small, lightweight libraries used only for specific, isolated sub-tasks within a larger feature  

---

## Validated Modules

- **Backend with Fastify Framework**  
- **Frontend with Tailwind CSS and TypeScript**  
- **SQLite Database**  
- **Standard User Management and Authentication**  
- **Two-Factor Authentication (2FA) and JWT**  
- **Remote Authentication via Google Sign-in**  
- **Server-side Game Implementation with API**  
- **Remote Players Support**  
- **Multi-device Compatibility**  
- **Cross-browser Support**  
- **Multilingual Support**  

---

## Project Structure

<pre>
.
├── backend
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── sql
│   │   └── init.sql
│   ├── src
│   │   ├── db
│   │   ├── helpers
│   │   ├── index.ts
│   │   ├── routes
│   │   └── types
│   ├── tsconfig.json
│   └── uploads
│       └── avatars
├── doc
│   ├── en.subject.pdf
│   └── reference_cli_register_and_game.md
├── docker-compose.dev.yml
├── docker-compose.yml
├── frontend
│   ├── Dockerfile.dev
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── public
│   │   ├── assets
│   │   └── templates
│   ├── src
│   │   ├── api
│   │   ├── app.ts
│   │   ├── components
│   │   ├── config
│   │   ├── pages
│   │   ├── router
│   │   ├── services
│   │   ├── styles
│   │   ├── types
│   │   └── utils
│   ├── tailwind.config.mjs
│   ├── tsconfig.json
│   └── vite.config.ts
├── Makefile
├── nginx
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── generate-cert.sh
│   ├── nginx.conf
│   └── nginx.dev.conf
├── README.md
├── shared
│   ├── config
│   ├── functions.ts
│   ├── models
│   ├── types
│   └── utils
└── sync-env.sh
</pre>

