run-front:
    cd frontend && npx http-server -p 8080 --cors

run-back:
    cd backend && docker compose up

run: run-back run-front
