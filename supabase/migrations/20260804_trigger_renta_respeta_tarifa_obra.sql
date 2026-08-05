-- Migracion: calcular_totales_vale_renta respeta la tarifa congelada del vale
-- Fecha: 2026-08-04
-- Depende de: 20260804_tarifas_por_obra.sql (crea costo_hr_aplicado / costo_dia_aplicado)
--
-- PROBLEMA
-- El trigger es BEFORE INSERT/UPDATE sobre vale_renta_detalle y reescribia
-- NEW.costo_total leyendo SIEMPRE de precios_renta via NEW.id_precios_renta:
--
--   SELECT costo_dia INTO v_costo_dia FROM precios_renta
--    WHERE id_precios_renta = NEW.id_precios_renta;
--   NEW.costo_total := ROUND(v_costo_dia, 2);
--
-- Con la feature de tarifas por obra eso rompe dos cosas:
--   1. Los vales nuevos de una obra con tarifa propia: la app calcula bien el
--      costo_total con la tarifa de obra y el trigger se lo pisa con la del
--      sindicato. Detectado al repreciar el vale TR-145-00001 (obra 21): la
--      fila quedaba con costo_dia_aplicado = 4850 y costo_total = 4750.
--   2. Cualquier reprecio manual del historico, por la misma razon.
--
-- FIX
-- La tarifa congelada en el vale manda; el join a precios_renta queda solo como
-- respaldo. Es la misma regla que `tarifaRentaEfectiva()` en
-- src/utils/preciosRenta.js, ahora tambien del lado de la BD.
--
-- COMPATIBILIDAD
-- En vales anteriores al 2026-08-04 costo_hr_aplicado / costo_dia_aplicado son
-- NULL, el COALESCE cae al default del sindicato y el comportamiento es
-- identico al de antes. Ningun vale historico cambia de importe.
--
-- Lo unico que cambia respecto al cuerpo anterior es de donde sale el precio.
-- El calculo de horas, los ajustes de total_horas / total_dias / hora_fin y el
-- hecho de que "medio dia" (es_renta_por_dia = false + hora_fin NULL) no entre
-- a ninguna rama se conservan tal cual.
--
-- IMPORTANTE: correr en el SQL Editor de Supabase.

CREATE OR REPLACE FUNCTION public.calcular_totales_vale_renta()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_costo_hr NUMERIC;
  v_costo_dia NUMERIC;
  v_horas_calculadas NUMERIC;
BEGIN
  -- Tarifa por defecto del sindicato (respaldo para vales previos a 2026-08-04)
  IF NEW.id_precios_renta IS NOT NULL THEN
    SELECT costo_hr, costo_dia
      INTO v_costo_hr, v_costo_dia
      FROM public.precios_renta
     WHERE id_precios_renta = NEW.id_precios_renta;
  END IF;

  -- La tarifa congelada en el vale gana: puede venir de la tarifa propia de la
  -- obra (precios_renta_obra) o de la del sindicato, ya resuelta al crearlo.
  v_costo_hr  := COALESCE(NEW.costo_hr_aplicado,  v_costo_hr);
  v_costo_dia := COALESCE(NEW.costo_dia_aplicado, v_costo_dia);

  -- CASO 1: RENTA POR DIA COMPLETO
  IF NEW.es_renta_por_dia = true THEN

    NEW.hora_fin    := NULL;
    NEW.total_horas := 0;
    NEW.total_dias  := 1;

    IF v_costo_dia IS NOT NULL THEN
      NEW.costo_total := ROUND(v_costo_dia, 2);
    END IF;

  -- CASO 2: RENTA POR HORAS
  ELSIF NEW.es_renta_por_dia = false
    AND NEW.hora_fin IS NOT NULL
    AND NEW.hora_inicio IS NOT NULL THEN

    v_horas_calculadas := EXTRACT(EPOCH FROM (NEW.hora_fin - NEW.hora_inicio)) / 3600;
    NEW.total_horas := ROUND(v_horas_calculadas, 2);
    NEW.total_dias  := 0;

    IF v_costo_hr IS NOT NULL THEN
      NEW.costo_total := ROUND(v_horas_calculadas * v_costo_hr, 2);
    END IF;
  END IF;

  -- MEDIO DIA (es_renta_por_dia = false + hora_fin NULL) no entra a ninguna
  -- rama, igual que antes: conserva el costo_total que escribio la app
  -- (costo_dia / 2). No agregar una rama aqui sin revisar ValeDetalleRenta.js.

  RETURN NEW;
END;
$function$;

-- ── Verificacion posterior ──────────────────────────────────────────────────
-- SELECT pg_get_functiondef(p.oid)
-- FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname = 'calcular_totales_vale_renta';
