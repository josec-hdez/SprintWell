# SprintWell — developer ergonomics
# Requires: Docker Engine 20.10+ with Compose v2 plugin (`docker compose`).
# Run `make help` to list available targets.

.DEFAULT_GOAL := help
.PHONY: help db-up db-down db-reset db-logs db-psql db-status

# Load .env if present so $(POSTGRES_USER) etc. expand in targets like db-psql.
-include .env
export

help: ## Show this help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

db-up: ## Start postgres in the background and wait until healthy.
	docker compose up -d postgres
	@echo "Waiting for postgres to become healthy..."
	@until [ "$$(docker inspect -f '{{.State.Health.Status}}' sprintwell-postgres 2>/dev/null)" = "healthy" ]; do \
		sleep 1; \
	done
	@echo "postgres is healthy on port $${POSTGRES_PORT:-5432}."

db-down: ## Stop postgres (volume preserved).
	docker compose down

db-reset: ## Stop postgres AND drop the data volume. Destructive — wipes all data.
	docker compose down -v
	@echo "Volume sprintwell_postgres_data removed."

db-logs: ## Tail postgres logs.
	docker compose logs -f postgres

db-psql: ## Open a psql shell inside the postgres container.
	docker compose exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

db-status: ## Show the postgres container status.
	docker compose ps postgres
