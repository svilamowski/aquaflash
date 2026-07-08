# Mueve a la carpeta frontend y levanta un servidor con hot-reload
run-front:
	cd frontend && npx live-server --port=8080

# Mueve a la carpeta backend y levanta Docker en segundo plano (-d)
run-back:
	cd backend && docker compose up -d

# Ejecuta el backend (que al estar en 2do plano avanza rápido) y luego el frontend
run: run-back run-front

# Agregamos este para poder apagar todo fácil
stop:
	cd backend && docker compose down