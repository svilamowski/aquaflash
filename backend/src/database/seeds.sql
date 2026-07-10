-- ==============================================================================
-- 1. REPARTIDORES
-- ==============================================================================
INSERT INTO public.repartidores (id, nombre) VALUES 
(1, 'Lucas Giménez'),
(2, 'Matías Silva'),
(3, 'Javier Rodríguez');

-- ==============================================================================
-- 2. PRODUCTOS
-- ==============================================================================
INSERT INTO public.productos (id, nombre, cantidad_minima_fabrica, cantidad, precio) VALUES 
(1, 'Bidón 12L', 100, 450, 2500.00),
(2, 'Bidón 20L', 80, 300, 3500.00),
(3, 'Cajón Soda 1L (x6)', 50, 150, 4000.00),
(4, 'Sifón descartable 2L', 30, 100, 1200.00),
(5, 'Dispenser Frío/Calor', 5, 20, 45000.00);

-- ==============================================================================
-- 3. STOCK EN FÁBRICA
-- ==============================================================================
INSERT INTO public.stock_fabrica (id, producto_id, cantidad) VALUES 
(1, 1, 450),
(2, 2, 300),
(3, 3, 150),
(4, 4, 25),
(5, 5, 20);

-- ==============================================================================
-- 4. DESCARTADOS (Mermas históricas para las estadísticas)
-- ==============================================================================
INSERT INTO public.descartados (id, producto_id, cantidad, fecha) VALUES 
(1, 1, 5, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(2, 3, 12, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(3, 2, 2, CURRENT_TIMESTAMP - INTERVAL '2 days');

-- ==============================================================================
-- 5. FILTROS PERSONALIZADOS
-- ==============================================================================
INSERT INTO public.filtros_personalizados (id, nombre) VALUES 
(1, 'Reparto Centro (Lunes)'),
(2, 'Morosos Críticos (> 90 días)'),
(3, 'Zona Norte VIP');

-- ==============================================================================
-- 6. CLIENTES (Casos de prueba para todas las reglas del sistema)
-- ==============================================================================
INSERT INTO public.clientes (id, nombre, direccion, telefono, deuda, activo, ultimo_pago, ultima_compra, es_promocion, repartidor_id, fecha_inicio_promo, frecuencia_visitas) VALUES 
-- Cliente 1: Al día, compra frecuente (Gimnasio)
(1, 'Gimnasio Iron Fit', 'Av. Rivadavia 4500, Caballito', '1144556677', 0.00, true, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days', false, 1, NULL, 'Lunes, Miércoles y Viernes'),

-- Cliente 2: Deuda mayor a $200.000 (Dispara notificación)
(2, 'Panadería La Central', 'Av. Corrientes 1200, San Nicolás', '1155443322', 215000.00, true, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '5 days', false, 2, NULL, 'Martes y Jueves'),

-- Cliente 3: No compra hace 46 días (Dispara notificación)
(3, 'Familia González', 'Calle Falsa 123, Vte López', '1122334455', 5000.00, true, CURRENT_DATE - INTERVAL '46 days', CURRENT_DATE - INTERVAL '46 days', false, 1, NULL, 'Sábados'),

-- Cliente 4: No compra hace 92 días y TIENE envases en su casa (Dispara notificación crítica)
(4, 'Kiosco El Sol', 'Belgrano 345, Morón', '1166778899', 0.00, true, CURRENT_DATE - INTERVAL '92 days', CURRENT_DATE - INTERVAL '92 days', false, 3, NULL, 'Viernes'),

-- Cliente 5: Promoción que cumple 7 días hoy (Dispara notificación de retiro)
(5, 'Consultorio Odontológico', 'Av. Santa Fe 3200, Palermo', '1177889900', 0.00, true, NULL, NULL, true, 2, CURRENT_DATE - INTERVAL '7 days', 'Miércoles'),

-- Cliente 6: Cliente regular
(6, 'Sofía Martínez', 'San Martín 890, Centro', '1133221144', 10500.00, true, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days', false, 1, NULL, 'Lunes');

-- ==============================================================================
-- 7. PRODUCTOS EN CASAS (Stock en comodato/prestado)
-- ==============================================================================
INSERT INTO public.productos_clientes (cliente_id, producto_id, cantidad) VALUES 
(1, 2, 8), -- El gimnasio tiene 8 bidones de 20L
(1, 5, 2), -- El gimnasio tiene 2 dispensers
(2, 1, 15),
(4, 1, 4), -- Kiosco con 92 días sin comprar retiene 4 bidones de 12L (Caso de prueba)
(5, 1, 1), -- Promoción reteniendo 1 bidón de 12L
(6, 3, 2);

-- ==============================================================================
-- 8. NOTAS INTERNAS
-- ==============================================================================
INSERT INTO public.notas_internas (id, cliente_id, nota) VALUES 
(1, 1, 'Dejar los bidones en la recepción, no entrar a la sala de musculación.'),
(2, 2, '¡Ojo! Cobrar siempre antes de bajar la mercadería por la deuda atrasada.'),
(3, 5, 'Promoción de prueba. Retirar el dispenser si no confirman el servicio.');

-- ==============================================================================
-- 9. CLIENTES - FILTROS (Relaciones)
-- ==============================================================================
INSERT INTO public.clientes_filtros (filtro_id, cliente_id) VALUES 
(1, 2),
(1, 6),
(2, 4);

-- ==============================================================================
-- 10. NOTIFICACIONES (se generan automáticamente al consultar /api/notificacion)
-- ==============================================================================
-- Ejecutar también: backend/src/database/migrations/add_notificacion_clave.sql

-- ==============================================================================
-- 11. VISITAS y VENTAS HISTÓRICAS (Para alimentar las estadísticas)
-- ==============================================================================
-- Visita 1 (Compra exitosa)
INSERT INTO public.visitas (id, cliente_id, repartidor_id, compro, monto_pagado, monto_total_venta, fecha) VALUES 
(1, 1, 1, true, 28000.00, 28000.00, CURRENT_TIMESTAMP - INTERVAL '2 days');
INSERT INTO public.ventas_productos (id, visita_id, producto_id, cantidad_entregada, cantidad_retirada, precio_total_producto) VALUES 
(1, 1, 2, 8, 8, 28000.00);

-- Visita 2 (Cliente no compró)
INSERT INTO public.visitas (id, cliente_id, repartidor_id, compro, monto_pagado, monto_total_venta, fecha) VALUES 
(2, 6, 1, false, 0.00, 0.00, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Visita 3 (Pago parcial de deuda)
INSERT INTO public.visitas (id, cliente_id, repartidor_id, compro, monto_pagado, monto_total_venta, fecha) VALUES 
(3, 2, 2, true, 5000.00, 12500.00, CURRENT_TIMESTAMP - INTERVAL '5 days');
INSERT INTO public.ventas_productos (id, visita_id, producto_id, cantidad_entregada, cantidad_retirada, precio_total_producto) VALUES 
(2, 3, 1, 5, 3, 12500.00);


-- ==============================================================================
-- 12. AJUSTE DE SECUENCIAS (¡FUNDAMENTAL!)
-- Al insertar IDs manualmente (id=1, id=2), las secuencias automáticas de Postgres 
-- se desincronizan. Estos comandos arreglan eso para que la app no tire error 
-- cuando intenten agregar el primer cliente nuevo desde la pantalla.
-- ==============================================================================
SELECT setval('repartidores_id_seq', (SELECT MAX(id) FROM public.repartidores));
SELECT setval('productos_id_seq', (SELECT MAX(id) FROM public.productos));
SELECT setval('stock_fabrica_id_seq', (SELECT MAX(id) FROM public.stock_fabrica));
SELECT setval('descartados_id_seq', (SELECT MAX(id) FROM public.descartados));
SELECT setval('filtros_personalizados_id_seq', (SELECT MAX(id) FROM public.filtros_personalizados));
SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM public.clientes));
SELECT setval('notas_internas_id_seq', (SELECT MAX(id) FROM public.notas_internas));
SELECT setval('notificaciones_id_seq', (SELECT MAX(id) FROM public.notificaciones));
SELECT setval('visitas_id_seq', (SELECT MAX(id) FROM public.visitas));
SELECT setval('ventas_productos_id_seq', (SELECT MAX(id) FROM public.ventas_productos));