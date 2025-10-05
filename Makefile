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

GREEN	= \033[32m
YELLOW	= \033[33m
RED		= \033[31m
CYAN	= \033[1;36m
NC		= \033[0m

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
	@echo "\n${CYAN}#######################################################${NC}"
	@echo "${CYAN}####                                               ####${NC}"
	@echo "${CYAN}####                    MODE DEV                   ####${NC}"
	@echo "${CYAN}####                                               ####${NC}"
	@echo "${CYAN}#######################################################${NC}"
	@sh -c 'echo "dev" > .mode'
	@$(MAKE) -s build up

prod: # Lance le projet en mode prod (compile les fichiers statiques, pas de hot reload)
	@echo "\n${CYAN}#######################################################${NC}"
	@echo "${CYAN}####                                               ####${NC}"
	@echo "${CYAN}####                   MODE PROD                   ####${NC}"
	@echo "${CYAN}####                                               ####${NC}"
	@echo "${CYAN}#######################################################${NC}"
	@sh -c 'echo "prod" > .mode'
	@$(MAKE) -s build up copy-local

prod-dev: # Lance le projet en mode prod (compile les fichiers statiques, pas de hot reload, pas de build docker)
	@echo "\n${CYAN}#######################################################${NC}"
	@echo "${CYAN}####                                               ####${NC}"
	@echo "${CYAN}####                   MODE PROD-DEV               ####${NC}"
	@echo "${CYAN}####                                               ####${NC}"
	@echo "${CYAN}#######################################################${NC}"
	@sh -c 'echo "prod" > .mode'
	@$(MAKE) -s up copy-local


#########################################################
#############          CONFIG RULES           ###########
#########################################################

# Prépare l'environnement Docker rootless en mode 42
# - S'active uniquement si le dossier /goinfre est présent (environnement 42)
# - Crée le dossier ~/.docker dans /goinfre si nécessaire
# - Ajoute automatiquement la ligne "export DOCKER_CONFIG=/goinfre/login/.docker" dans ~/.zshrc
#    -> permet à Docker rootless d'utiliser un espace avec droits d'écriture,
#   	persistant entre les sessions et de ne pas prendre d'espace sur le disque dur (Home)
prepare-docker:
	@if [ -d "/goinfre" ]; then \
		echo "\n$(YELLOW)• Configuration de $(GOINFRE_DOCKER_DIR) pour Docker rootless...$(NC)"; \
		if [ ! -d "$(GOINFRE_DOCKER_DIR)" ]; then \
			mkdir -p $(GOINFRE_DOCKER_DIR); \
		fi; \
		if ! grep -q "DOCKER_CONFIG=$(GOINFRE_DOCKER_DIR)" ~/.zshrc 2>/dev/null; then \
			echo "export DOCKER_CONFIG=$(GOINFRE_DOCKER_DIR)" >> ~/.zshrc; \
			echo "$(GREEN)Ajout de DOCKER_CONFIG dans ~/.zshrc$(NC)"; \
		else \
			echo "$(GREEN)DOCKER_CONFIG déjà présent dans ~/.zshrc$(NC)"; \
		fi; \
		echo "$(GREEN)Docker rootless configuré pour utiliser /goinfre$(NC)"; \
	fi

check_env: # Vérifie l'existence des fichiers .env et les copie dans les répertoires backend et frontend
	@echo "\n$(YELLOW)• Vérification et copie des fichiers .env...$(NC)"
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
	@echo "$(GREEN)Fichiers .env copiés.$(NC)"

sync-env: check_env # Synchronise les variables d'environnement entre les fichiers .env
	@echo "\n$(YELLOW)• Synchronisation des variables d'environnement...$(NC)"
	@sh sync-env.sh

copy-local: # Copie locale des fichiers statiques pour avoir un visuel en mode prod sans bind mount les volumes dans docker-compose.yml
	@echo "\n$(YELLOW)• Copie des fichiers statiques du dossier /dist du docker frontend vers nginx local...$(NC)"
	docker cp $$(docker compose -f $(COMPOSE_FILE) ps -q nginx):/usr/share/nginx/html ./nginx/dist || echo "Frontend dist absent"
	
	@echo "\n$(YELLOW)• Copie des fichiers statiques du dossier /dist du docker backend vers backend local...$(NC)"
	docker cp $$(docker compose -f $(COMPOSE_FILE) ps -q backend):/app/dist ./backend/dist || echo "Backend dist absent"

#########################################################
#############          BASIC RULES            ###########
#########################################################

build: prepare-docker sync-env # Construit les images Docker
	@echo "\n$(YELLOW)• Construction des images Docker...$(NC)"
	COMPOSE_BAKE=true docker compose -f $(COMPOSE_FILE) build --no-cache

up: # Lance les services
	@echo "\n$(YELLOW)• Lancement des services...$(NC)"
# 	docker compose -f $(COMPOSE_FILE) up -d --remove-orphans
	sudo docker compose -f $(COMPOSE_FILE) up -d --remove-orphans
	@echo "\n$(GREEN)=================================$(NC)"
	@echo "$(GREEN)// APP: $(APP_URL) //$(NC)"
	@echo "$(GREEN)=================================$(NC)"
	@$(MAKE) -s status

down: # Arrête les services
	@echo "\n${YELLOW}• Arrêt des conteneurs...${NC}"
	docker compose -f $(COMPOSE_FILE) down --remove-orphans || true

logs: # Affiche les logs des services
	@echo "\n${YELLOW}• Logs des services:${NC}"
	docker compose -f $(COMPOSE_FILE) logs -f

status: # Affiche le statut des services
	@echo "\n${YELLOW}• Statut des services:${NC}"
	docker compose -f $(COMPOSE_FILE) ps

#########################################################
#############          EXEC / RESTART         ###########
#########################################################

exec-frontend: # Rentre dans le Docker frontend
	docker compose -f $(COMPOSE_FILE) exec -ti frontend sh

exec-backend: # Rentre dans le Docker backend
	docker compose -f $(COMPOSE_FILE) exec -ti backend sh

exec-nginx: # Rentre dans le Docker nginx
	docker compose -f $(COMPOSE_FILE) exec -ti nginx sh

restart-frontend: # Redémarre le service frontend
	docker compose -f $(COMPOSE_FILE) restart frontend

restart-backend: # Redémarre le service backend
	docker compose -f $(COMPOSE_FILE) restart backend
# 	sudo docker compose -f $(COMPOSE_FILE) restart backend

restart-nginx: # Redémarre le service nginx
	docker compose -f $(COMPOSE_FILE) restart nginx

restart-all: # Redémarre tous les services
	docker compose -f $(COMPOSE_FILE) restart

#########################################################
#############             CLEANING            ###########
#########################################################

fclean: down # Nettoyage profond: volumes, images et données persistantes locales
	@echo "\n$(YELLOW)• Suppression des fichiers .env...$(NC)"
	rm -f $(ENV_SHARED_DEST) $(ENV_FRONT_DEST) $(ENV_BACK_DEST)
	@echo "\n${YELLOW}• Suppression des volumes...${NC}"
	sudo docker volume prune -f
# 	docker volume prune -f
	@echo "\n${YELLOW}• Suppression des images...${NC}"
	docker rmi -f $$(docker images -q) 2>/dev/null || true
	@echo "\n${RED}• Nettoyage des données persistantes locales...${NC}"
	rm -rf frontend/src/shared backend/src/shared
	rm -rf frontend/node_modules backend/node_modules
# 	rm -rf backend/data backend/dist nginx/dist .mode
	sudo rm -rf backend/data backend/dist nginx/dist .mode
	find backend/uploads/avatars/ -type f ! -name 'default.png' -delete

prune: fclean # Nettoyage complet y compris le système Docker global
	@echo "\n$(YELLOW)⚠️ Suppression complète de tous les éléments Docker non utilisés...${NC}"
	sudo docker system prune -a --volumes -f
# 	docker system prune -a --volumes -f
	@echo "$(GREEN)Système Docker nettoyé avec succès!${NC}"

re: down up
rebuild: fclean build up
rebuild-all: prune build up

.PHONY: dev prod prepare-docker check_env sync-env copy-local build build-frontend up down logs status \
exec-frontend exec-backend exec-nginx restart-frontend restart-backend restart-nginx restart-all \
fclean prune re rebuild rebuild-all