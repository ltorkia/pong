# ft_transcendence

A real-time multiplayer Pong game with tournament capabilities, implemented as a single-page web application.

## Project Overview

ft_transcendence is a web-based implementation of the classic Pong game that allows users to play against each other in real-time. The project features a tournament system, user management, and various additional modules to enhance the gaming experience.

## Features

### Core Features
- Real-time multiplayer Pong game
- Tournament system with matchmaking
- User registration and management
- Single-page application with browser navigation support

### Technical Stack
- **Frontend**: TypeScript with Tailwind CSS and SCSS
- **Backend**: Node.js with Fastify framework
- **Database**: SQLite
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url> ft_transcendence
cd ft_transcendence
```

2. Create a `.env` file in the root directory based on the provided example:
```bash
cp .env.example .env
```

3. Build and start the application:
```bash
make
```

The application will be available at `http://localhost:3000`.

## Usage

### Playing Pong

1. Register with a username or log in if you already have an account
2. Join a game or create a tournament
3. Use the keyboard controls to move your paddle:
   - Player 1: [Controls TBD]
   - Player 2: [Controls TBD]

### Tournament Mode

1. Create or join a tournament
2. Wait for other players to join
3. Follow the matchmaking system to know when it's your turn to play
4. Compete to win the tournament!

## Project Structure

```
ft_transcendence/
├── docker-compose.yml       # Docker configuration
├── Makefile                 # Build and management commands
├── frontend/                # TypeScript frontend application
│   ├── src/                 # Source code
│   │   ├── components/      # Game components
│   │   ├── styles/          # SCSS styling
│   │   └── ...
│   └── ...
└── backend/                 # Fastify backend application
    ├── src/                 # Source code
    ├── database/            # SQLite database
    └── ...
```

## Security

This project implements several security measures:
- Password hashing
- Protection against SQL injections and XSS attacks
- HTTPS/WSS connections
- Form validation
- Secure credential storage

## Development

### Available Commands

```bash
# Build the application
make build

# Start the application
make start

# Stop the application
make stop

# Restart the application
make restart

# Clean docker resources
make clean

# View logs
make logs
```

## Modules Implemented

The project implements the following modules as specified in the requirements:

1. **Framework for Backend**: Fastify with Node.js
2. **Frontend Framework**: Tailwind CSS with TypeScript
3. **Database**: SQLite for data persistence

[Additional modules to be implemented based on project progress]

## License

[License information]

## Acknowledgments

- Original Pong game (1972)
- [Other acknowledgments]
