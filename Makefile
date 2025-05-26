DOCKER_COMPOSE = docker compose
DOCKER_EXEC = docker exec -it

GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m

all: up

# Build neuf + up détaché (rend la main dans le terminal avec conteneur toujours actif)
up:
	@echo "${GREEN}Building Pong container with no cache...${NC}"
	@$(DOCKER_COMPOSE) build --no-cache
	@echo "${GREEN}Starting Pong container...${NC}"
	@$(DOCKER_COMPOSE) up -d
	@echo "${GREEN}Container is now running!${NC}"
	@echo "${YELLOW}\nApp: http://localhost:8080${NC}"

# up:
# 	@echo "${GREEN}Building frontend...${NC}"
# 	@cd frontend && npm install && npm run build
# 	@echo "${GREEN}Building Pong container with no cache...${NC}"
# 	@$(DOCKER_COMPOSE) build --no-cache
# 	@echo "${GREEN}Starting Pong container...${NC}"
# 	@$(DOCKER_COMPOSE) up -d
# 	@echo "${GREEN}Container is now running!${NC}"
# 	@echo "${YELLOW}\nApp: http://localhost:8080${NC}"

# Build avec cache
build-cache:
	@echo "${GREEN}Building Pong container (using cache)...${NC}"
	@$(DOCKER_COMPOSE) build
	@echo "${GREEN}Build completed${NC}"

# Build avec cache + up détaché
build-up:
	@$(MAKE) build-cache
	@$(DOCKER_COMPOSE) up -d
	@echo "${GREEN}Container is now running!${NC}"
	@echo "${YELLOW}\nApp: http://localhost:8080"${NC}"

# Arrête le conteneur
down:
	@echo "${GREEN}Stopping Pong container...${NC}"
	@$(DOCKER_COMPOSE) down
	@echo "${GREEN}Container stopped${NC}"

# Affiche les logs en temps réel
logs:
	@echo "${GREEN}Showing logs...${NC}"
	@$(DOCKER_COMPOSE) logs -f

# Nettoyage des répertoires temporaires
clean:
	@echo "${GREEN}Cleaning node_modules and dist folders...${NC}"
	@rm -rf frontend/node_modules backend/node_modules
	@rm -rf frontend/dist backend/dist

# Suppression du conteneur + des répertoires, volumes et images
fclean: down clean
	@echo "${GREEN}Removing containers, volumes, and images...${NC}"
	@$(DOCKER_COMPOSE) down -v --rmi local
	@docker system prune -f

# Nettoyage complet du système docker sur la machine
prune:
	@echo "${YELLOW}Pruning unused Docker objects (containers, volumes, networks, images)...${NC}"
	@docker system prune -a --volumes -f
	@echo "${GREEN}Docker system cleaned!${NC}"

# Arrête et supprime les conteneurs (pas les volumes ni les images)
# et reconstruit si nécessaire pour relancer le conteneur
restart: down up

# Supprime tout et relance
re: fclean up

.PHONY: all up build-cache build-up down logs clean fclean restart re