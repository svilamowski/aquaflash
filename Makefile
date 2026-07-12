run-front:
	cd frontend && npx --yes live-server --port=8080

run-back:
	cd backend && docker compose up -d && npm run dev

stop-docker:
	cd backend && docker compose down