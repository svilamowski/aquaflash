run-front:
	docker compose up frontend

run-back:
	docker compose up backend

run:
	docker compose up

stop-docker:
	docker compose down
