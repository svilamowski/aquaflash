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

Credenciales locales por defecto (también para pgAdmin):

| Campo | Valor |
|-------|--------|
| Host | `localhost` |
| Port | `5432` |
| User | `aquaflash` |
| Password | `aquaflash` |
| Database | `aquaflash` |

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

Al crear el volumen por primera vez, Postgres ejecuta:

1. `backend/src/database/schema.sql`
2. `backend/src/database/seeds.sql`
