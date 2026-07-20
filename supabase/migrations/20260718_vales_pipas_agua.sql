-- Migracion: vales de pipas de agua
-- Fecha: 2026-07-18
--
-- Las pipas reparten agua en obra y se cobran por hora/dia exactamente igual que la
-- renta de equipo. NO son un tipo_vale nuevo: son tipo_vale='renta' + la marca
-- vales.es_pipa_agua, siguiendo el precedente de es_planta_asfaltos y es_programado.
--
-- Lo unico que cambia: otros camiones, otras placas, otro sindicato, material = Agua.
-- Las pipas NO consumen presupuesto_renta_obra y NO aparecen en las estadisticas de
-- renta (tienen su propia matview mv_stats_pipas).
--
-- IMPORTANTE: ejecutar en el SQL Editor de Supabase con el usuario postgres (owner),
-- igual que 20260505_mv_stats.sql. Correr esta migracion ANTES de desplegar la app,
-- o el INSERT de vales con es_pipa_agua truena en produccion.
--
-- ANTES DE CORRER, editar los marcadores << EDITAR >>:
--   - Los tres nombres del sindicato de pipas (seccion 3.3)
--   - costo_hr y costo_dia reales del sindicato de pipas (seccion 3.4)


-- ============================================================
-- 1. Columnas nuevas (aditivas, no destructivas)
-- ============================================================

-- 1.1 Sello inmutable en la cabecera del vale. Se escribe una vez en el INSERT y
--     nunca se actualiza: clasifica el vale historico aunque los catalogos cambien.
ALTER TABLE public.vales
  ADD COLUMN IF NOT EXISTS es_pipa_agua boolean NOT NULL DEFAULT false;

-- 1.2 Dimension de catalogo: marca el sindicato de pipas. Solo para filtrar el
--     picker de sindicato en la app; nunca para clasificar un vale ya creado.
ALTER TABLE public.sindicatos
  ADD COLUMN IF NOT EXISTS es_pipas boolean NOT NULL DEFAULT false;

-- 1.3 Dimension de catalogo: marca el material Agua. Espejo semantico de
--     material.es_material_descarga (booleano de comportamiento por material).
ALTER TABLE public.material
  ADD COLUMN IF NOT EXISTS es_agua_pipa boolean NOT NULL DEFAULT false;


-- ============================================================
-- 3. Semillas de catalogo (idempotentes)
-- ============================================================
--
-- PATRON: agregado en subconsulta escalar, SELECT externo SIN FROM, WHERE NOT EXISTS.
-- Un MAX() con WHERE sobre conjunto vacio devuelve NULL -> COALESCE -> 0 -> insertaria
-- id=1 encima del catalogo. Por eso el MAX va en una subconsulta y el WHERE filtra la
-- unica fila sintetica del SELECT sin FROM.

-- 3.1 tipo_de_material "Agua"
INSERT INTO public.tipo_de_material (id_tipo_de_material, tipo_de_material)
SELECT (SELECT COALESCE(MAX(id_tipo_de_material), 0) + 1 FROM public.tipo_de_material),
       'Agua'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tipo_de_material WHERE lower(tipo_de_material) = 'agua'
);

SELECT setval(pg_get_serial_sequence('public.tipo_de_material', 'id_tipo_de_material'),
              (SELECT MAX(id_tipo_de_material) FROM public.tipo_de_material))
WHERE pg_get_serial_sequence('public.tipo_de_material', 'id_tipo_de_material') IS NOT NULL;

-- 3.2 material "Agua" (es_agua_pipa = true)
-- es_material_descarga = true habilita el ticket de descarga para las pipas,
-- que en su caso registra el POZO al que se va a rellenar agua (ver
-- TicketDescargaSection: el texto cambia a "pozo" cuando el vale es de pipa).
INSERT INTO public.material
  (id_material, material, id_tipo_de_material, es_material_descarga, activo, es_agua_pipa)
SELECT (SELECT COALESCE(MAX(id_material), 0) + 1 FROM public.material),
       'Agua',
       (SELECT id_tipo_de_material FROM public.tipo_de_material WHERE lower(tipo_de_material) = 'agua'),
       true,    -- es_material_descarga: habilita el ticket de pozo
       true,    -- activo
       true     -- es_agua_pipa
WHERE NOT EXISTS (SELECT 1 FROM public.material WHERE es_agua_pipa = true);

SELECT setval(pg_get_serial_sequence('public.material', 'id_material'),
              (SELECT MAX(id_material) FROM public.material))
WHERE pg_get_serial_sequence('public.material', 'id_material') IS NOT NULL;

