run-db:
	docker compose up db

run-front:
	docker compose up frontend

run-back:
	docker compose up backend

run:
	docker compose up

stop-docker:
	docker compose down

reset-db:
	docker compose down -v
	docker compose up db

