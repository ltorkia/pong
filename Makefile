# Variables
DOCKER_COMPOSE = docker compose
DOCKER_EXEC = docker exec -it
APP_CONTAINER = pong-app

# Colors
GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m

.PHONY: all up down build build-cache build-up logs clean fclean restart shell test lint format help

all: up

up:
	@echo "${GREEN}Building Pong container with no cache...${NC}"
	@$(DOCKER_COMPOSE) build --no-cache
	@echo "${GREEN}Starting Pong container...${NC}"
	@$(DOCKER_COMPOSE) up -d
	@echo "${GREEN}Container is now running!${NC}"
	@printf "${YELLOW}\nApp :\n  backend API : http://localhost:8080/api\n  frontend dev : http://localhost:3000${NC}\n"

# Build sans cache
build-cache:
	@echo "${GREEN}Building Pong container (using cache)...${NC}"
	@$(DOCKER_COMPOSE) build
	@echo "${GREEN}Build completed${NC}"

# Build complet + up détaché
build-up:
	@$(MAKE) build-cache
	@$(DOCKER_COMPOSE) up -d
	@echo "${GREEN}Container is now running!${NC}"
	@printf "${YELLOW}\nApp :\n  backend API : http://localhost:8080/api\n  frontend dev : http://localhost:3000${NC}\n"

down:
	@echo "${GREEN}Stopping Pong container...${NC}"
	@$(DOCKER_COMPOSE) down
	@echo "${GREEN}Container stopped${NC}"

logs:
	@echo "${GREEN}Showing logs...${NC}"
	@$(DOCKER_COMPOSE) logs -f

clean:
	@echo "${GREEN}Cleaning node_modules and dist folders...${NC}"
	@rm -rf frontend/node_modules backend/node_modules
	@rm -rf frontend/dist backend/dist

fclean: down clean
	@echo "${GREEN}Removing containers, volumes, and images...${NC}"
	@$(DOCKER_COMPOSE) down -v --rmi local
	@docker system prune -f

prune:
	@echo "${YELLOW}Pruning unused Docker objects (containers, volumes, networks, images)...${NC}"
	@docker system prune -a --volumes -f
	@echo "${GREEN}Docker system cleaned!${NC}"

restart: down up

shell:
	@echo "${GREEN}Opening shell in Pong container...${NC}"
	@$(DOCKER_EXEC) $(APP_CONTAINER) /bin/sh

test:
	@echo "${GREEN}Running tests...${NC}"
	@$(DOCKER_EXEC) $(APP_CONTAINER) npm run test

lint:
	@echo "${GREEN}Running linter...${NC}"
	@$(DOCKER_EXEC) $(APP_CONTAINER) npm run lint

format:
	@echo "${GREEN}Formatting code...${NC}"
	@$(DOCKER_EXEC) $(APP_CONTAINER) npm run format
