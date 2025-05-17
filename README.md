# ft_transcendence - Pong Game

## Project Description
A multiplayer Pong game with tournament system, user management, live chat, and more!

## Setup and Installation

### Prerequisites
- Docker and Docker Compose

### Running the Project
```bash
# Build and start the containers
make up

# Stop the containers
make down

# View logs
make logs
```

## Project Structure
```
.
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker compose configuration
├── Makefile                    # Build commands
├── package.json                # Node.js dependencies
├── tsconfig.json               # TypeScript configuration
├── backend/                    # Fastify backend
│   ├── src/
│   │   ├── server.ts           # Main server file
│   │   ├── routes/             # API routes
│   │   ├── controllers/        # Route controllers
│   │   ├── models/             # Data models
│   │   ├── services/           # Business logic
│   │   ├── plugins/            # Fastify plugins
│   │   ├── utils/              # Utility functions
│   │   └── database/           # Database configuration
├── frontend/                   # TypeScript + Tailwind CSS frontend
│   ├── src/
│   │   ├── main.ts             # Entry point
│   │   ├── components/         # UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   ├── store/              # State management
│   │   ├── styles/             # SCSS styles
│   │   ├── utils/              # Utility functions
│   │   └── assets/             # Static assets
│   ├── public/                 # Public files
│   └── index.html              # HTML entry point
└── database/                   # SQLite database files
    └── migrations/             # Database migrations
```

## Features
- Real-time multiplayer Pong game
- Tournament system
- User authentication and profiles
- Live chat
- AI opponent
- Responsive design
- User statistics dashboard

## Modules Implemented
1. Framework (Major): Fastify with Node.js
2. Frontend Framework (Minor): Tailwind CSS with TypeScript
3. Database (Minor): SQLite
4. Standard User Management (Major)
5. Remote Players (Major)
6. Live Chat (Major)
7. AI Opponent (Major)
8. Support on all devices (Minor)
9. User and Game Stats Dashboards (Minor)

## Security Measures
- Password hashing
- SQL injection protection
- XSS protection
- HTTPS connection
- Form validation
- Environment variables for credentials
