PROJECT_NAME = transcendence
APP_URL = https://localhost:8443

DEV_COMPOSE_FILE = docker-compose.dev.yml
PROD_COMPOSE_FILE = docker-compose.prod.yml

BACKEND_DIR = ./backend
ENV_SOURCE = $(HOME)/ft_transcendence_env
ENV_DEST = $(BACKEND_DIR)/.env

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
	@echo "$(GREEN)[MODE DEV]$(NC)"
	@sh -c 'echo "dev" > .mode'
	@$(MAKE) build up

prod: # Lance le projet en mode prod (compile les fichiers statiques, pas de hot reload)
	@echo "$(YELLOW)[MODE PROD]$(NC)"
	@sh -c 'echo "prod" > .mode'
	@$(MAKE) build up copy-local

check_env: # Vérifie l'existence du fichier .env et le copie dans le répertoire backend
	@echo "$(COLOR_BLUE)Vérification du fichier .env...$(COLOR_RESET)"
	@if [ ! -f "$(ENV_SOURCE)" ]; then \
		echo "$(COLOR_RED)Erreur: Fichier $(ENV_SOURCE) introuvable!$(COLOR_RESET)"; \
		exit 1; \
	fi
	@echo "$(COLOR_BLUE)Copie du fichier .env...$(COLOR_RESET)"
	@cp $(ENV_SOURCE) $(ENV_DEST)
	@chmod 600 $(ENV_DEST)
	@echo "$(COLOR_GREEN)Fichier .env copié avec succès!$(COLOR_RESET)"

copy-local: # Copie locale des fichiers statiques pour avoir un visuel en mode prod sans bind mount les volumes dans docker-compose.yml
	@echo "$(GREEN)Copie des fichiers statiques du dossier /dist du docker frontend vers nginx local...$(NC)"
	docker cp $$(docker compose -f $(COMPOSE_FILE) ps -q nginx):/usr/share/nginx/html ./nginx/dist || echo "Frontend dist absent"
	
	@echo "$(GREEN)Copie des fichiers statiques du dossier /dist du docker backend vers backend local...$(NC)"
	docker cp $$(docker compose -f $(COMPOSE_FILE) ps -q backend):/app/dist ./backend/dist || echo "Backend dist absent"

build: # Construit les images Docker
	@echo "$(GREEN)Construction des images Docker...$(NC)"
	COMPOSE_BAKE=true docker compose -f $(COMPOSE_FILE) build --no-cache

up: check_env # Lance les services
	@echo "$(GREEN)Lancement des services...$(NC)"
	docker compose -f $(COMPOSE_FILE) up -d --remove-orphans
	@echo "$(GREEN)App: $(APP_URL)$(NC)"
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
	@echo "$(COLOR_BLUE)Suppression du fichier .env...$(COLOR_RESET)"
	rm -f $(ENV_DEST)

fclean: clean # Nettoyage profond: volumes, images et données persistantes et système Docker global
	@echo "${YELLOW}Suppression des volumes...${NC}"
	docker volume prune -f
	@echo "${YELLOW}Suppression des images...${NC}"
	docker rmi -f $$(docker images -q) 2>/dev/null || true
	@echo "${RED}Nettoyage des données persistantes locales...${NC}"
	rm -rf frontend/src/shared backend/src/shared
	rm -rf frontend/node_modules backend/node_modules
	rm -rf backend/data backend/dist nginx/dist .mode
	find frontend/public/img/avatars/ -type f ! -name 'default.png' -delete

prune: fclean # Nettoyage complet y compris le système Docker global
	@echo "$(YELLOW)⚠️ Suppression complète de tous les éléments Docker non utilisés...${NC}"
	docker system prune -a --volumes -f
	@echo "$(GREEN)Système Docker nettoyé avec succès!${NC}"

re: clean up
rebuild: fclean build up
re-full: prune build up

status: # Affiche le statut des services
	docker compose -f $(COMPOSE_FILE) ps

.PHONY: dev prod check_env copy-local build build-frontend up down logs exec-frontend exec-backend exec-nginx clean fclean prune re rebuild re-full status