COMPOSE_FILE = docker-compose.yml
PROJECT_NAME = transcendence

GREEN = \033[32m
YELLOW = \033[33m
RED = \033[31m
NC = \033[0m

all: build up

build: # Construit les images Docker
	@echo "$(GREEN)Construction des images Docker...$(NC)"
	docker compose -f $(COMPOSE_FILE) build

up: # Lance les services en mode développement
	@echo "$(GREEN)Lancement des services...$(NC)"
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)App: http://localhost:8080$(NC)"
	@make status

down: # Arrête les services
	@echo "$(YELLOW)Arrêt des services...$(NC)"
	docker compose -f $(COMPOSE_FILE) down

logs: # Affiche les logs des services
	docker compose -f $(COMPOSE_FILE) logs -f

clean: # Nettoie les conteneurs sans toucher aux volumes
	@echo "${YELLOW}Arrêt et suppression des conteneurs (sans volumes)...${NC}"
	docker compose -f $(COMPOSE_FILE) down --remove-orphans

fclean: # Nettoyage complet, y compris volumes, dépendances et données
	@echo "${RED}Nettoyage complet (volumes, base de données, dépendances)...${NC}"
	docker compose -f $(COMPOSE_FILE) down -v --remove-orphans
	@rm -rf frontend/node_modules backend/node_modules
	@rm -rf backend/data

prune: fclean # Nettoyage extrême de tout ce qui n’est pas utilisé par Docker
	@echo "$(YELLOW)⚠️ Suppression complète de tous les éléments Docker non utilisés...${NC}"
	docker system prune -a --volumes -f
	@echo "$(GREEN)Système Docker nettoyé avec succès!${NC}"

re: fclean build up

status: # Affiche le statut des services
	docker compose -f $(COMPOSE_FILE) ps

.PHONY: build up down logs clean fclean prune re status