-- 3.3 sindicato de pipas (es_pipas = true)
--     << EDITAR >> los tres nombres con los reales antes de correr.
INSERT INTO public.sindicatos
  (id_sindicato, sindicato, nombre_completo, nombre_firma_conciliacion, es_pipas)
SELECT (SELECT COALESCE(MAX(id_sindicato), 0) + 1 FROM public.sindicatos),
       'Pipas',                        -- << EDITAR >> nombre corto (el que ve el usuario en el picker)
       'Sindicato de Pipas de Agua',   -- << EDITAR >> nombre completo real
       'Sindicato de Pipas de Agua',   -- << EDITAR >> nombre para la firma de conciliacion
       true
WHERE NOT EXISTS (SELECT 1 FROM public.sindicatos WHERE es_pipas = true);

SELECT setval(pg_get_serial_sequence('public.sindicatos', 'id_sindicato'),
              (SELECT MAX(id_sindicato) FROM public.sindicatos))
WHERE pg_get_serial_sequence('public.sindicatos', 'id_sindicato') IS NOT NULL;

-- 3.4 precio de renta del sindicato de pipas.
--     << EDITAR >> costo_hr y costo_dia reales. NO dejar 0: facturaria vales en $0.
--     Si prefieres no capturarlos aun, OMITE este INSERT: ValeRentaScreen lanza
--     "No se encontro precio para el sindicato seleccionado" (falla ruidosa, mejor
--     que un vale en cero).
INSERT INTO public.precios_renta (id_precios_renta, id_sindicato, costo_hr, costo_dia)
SELECT (SELECT COALESCE(MAX(id_precios_renta), 0) + 1 FROM public.precios_renta),
       (SELECT id_sindicato FROM public.sindicatos WHERE es_pipas = true LIMIT 1),
       0,   -- << EDITAR >> costo por hora real
       0    -- << EDITAR >> costo por dia real
WHERE NOT EXISTS (
  SELECT 1 FROM public.precios_renta pr
  JOIN public.sindicatos s ON s.id_sindicato = pr.id_sindicato
  WHERE s.es_pipas = true
);

SELECT setval(pg_get_serial_sequence('public.precios_renta', 'id_precios_renta'),
              (SELECT MAX(id_precios_renta) FROM public.precios_renta))
WHERE pg_get_serial_sequence('public.precios_renta', 'id_precios_renta') IS NOT NULL;

-- Verificacion inmediata: cada SELECT debe devolver exactamente 1 fila.
--   SELECT id_material, material, es_agua_pipa FROM public.material   WHERE es_agua_pipa;
--   SELECT id_sindicato, sindicato, es_pipas    FROM public.sindicatos WHERE es_pipas;
--   SELECT pr.* FROM public.precios_renta pr JOIN public.sindicatos s USING (id_sindicato) WHERE s.es_pipas;
--
-- Los vehiculos y operadores de pipas se dan de alta a mano apuntando su id_sindicato
-- al sindicato Pipas. Sin vehiculos.qr_uid el flujo QR no tiene que escanear.


-- ============================================================
-- 4. Trigger de presupuesto de renta -- que IGNORE las pipas
-- ============================================================
--
-- Arquitectura confirmada en Fase 0: dos triggers sobre vales / vale_renta_detalle
-- (trg_recalcular_consumo_renta AFTER UPDATE OF estado; trg_recalcular_consumo_renta_
-- detalle AFTER INSERT/DELETE/UPDATE OF costo_total) que delegan el recalculo del
-- monto_consumido en recalcular_presupuesto_renta_fn(p_id_obra). Esta funcion RECOMPUTA
-- el total completo de la obra desde cero (no incremental), asi que basta excluir las
-- pipas de su SUM: es Caso A (autosanador) y este es el UNICO punto a tocar.
--
-- Copia VERBATIM del output de pg_get_functiondef (Fase 0) mas UNA sola linea nueva
-- "AND NOT v.es_pipa_agua". Conserva SECURITY DEFINER y SET search_path = public.
--
-- Cuerpo ORIGINAL (backup, unica copia -- no estaba en el repo):
--   SELECT COALESCE(SUM(vrd.costo_total), 0) INTO v_total
--   FROM vale_renta_detalle vrd JOIN vales v ON v.id_vale = vrd.id_vale
--   WHERE v.id_obra = p_id_obra AND v.tipo_vale = 'renta'
--     AND v.estado IN ('en_proceso','emitido','verificado','conciliado')
--     AND v.id_obra != 888;
--   UPDATE presupuesto_renta_obra SET monto_consumido = v_total, updated_at = now()
--    WHERE id_obra = p_id_obra AND activo = true;
--
-- NO tocar calcular_totales_vale_renta ni completar_vale_renta (las pipas comparten
-- ese calculo). NO crear fila en presupuesto_renta_obra para pipas.

