-- Migración: foto de evidencia por viaje (en lugar de por vale)
-- Fecha: 2026-04-21
--
-- Agrega columnas de evidencia fotográfica y GPS a vale_material_viajes.
-- Todas las columnas son nullable para mantener compatibilidad con viajes existentes.

ALTER TABLE vale_material_viajes
  ADD COLUMN IF NOT EXISTS foto_evidencia_url     TEXT,
  ADD COLUMN IF NOT EXISTS latitud_registro       NUMERIC,
  ADD COLUMN IF NOT EXISTS longitud_registro      NUMERIC,
  ADD COLUMN IF NOT EXISTS distancia_obra_metros  INTEGER;
