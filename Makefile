# Carmot Frontend - Comandos Docker
# Guía: no uses "make down" a diario; usa "make stop" (fin del día) y "make start" (inicio del día)

RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m

.PHONY: up down stop start restart show-urls npm vue day-end day-start build-staging build-production build

up:
	@echo -e '$(GREEN)=> Iniciando contenedores Docker$(NC)'
	docker compose up -d --build
	@$(MAKE) show-urls

down:
	@echo -e '$(YELLOW)=> Deteniendo contenedores (volúmenes se conservan)$(NC)'
	docker compose down

stop:
	@echo -e '$(YELLOW)=> Deteniendo contenedores (ideal para fin del día)$(NC)'
	docker compose stop
	@echo -e '$(GREEN)=> Mañana: make start$(NC)'

start:
	@echo -e '$(GREEN)=> Iniciando contenedores existentes$(NC)'
	docker compose start
	@$(MAKE) show-urls

restart:
	docker compose restart
	@$(MAKE) show-urls

show-urls:
	@echo ''; echo -e '$(GREEN)=> Acceso a la aplicación:$(NC)'; \
	echo -e '   Frontend (Vue):  http://localhost:5173'; echo ''

day-end: stop
day-start: start

# Build de staging (dist/ en el host). Requiere .env.staging
build-staging:
	@echo -e '$(GREEN)=> Build staging (Vite) dentro de Docker$(NC)'
	docker compose run --rm --no-deps vue sh -c "npm ci && npm run build:staging"

# Build de producción (dist/ en el host). Usa .env.production
build-production:
	@echo -e '$(GREEN)=> Build producción (Vite) dentro de Docker$(NC)'
	docker compose run --rm --no-deps vue sh -c "npm ci && npm run build"
	@echo -e '$(GREEN)=> dist/ listo. Sube el contenido a public_html en HestiaCP.$(NC)'

# Build para cualquier servidor. Uso: make build BACKEND=https://tuapi.com
# El /api se agrega automáticamente; no incluyas barra al final del BACKEND.
build:
	@if [ -z "$(BACKEND)" ]; then \
		echo -e "$(RED)=> Error: debes indicar la URL del backend$(NC)"; \
		echo -e "   Uso: make build BACKEND=https://tuservidor.com"; \
		exit 1; \
	fi
	$(eval BACKEND_URL := $(shell echo "$(BACKEND)" | sed 's|/$$||'))
	@echo -e "$(GREEN)=> Generando build con API=$(BACKEND_URL)/api$(NC)"
	docker compose run --rm --no-deps -e VITE_API_URL=$(BACKEND_URL)/api vue sh -c "npm ci && npm run build"
	@echo -e "$(GREEN)=> dist/ listo. Sube su contenido al directorio raíz del servidor web.$(NC)"

# Instalar dependencias dentro del contenedor
npm:
	docker compose exec vue npm $(filter-out $@,$(MAKECMDGOALS))

# Acceder al contenedor Vue
vue:
	@echo -e '$(GREEN)=> Accediendo al contenedor Vue$(NC)'
	docker compose exec vue bash

# Ver logs del servicio vue
logs:
	docker compose logs -f vue

%:
	@:
