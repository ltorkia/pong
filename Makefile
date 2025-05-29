PROJECT_NAME = transcendence
APP_URL = http://localhost:8080

DEV_COMPOSE_FILE = docker-compose.dev.yml
PROD_COMPOSE_FILE = docker-compose.prod.yml

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

copy-local: # Copie locale des fichiers statiques pour avoir un visuel en mode prod sans bind mount les volumes dans docker-compose.yml
	@echo "$(GREEN)Copie des fichiers statiques du dossier /dist du docker frontend vers nginx local...$(NC)"
	docker cp $$(docker compose -f $(COMPOSE_FILE) ps -q nginx):/usr/share/nginx/html ./nginx/dist || echo "Frontend dist absent"
	
	@echo "$(GREEN)Copie des fichiers statiques du dossier /dist du docker backend vers backend local...$(NC)"
	docker cp $$(docker compose -f $(COMPOSE_FILE) ps -q backend):/app/dist ./backend/dist || echo "Backend dist absent"

build: # Construit les images Docker
	@echo "$(GREEN)Construction des images Docker...$(NC)"
	docker compose -f $(COMPOSE_FILE) build --no-cache

up: # Lance les services
	@echo "$(GREEN)Lancement des services...$(NC)"
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)App: $(APP_URL)$(NC)"
	@$(MAKE) status

down: # Arrête les services
	@echo "$(YELLOW)Arrêt des services...$(NC)"
	docker compose -f $(COMPOSE_FILE) down

logs: # Affiche les logs des services
	docker compose -f $(COMPOSE_FILE) logs -f

exec-frontend: # Rentre dans le Docker frontend
	docker compose -f $(COMPOSE_FILE) exec -ti frontend sh

exec-backend: # Rentre dans le Docker backend
	docker compose -f $(COMPOSE_FILE) exec -ti backend sh

exec-nginx: # Rentre dans le Docker nginx
	docker compose -f $(COMPOSE_FILE) exec -ti nginx sh

clean: # Nettoie les images, conteneurs et volumes
	@echo "${YELLOW}Arrêt et suppression des conteneurs + volumes...${NC}"
	docker compose -f $(COMPOSE_FILE) down -v --remove-orphans
	@echo "${YELLOW}Suppression des images...${NC}"
	docker rmi -f $$(docker images -q) 2>/dev/null || true

fclean: clean # Nettoyage complet, y compris les données persistantes et système Docker global
	@echo "${RED}Nettoyage des données persistantes...${NC}"
	@sudo chown -R $(shell id -u):$(shell id -g) backend/data || true
	@rm -rf frontend/node_modules backend/node_modules
	@rm -rf backend/data backend/dist nginx/dist .mode
	@echo "$(YELLOW)⚠️ Suppression complète de tous les éléments Docker non utilisés...${NC}"
	docker system prune -a --volumes -f
	@echo "$(GREEN)Système Docker nettoyé avec succès!${NC}"

re: fclean build up

status: # Affiche le statut des services
	docker compose -f $(COMPOSE_FILE) ps

.PHONY: dev prod copy-local build build-frontend up down logs exec-frontend exec-backend exec-nginx clean fclean re status