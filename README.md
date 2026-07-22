# AquaFlash

Aplicación web para gestionar clientes, repartidores, stock, promociones, notificaciones y rutas de reparto de una distribuidora de agua.

## Tecnologías

* **Backend:** Node.js, Express, PostgreSQL (`pg`)
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla), nginx
* **Infraestructura:** Docker Compose

## Requisitos

* Docker Desktop (macOS) o Docker + Compose (Linux)
* Make (opcional, pero recomendado)

## Configuración

En la raíz del proyecto creá un archivo `.env`:

```env
POSTGRES_USER=aquaflash
POSTGRES_PASSWORD=aquaflash
POSTGRES_DB=aquaflash
POSTGRES_PORT=5433
BACKEND_PORT=3000
FRONTEND_PORT=8080
```

> Si el puerto `5432` está libre en tu máquina, podés usar `POSTGRES_PORT=5432`.  
> En muchas Macs el Postgres local ya ocupa el `5432`, por eso el default recomendado es `5433`.

Si vas a correr el backend **fuera** de Docker (`npm run dev`), creá también `backend/.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USER=aquaflash
DATABASE_PASSWORD=aquaflash
DATABASE_NAME=aquaflash
PORT=3000
```

`DATABASE_PORT` tiene que coincidir con `POSTGRES_PORT` del `.env` de la raíz.

## Cómo levantarlo

Desde la carpeta raíz del proyecto:

```bash
make run
```

Eso levanta:

| Servicio   | URL / puerto              |
|------------|---------------------------|
| Frontend   | http://localhost:8080     |
| Backend    | http://localhost:3000     |
| PostgreSQL | localhost:`POSTGRES_PORT` |
| Test DB    | http://localhost:3000/test-db |

Para apagar:

```bash
make stop-docker
```

### Levantar por separado

```bash
make run-db       # solo PostgreSQL
make run-back     # solo backend
make run-front    # solo frontend (nginx)
```

## Base de datos

La base corre en Docker (servicio `db`). **No usa Supabase.**

La primera vez que se crea el volumen, Postgres:

1. Crea la base `aquaflash`
2. Ejecuta `backend/src/database/schema.sql`
3. Ejecuta `backend/src/database/seeds.sql`

Si cambiaste schema/seeds y no ves los cambios:

```bash
make reset-db
```

Eso borra el volumen y vuelve a cargar schema + seeds.

### Conexión desde pgAdmin

| Campo    | Valor        |
|----------|--------------|
| Host     | `localhost`  |
| Port     | `5433` (o el de tu `.env`) |
| User     | `aquaflash`  |
| Password | `aquaflash`  |
| Database | `aquaflash`  |

## Funcionalidades principales

* **Clientes:** alta, edición, baja, filtros por día / deuda / repartidor / filtros personalizados
* **Detalle de cliente:** historial, venta/retiro, notas internas, dispenser
* **Ruta sugerida:** con filtro de **día + repartidor**, ordena por proximidad desde la fábrica, divide en viajes según capacidad del camión y muestra tiempo estimado
* **Promociones:** clientes en prueba de 7 días
* **Stock:** fábrica + casas, compra/descarte
* **Notificaciones:** generadas por reglas del backend (deuda, inactividad, stock mínimo, retiro de promo)

## Desarrollo

* El **frontend** tiene volumen montado: cambios en HTML/CSS/JS se ven al refrescar, sin rebuild.
* El **backend** se copia en la imagen al buildear. Si cambiaste código del back y no se refleja:

```bash
docker compose up --build
```
<img width="1512" height="857" alt="Captura de pantalla 2026-07-15 a la(s) 8 20 31 p  m" src="https://github.com/user-attachments/assets/da4bc238-982f-44d3-abe2-727e1700bf7b" />
<img width="1512" height="857" alt="Captura de pantalla 2026-07-21 a la(s) 11 24 02 p  m" src="https://github.com/user-attachments/assets/d38a978a-369b-4274-9052-02cf59ea6a7b" />
<img width="1512" height="857" alt="Captura de pantalla 2026-07-15 a la(s) 8 20 47 p  m" src="https://github.com/user-attachments/assets/5d71a994-a67f-4e53-8cb4-bc2085d28914" />
<img width="1507" height="857" alt="Captura de pantalla 2026-07-15 a la(s) 8 20 55 p  m" src="https://github.com/user-attachments/assets/956551f7-979d-4236-8e19-40ee372c293a" />
<img width="1512" height="857" alt="Captura de pantalla 2026-07-15 a la(s) 8 21 02 p  m" src="https://github.com/user-attachments/assets/a5eaa1c2-3fac-438f-b88f-7073f8e061ca" />
<img width="1512" height="857" alt="Captura de pantalla 2026-07-15 a la(s) 8 21 11 p  m" src="https://github.com/user-attachments/assets/b2334538-3625-412e-9eb4-2a43c1824a7c" />
