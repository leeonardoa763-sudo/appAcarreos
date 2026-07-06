-- Migración: marca de vale de material destinado a la planta de asfaltos
-- Fecha: 2026-07-02
--
-- Los vales creados por el rol "Planta de Asfaltos" (ver
-- 20260702_planta_asfaltos_distancias.sql) usan distancia banco -> planta,
-- pero se cargan a la obra igual que cualquier otro vale de material. Se
-- necesita una marca persistida para:
-- - Mostrar una etiqueta distintiva en Acarreos/Archivados.
-- - Evitar que un CHECADOR en obra asigne vehiculo o registre viajes en
--   estos vales por error (se filtran en la app usando esta columna).
-- - Filtrar la lista de Acarreos/Archivados para que el rol Planta de
--   Asfaltos solo vea sus propios vales.

ALTER TABLE public.vale_material_detalles
  ADD COLUMN IF NOT EXISTS es_planta_asfaltos boolean NOT NULL DEFAULT false;
