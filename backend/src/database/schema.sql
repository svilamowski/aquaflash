-- Schema local de AquaFlash (PostgreSQL)

CREATE TABLE IF NOT EXISTS public.repartidores (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.productos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    cantidad_minima_fabrica INTEGER NOT NULL DEFAULT 0,
    cantidad INTEGER NOT NULL DEFAULT 0,
    precio NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.stock_fabrica (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL UNIQUE REFERENCES public.productos(id),
    cantidad INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.descartados (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES public.productos(id),
    cantidad INTEGER NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.clientes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    deuda NUMERIC(12, 2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_pago DATE,
    ultima_compra DATE,
    es_promocion BOOLEAN NOT NULL DEFAULT FALSE,
    repartidor_id INTEGER REFERENCES public.repartidores(id),
    fecha_inicio_promo DATE,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    frecuencia_visitas TEXT
);

CREATE TABLE IF NOT EXISTS public.notas_internas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL UNIQUE REFERENCES public.clientes(id) ON DELETE CASCADE,
    nota TEXT
);

CREATE TABLE IF NOT EXISTS public.filtros_personalizados (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.clientes_filtros (
    cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    filtro_id INTEGER NOT NULL REFERENCES public.filtros_personalizados(id) ON DELETE CASCADE,
    PRIMARY KEY (cliente_id, filtro_id)
);

CREATE TABLE IF NOT EXISTS public.notificaciones (
    id SERIAL PRIMARY KEY,
    mensaje TEXT NOT NULL,
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clave TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS public.visitas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES public.clientes(id),
    repartidor_id INTEGER REFERENCES public.repartidores(id),
    compro BOOLEAN NOT NULL DEFAULT FALSE,
    monto_pagado NUMERIC(12, 2) NOT NULL DEFAULT 0,
    monto_total_venta NUMERIC(12, 2) NOT NULL DEFAULT 0,
    fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ventas_productos (
    id SERIAL PRIMARY KEY,
    visita_id INTEGER NOT NULL REFERENCES public.visitas(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES public.productos(id),
    cantidad_entregada INTEGER NOT NULL DEFAULT 0,
    cantidad_retirada INTEGER NOT NULL DEFAULT 0,
    precio_total_producto NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.productos_clientes (
    cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES public.productos(id),
    cantidad INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (cliente_id, producto_id)
);