CREATE OR REPLACE FUNCTION public.recalcular_presupuesto_renta_fn(p_id_obra integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(vrd.costo_total), 0)
  INTO v_total
  FROM vale_renta_detalle vrd
  JOIN vales v ON v.id_vale = vrd.id_vale
  WHERE v.id_obra   = p_id_obra
    AND v.tipo_vale = 'renta'
    AND NOT v.es_pipa_agua           -- << unica linea nueva: las pipas no consumen presupuesto de renta
    AND v.estado    IN ('en_proceso','emitido','verificado','conciliado')
    AND v.id_obra   != 888;

  UPDATE presupuesto_renta_obra
     SET monto_consumido = v_total, updated_at = now()
   WHERE id_obra = p_id_obra
     AND activo  = true;
END;
$function$;


-- ============================================================
-- 5. Matviews de estadisticas
-- ============================================================
--
-- mv_stats_renta se recrea IDENTICA a 20260505_mv_stats.sql (mismos estados incluido
-- 'aceptado', mismo id_obra <> 888, mismos indices y grants) mas una sola linea nueva
-- "AND NOT v.es_pipa_agua". Como al migrar aun no existe ninguna pipa, la matview
-- recreada debe salir EXACTAMENTE igual al baseline capturado en Fase 0 (prueba de
-- regresion determinista para la obra 146).
--
-- Postgres no tiene CREATE OR REPLACE MATERIALIZED VIEW: hay DROP + CREATE. Todo en
-- una transaccion para que sea atomico -- si algo falla, ROLLBACK deja mv_stats_renta
-- como estaba y las estadisticas de 146 no se caen. Correr fuera de horario de obra.

BEGIN;

DROP MATERIALIZED VIEW IF EXISTS public.mv_stats_renta;

CREATE MATERIALIZED VIEW public.mv_stats_renta AS
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
  AND NOT v.es_pipa_agua                 -- << unico cambio vs 20260505_mv_stats.sql
  AND v.estado IN ('aceptado', 'en_proceso', 'emitido', 'verificado', 'conciliado')
  AND v.id_obra <> 888
GROUP BY
  v.id_obra,
  date_trunc('month', v.fecha_creacion AT TIME ZONE 'America/Mexico_City')::date
WITH DATA;

CREATE UNIQUE INDEX uidx_mv_stats_renta         ON public.mv_stats_renta (id_obra, mes);
CREATE INDEX        idx_mv_stats_renta_obra_mes ON public.mv_stats_renta (id_obra, mes);
GRANT SELECT ON public.mv_stats_renta TO authenticated;
REVOKE ALL   ON public.mv_stats_renta FROM anon;

-- mv_stats_pipas: misma forma y mismas claves, particion complementaria. Nada
-- existente la lee todavia. WITH DATA la deja poblada (con 0 filas) para que
-- REFRESH CONCURRENTLY funcione desde la primera llamada.
CREATE MATERIALIZED VIEW public.mv_stats_pipas AS
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
  AND v.es_pipa_agua
  AND v.estado IN ('aceptado', 'en_proceso', 'emitido', 'verificado', 'conciliado')
  AND v.id_obra <> 888
GROUP BY
  v.id_obra,
  date_trunc('month', v.fecha_creacion AT TIME ZONE 'America/Mexico_City')::date
WITH DATA;

CREATE UNIQUE INDEX uidx_mv_stats_pipas         ON public.mv_stats_pipas (id_obra, mes);
CREATE INDEX        idx_mv_stats_pipas_obra_mes ON public.mv_stats_pipas (id_obra, mes);
GRANT SELECT ON public.mv_stats_pipas TO authenticated;
REVOKE ALL   ON public.mv_stats_pipas FROM anon;

-- refrescar_stats(): copia literal de 20260505_mv_stats.sql mas la tercera matview.
CREATE OR REPLACE FUNCTION refrescar_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_material;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_renta;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_pipas;
END;
$$;

GRANT EXECUTE ON FUNCTION refrescar_stats() TO authenticated;

COMMIT;

-- Post-COMMIT (fuera de la transaccion):
--   SELECT refrescar_stats();
--   SELECT * FROM mv_stats_renta WHERE id_obra = 146 ORDER BY mes;  -- comparar vs baseline
