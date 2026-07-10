-- Ejecutar en Supabase si la columna no existe aún
ALTER TABLE public.notificaciones
ADD COLUMN IF NOT EXISTS clave TEXT UNIQUE;
