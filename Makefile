# Carmot Frontend - Comandos Docker
# Guía: no uses "make down" a diario; usa "make stop" (fin del día) y "make start" (inicio del día)

RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m

.PHONY: up down stop start restart show-urls npm vue day-end day-start

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
