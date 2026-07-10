# Frontend con hot-reload
run-front:
	cd frontend && npx --yes live-server --port=8080

# Backend en segundo plano (sin Docker)
run-back:
	@echo "Iniciando backend en http://localhost:3000 ..."
	@cd backend && npm run dev > /tmp/aquaflash-backend.log 2>&1 & echo $$! > /tmp/aquaflash-backend.pid
	@sleep 1
	@echo "Backend PID: $$(cat /tmp/aquaflash-backend.pid)"

# Levanta backend + frontend
run: run-back run-front

# Apaga el backend local
stop:
	@if [ -f /tmp/aquaflash-backend.pid ]; then \
		kill $$(cat /tmp/aquaflash-backend.pid) 2>/dev/null || true; \
		rm -f /tmp/aquaflash-backend.pid; \
		echo "Backend detenido."; \
	else \
		echo "No hay backend local corriendo."; \
	fi

# Opcional: si tenés Docker Compose instalado
run-docker:
	cd backend && docker compose up -d

stop-docker:
	cd backend && docker compose down
