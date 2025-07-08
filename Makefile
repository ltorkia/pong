PROJECT_NAME = transcendence
APP_URL = https://localhost:8443

DEV_COMPOSE_FILE = docker-compose.dev.yml
PROD_COMPOSE_FILE = docker-compose.yml

BACKEND_DIR = ./backend
ENV_BACK_SOURCE = $(HOME)/ft_transcendence_env
ENV_BACK_DEST = $(BACKEND_DIR)/.env

SHARED_DIR = ./shared
ENV_SHARED_SOURCE = $(HOME)/ft_transcendence_shared_env
ENV_SHARED_DEST = $(SHARED_DIR)/.env

FRONTEND_DIR = ./frontend
ENV_FRONT_DEST = $(FRONTEND_DIR)/.env

GOINFRE_DOCKER_DIR = /goinfre/$(notdir $(HOME))/.docker

GREEN = \033[32m
YELLOW = \033[33m
RED = \033[31m
NC = \033[0m

# Définit la variable MODE en lisant le contenu du fichier .mode s'il existe (sinon MODE=dev par défaut)
# Ce fichier est créé dès lors que l'on fait make dev ou make prod, et en fonction aura comme contenu "dev" ou "prod".
# Ca va nous permettre de définir la variable COMPOSE_FILE avec DEV_COMPOSE_FILE ou PROD_COMPOSE_FILE pour les autres règles comme build.
MODE ?= $(shell cat .mode 2>/dev/null || echo "dev")
ifeq ($(MODE),prod)
	COMPOSE_FILE := $(PROD_COMPOSE_FILE)
else
	COMPOSE_FILE := $(DEV_COMPOSE_FILE)
endif

all: dev

dev: # Lance le projet en mode dev (hot reload sur le front et redémarrage du serveur à chaque modif)
	@echo "$(RED)-----------------------------$(NC)"
	@echo "$(RED)[MODE DEV]$(NC)"
	@echo "$(RED)-----------------------------$(NC)"
	@sh -c 'echo "dev" > .mode'
	@$(MAKE) build up

prod: # Lance le projet en mode prod (compile les fichiers statiques, pas de hot reload)
	@echo "$(RED)-----------------------------$(NC)"
	@echo "$(RED)[MODE PROD]$(NC)"
	@echo "$(RED)-----------------------------$(NC)"
	@sh -c 'echo "prod" > .mode'
	@$(MAKE) build up copy-local

prepare-docker: # Prépare l'environnement Docker rootless en mode 42
	@echo "$(YELLOW)Configuration de $(GOINFRE_DOCKER_DIR) pour Docker rootless...$(NC)";
	@if [ ! -d "$(GOINFRE_DOCKER_DIR)" ]; then \
		mkdir -p $(GOINFRE_DOCKER_DIR); \
	fi
	export DOCKER_CONFIG=$(GOINFRE_DOCKER_DIR);
	@echo "$(GREEN)Docker rootless configuré pour utiliser /goinfre$(NC)"

check_env: # Vérifie l'existence des fichiers .env et les copie dans les répertoires backend et frontend
	@echo "$(YELLOW)Vérification et copie des fichiers .env...$(NC)"
	@if [ ! -f "$(ENV_BACK_SOURCE)" ]; then \
		@echo "$(RED)Erreur: Fichier $(ENV_BACK_SOURCE) introuvable.$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "$(ENV_SHARED_SOURCE)" ]; then \
		@echo "$(RED)Erreur: Fichier $(ENV_SHARED_SOURCE) introuvable.$(NC)"; \
		exit 1; \
	fi
	@cp $(ENV_BACK_SOURCE) $(ENV_BACK_DEST)
	@chmod 600 $(ENV_BACK_DEST)
	@cp $(ENV_SHARED_SOURCE) $(ENV_SHARED_DEST)
	@chmod 600 $(ENV_SHARED_DEST)
	@echo "$(GREEN)Fichiers .env copiés avec succès!$(NC)"

sync-env: check_env # Synchronise les variables d'environnement entre les fichiers .env
	@echo "$(YELLOW)Synchronisation des variables d'environnement...$(NC)"
	@sh sync-env.sh

copy-local: # Copie locale des fichiers statiques pour avoir un visuel en mode prod sans bind mount les volumes dans docker-compose.yml
	@echo "$(YELLOW)Copie des fichiers statiques du dossier /dist du docker frontend vers nginx local...$(NC)"
	docker cp $$(docker compose -f $(COMPOSE_FILE) ps -q nginx):/usr/share/nginx/html ./nginx/dist || echo "Frontend dist absent"
	
	@echo "$(YELLOW)Copie des fichiers statiques du dossier /dist du docker backend vers backend local...$(NC)"
	docker cp $$(docker compose -f $(COMPOSE_FILE) ps -q backend):/app/dist ./backend/dist || echo "Backend dist absent"

build: prepare-docker sync-env # Construit les images Docker
	@echo "$(YELLOW)Construction des images Docker...$(NC)"
	COMPOSE_BAKE=true docker compose -f $(COMPOSE_FILE) build --no-cache

up: # Lance les services
	@echo "$(YELLOW)Lancement des services...$(NC)"
	docker compose -f $(COMPOSE_FILE) up -d --remove-orphans
	@echo "$(RED)App:$(NC) $(GREEN)$(APP_URL)$(NC)"
	@$(MAKE) status

down: # Arrête les services
	@echo "${YELLOW}Arrêt des conteneurs...${NC}"
	docker compose -f $(COMPOSE_FILE) down --remove-orphans || true

logs: # Affiche les logs des services
	docker compose -f $(COMPOSE_FILE) logs -f

exec-frontend: # Rentre dans le Docker frontend
	docker compose -f $(COMPOSE_FILE) exec -ti frontend sh

exec-backend: # Rentre dans le Docker backend
	docker compose -f $(COMPOSE_FILE) exec -ti backend sh

exec-nginx: # Rentre dans le Docker nginx
	docker compose -f $(COMPOSE_FILE) exec -ti nginx sh

clean: down # Nettoie les conteneurs et fichier .env mais conserve les images et volumes
	@echo "$(YELLOW)Suppression du fichier .env...$(NC)"
	rm -f $(ENV_SHARED_DEST) $(ENV_FRONT_DEST) $(ENV_BACK_DEST)

fclean: clean # Nettoyage profond: volumes, images et données persistantes et système Docker global
	@echo "${YELLOW}Suppression des volumes...${NC}"
	docker volume prune -f
	@echo "${YELLOW}Suppression des images...${NC}"
	docker rmi -f $$(docker images -q) 2>/dev/null || true
	@echo "${RED}Nettoyage des données persistantes locales...${NC}"
	rm -rf frontend/src/shared backend/src/shared
	rm -rf frontend/node_modules backend/node_modules
	rm -rf backend/data backend/dist nginx/dist .mode
	find backend/uploads/avatars/ -type f ! -name 'default.png' -delete

prune: fclean # Nettoyage complet y compris le système Docker global
	@echo "$(YELLOW)⚠️ Suppression complète de tous les éléments Docker non utilisés...${NC}"
	docker system prune -a --volumes -f
	@echo "$(GREEN)Système Docker nettoyé avec succès!${NC}"

re: clean up
rebuild: fclean build up
re-full: prune build up

status: # Affiche le statut des services
	docker compose -f $(COMPOSE_FILE) ps

.PHONY: dev prod prepare-docker check_env sync-env copy-local build build-frontend up down logs exec-frontend exec-backend exec-nginx clean fclean prune re rebuild re-full status