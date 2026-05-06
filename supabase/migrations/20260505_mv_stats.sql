-- Migración: Materialized Views para estadísticas sin límite de filas
-- Fecha: 2026-05-05
--
-- Problema resuelto: los hooks de estadísticas hacían queries row-a-row con limit
-- variable que superaba el límite real de PostgREST (1000 filas), produciendo
-- totales incorrectos en obras con muchos vales.
--
-- Solución: dos matviews pre-agregadas por (id_obra, mes) que reducen cada
-- query a decenas de filas sin importar el volumen total de vales.
--
-- IMPORTANTE: ejecutar en Supabase SQL Editor con el usuario postgres (owner).
-- Verificar antes: SELECT DISTINCT tipo_vale FROM vales LIMIT 10;

-- ============================================================
-- mv_stats_material
-- Agrupado por (id_obra, mes, id_material)
-- mes = primer día del mes en zona horaria America/Mexico_City
-- ============================================================

CREATE MATERIALIZED VIEW mv_stats_material AS
SELECT
  v.id_obra,
  date_trunc('month', v.fecha_creacion AT TIME ZONE 'America/Mexico_City')::date AS mes,
  vmd.id_material,
  m.material                                                    AS nombre_material,
  COUNT(DISTINCT v.id_vale)                                     AS total_vales,
  SUM(COALESCE(vmd.volumen_real_m3, vmd.cantidad_pedida_m3, 0)) AS m3_total,
  SUM(COALESCE(vmd.costo_total, 0))                             AS costo_total,
  SUM(COALESCE(vc.viaje_count, 0))                              AS total_viajes
FROM vales v
JOIN vale_material_detalles vmd ON vmd.id_vale  = v.id_vale
JOIN material m                 ON m.id_material = vmd.id_material
LEFT JOIN (
  SELECT id_detalle_material, COUNT(*) AS viaje_count
  FROM vale_material_viajes
  GROUP BY id_detalle_material
) vc ON vc.id_detalle_material = vmd.id_detalle_material
WHERE
  v.tipo_vale = 'material'
  AND v.estado IN ('en_proceso', 'emitido', 'verificado', 'conciliado')
  AND v.id_obra <> 888
GROUP BY
  v.id_obra,
  date_trunc('month', v.fecha_creacion AT TIME ZONE 'America/Mexico_City')::date,
  vmd.id_material,
  m.material
WITH DATA;

-- Índice UNIQUE requerido para REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX uidx_mv_stats_material
  ON mv_stats_material (id_obra, mes, id_material);

-- Índice de búsqueda para el filtro más común: obra + rango de mes
CREATE INDEX idx_mv_stats_material_obra_mes
  ON mv_stats_material (id_obra, mes);


-- ============================================================
-- mv_stats_renta
-- Agrupado por (id_obra, mes)
-- ============================================================

CREATE MATERIALIZED VIEW mv_stats_renta AS
SELECT
  v.id_obra,
  date_trunc('month', v.fecha_creacion AT TIME ZONE 'America/Mexico_City')::date AS mes,
  COUNT(DISTINCT v.id_vale)         AS total_vales,
  SUM(COALESCE(vrd.total_horas, 0)) AS total_horas,
  SUM(COALESCE(vrd.total_dias,  0)) AS total_dias,
  SUM(COALESCE(vrd.costo_total, 0)) AS costo_total
FROM vales v
JOIN vale_renta_detalle vrd ON vrd.id_vale = v.id_vale
WHERE
  v.tipo_vale = 'renta'
  AND v.estado IN ('aceptado', 'en_proceso', 'emitido', 'verificado', 'conciliado')
  AND v.id_obra <> 888
GROUP BY
  v.id_obra,
  date_trunc('month', v.fecha_creacion AT TIME ZONE 'America/Mexico_City')::date
WITH DATA;

-- Índice UNIQUE requerido para REFRESH CONCURRENTLY
CREATE UNIQUE INDEX uidx_mv_stats_renta
  ON mv_stats_renta (id_obra, mes);

-- Índice de búsqueda
CREATE INDEX idx_mv_stats_renta_obra_mes
  ON mv_stats_renta (id_obra, mes);


-- ============================================================
-- función refrescar_stats()
-- SECURITY DEFINER: el rol authenticated puede llamarla via rpc()
-- sin tener permisos directos de REFRESH MATERIALIZED VIEW.
-- El owner de la función debe ser el superusuario del proyecto.
-- ============================================================

CREATE OR REPLACE FUNCTION refrescar_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_material;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_renta;
END;
$$;


-- ============================================================
-- Grants de acceso
-- Las matviews no soportan RLS nativo. El filtro por id_obra
-- en las queries de los hooks garantiza que cada usuario
-- solo vea datos de sus obras asignadas.
-- ============================================================

GRANT SELECT  ON mv_stats_material          TO authenticated;
GRANT SELECT  ON mv_stats_renta             TO authenticated;
REVOKE ALL    ON mv_stats_material          FROM anon;
REVOKE ALL    ON mv_stats_renta             FROM anon;
GRANT EXECUTE ON FUNCTION refrescar_stats() TO authenticated;
