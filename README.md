# AquaFlash

AquaFlash es una aplicación web para la gestión de clientes, repartidores, stock, promociones y estadísticas de una distribuidora de agua.

## Tecnologías

* **Backend:** Node.js, Express, PostgreSQL (`pg`)
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **Infraestructura:** Docker Compose

## Requisitos

* Docker / Podman con Compose
* Node.js (si corrés el backend fuera de Docker)

## Configuración

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cd backend && npm install && cd ..
```

El `.env` de la raíz alimenta `docker-compose.yml` (usuario, password, puertos).  
El `backend/.env` se usa cuando corrés Node en tu máquina (`DATABASE_HOST=localhost`).

Credenciales locales por defecto (también para pgAdmin):

| Campo | Valor |
|-------|--------|
| Host | `localhost` |
| Port | `5432` |
| User | `aquaflash` |
| Password | `aquaflash` |
| Database | `aquaflash` |

## Base de datos local (PostgreSQL)

La DB vive en Docker Compose (servicio `db`), no en Supabase.

```bash
make run-db
```

La primera vez que se crea el volumen, Postgres:

1. Crea la base `aquaflash`
2. Ejecuta `backend/src/database/schema.sql`
3. Ejecuta `backend/src/database/seeds.sql`

Si cambiás el schema/seeds y no ves los cambios, recreá el volumen:

```bash
make reset-db
```

## Comandos

```bash
make run-db       # solo PostgreSQL
make run-front    # frontend :8080
make run-back     # backend en Docker
make run          # todo junto
make stop-docker  # apagar
make reset-db     # borrar volumen y recrear schema + seeds
```

### Desarrollo recomendado

```bash
make run-db                 # terminal 1
cd backend && npm run dev   # terminal 2
make run-front              # terminal 3
```

* Frontend: http://localhost:8080  
* Backend: http://localhost:3000  
* Test DB: http://localhost:3000/test-db  
