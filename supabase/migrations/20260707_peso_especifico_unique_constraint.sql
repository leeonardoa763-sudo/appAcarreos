-- Migración: previene duplicados en peso_especifico (mismo id_material + id_banco)
-- Fecha: 2026-07-07
--
-- Causa raíz de un bug real: useViajesMaterial.js usa .single() al buscar el
-- peso específico por (id_material, id_banco). Con filas duplicadas, .single()
-- falla (PostgREST rechaza si la query devuelve 0 o >1 filas) y el registro
-- de viaje truena con "No se encontró el peso específico", aunque el dato sí
-- exista.
--
-- Duplicados encontrados y confirmados antes de esta migración:
--   - id_material=11 (Sello 3/8), id_banco=1 (INCASA): ids 8 y 24
--   - id_material=4, id_banco=6: ids 12 y 18
--
-- Todo en una transacción.

BEGIN;

-- Por seguridad, elimina cualquier duplicado remanente (conserva la fila con
-- menor id_peso_especifico de cada combinación), no solo los dos casos ya
-- identificados manualmente arriba.
DELETE FROM peso_especifico pe
USING peso_especifico pe2
WHERE pe.id_material = pe2.id_material
  AND pe.id_banco = pe2.id_banco
  AND pe.id_peso_especifico > pe2.id_peso_especifico;

-- Ahora sí, previene que vuelva a pasar
ALTER TABLE peso_especifico
ADD CONSTRAINT peso_especifico_material_banco_unique UNIQUE (id_material, id_banco);

COMMIT;
