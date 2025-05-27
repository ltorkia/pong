COMPOSE_FILE = docker-compose.yml
PROJECT_NAME = transcendance

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

clean:  # Nettoie conteneurs et images sans toucher aux volumes
	@echo "${GREEN}Nettoyage des répertoires temporaires...${NC}"
	@rm -rf frontend/node_modules backend/node_modules
	@echo "${YELLOW}Arrêt et suppression des conteneurs (sans volumes)...${NC}"
	docker compose -f $(COMPOSE_FILE) down --remove-orphans
	@echo "${YELLOW}Suppression des images non utilisées...${NC}"
	docker image prune -f

fclean: clean  # Nettoyage complet, y compris volumes et base de données
	@echo "${RED}Nettoyage complet (volumes, base de données, images)...${NC}"
	@rm -rf backend/data
	docker compose -f $(COMPOSE_FILE) down -v --remove-orphans
	docker system prune -a --volumes -f

re: fclean build up

status: # Affiche le statut des services
	docker compose -f $(COMPOSE_FILE) ps

.PHONY: help build up down logs clean fclean re status