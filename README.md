<img width="1868" height="966" alt="Screenshot From 2026-07-14 13-48-49" src="https://github.com/user-attachments/assets/d00bd554-975e-4bfd-8e98-09036e4c6b87" />
# AquaFlash

AquaFlash es una aplicación web para la gestión de clientes, repartidores, stock, promociones y estadísticas de una distribuidora de agua, permitiendo un seguimiento eficiente de las asignaciones diarias.

## Tecnologías Utilizadas

* **Backend:** Node.js, Express, Supabase.
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla).
* **Infraestructura:** Docker, Vercel.

## Requisitos previos

Para que el proyecto corra perfectamente en tu computadora (sea Mac o Linux), necesitás tener instalado:

**Docker:** Necesario para levantar la base de datos de Supabase en segundo plano.
* *Usuarios de macOS:* Deben tener instalada y abierta la aplicación **Docker Desktop**.
* *Usuarios de Linux:* Tener el daemon de Docker corriendo.

## Instalación Inicial

La primera vez que bajes el repositorio, tenés que instalar las dependencias del backend:

```bash
cd backend
npm install
cd ..

```

## Comandos de Desarrollo

Todo el flujo de trabajo está simplificado mediante el archivo `Makefile`. Podés ejecutar estos comandos desde la carpeta principal del proyecto:

### 1. Levantar el Backend y la Base de Datos

```bash
make run-back

```

*¿Qué hace?* Prende los contenedores de Docker en silencio (`-d`) para la base de datos y luego inicia el servidor local de Node.js.

### 2. Levantar el Frontend

Abre otra pestaña en tu terminal y ejecutá:

```bash
make run-front

```

*¿Qué hace?* Usa `live-server` para levantar la interfaz web en `http://127.0.0.1:8080` y recarga la página automáticamente cuando guardás cambios en el HTML/JS/CSS.

### 3. Apagar el Entorno

Cuando termines de trabajar, apagá el motor de base de datos para liberar memoria RAM:

```bash
make stop-docker

```

*¿Qué hace?* Frena y destruye los contenedores de Docker asociados al proyecto de manera limpia.

**"Variables de Entorno"** es necesario crear un archivo `.env` con las credenciales de Supabase.
