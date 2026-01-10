.PHONY: help build up down logs clean dev prod shell seed

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker-compose build

up: ## Start containers in background
	docker-compose up -d

down: ## Stop containers
	docker-compose down

logs: ## View application logs
	docker-compose logs -f app

clean: ## Stop containers and remove volumes
	docker-compose down -v

dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up --build

prod: ## Start production environment
	docker-compose up --build -d

local: ## Start with local MongoDB
	docker-compose -f docker-compose.local.yml up --build

shell: ## Open shell in app container
	docker-compose exec app sh

seed: ## Run seed data script
	docker-compose exec app npx tsx scripts/seed-data.ts

restart: ## Restart containers
	docker-compose restart

ps: ## Show running containers
	docker-compose ps