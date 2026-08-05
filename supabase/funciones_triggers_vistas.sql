-- =============================================================================
-- SNAPSHOT DE FUNCIONES, TRIGGERS Y VISTAS — schema public
-- Volcado desde Supabase el 2026-08-04 (pg_get_functiondef / pg_get_triggerdef)
-- =============================================================================
--
-- QUE ES ESTE ARCHIVO
-- Referencia consolidada, igual que schema.sql lo es para tablas. NO son
-- migraciones: la mayoria de estos objetos se creo a mano en el SQL Editor y
-- nunca tuvo migracion. Reconstruir esa historia seria inventarla.
--
-- NO CORRER ESTE ARCHIVO COMPLETO CONTRA LA BD. Sirve para leer que hace cada
-- objeto sin tener que abrir Supabase. Si necesitas cambiar uno, escribe una
-- migracion nueva en migrations/ con solo ese objeto (como hizo
-- 20260804_trigger_renta_respeta_tarifa_obra.sql).
--
-- POR QUE EXISTE
-- El 2026-08-04, al repreciar vales con las tarifas por obra, el trigger
-- calcular_totales_vale_renta revertia en silencio el costo_total. Su cuerpo no
-- estaba en el repo: solo aparecia en unos GRANT/REVOKE. Se perdio medio dia en
-- diagnosticar algo que se habria visto de inmediato leyendo el codigo. De ahi
-- este volcado.
--
-- INVENTARIO: 26 funciones, 14 triggers, 2 vistas, 3 matviews.
-- Antes de esto el repo tenia el cuerpo de 3 funciones y de 0 triggers.
--
-- Ver la seccion HALLAZGOS al final: hay bugs y codigo muerto encontrados al
-- leer esto, no todo lo de aqui funciona.
-- =============================================================================


-- =============================================================================
-- 1. FUNCIONES DE TRIGGER — utilitarias (updated_at)
-- =============================================================================
-- Hay CINCO funciones que hacen exactamente lo mismo (NEW.updated_at = NOW()).
-- Se fueron creando una por tabla. No unificarlas sin recrear los 6 triggers
-- que las usan; el beneficio es cosmetico y el riesgo no.

CREATE OR REPLACE FUNCTION public.actualizar_updated_at()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_app_config_timestamp()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_persona_obra_updated_at()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_presupuesto_updated_at()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;


-- =============================================================================
-- 2. FUNCIONES DE TRIGGER — logica de negocio
-- =============================================================================

-- ── calcular_totales_vale_renta ──────────────────────────────────────────────
-- LA MAS IMPORTANTE DE ESTE ARCHIVO. Es BEFORE INSERT OR UPDATE sobre
-- vale_renta_detalle y REESCRIBE NEW.costo_total: lo que escriba la app se pisa.
-- Version vigente en migrations/20260804_trigger_renta_respeta_tarifa_obra.sql
-- (respeta costo_hr_aplicado / costo_dia_aplicado). Ver CLAUDE.md raiz.
--
-- Ojo con sus ramas:
--   dia completo (es_renta_por_dia = true)  -> recalcula costo_total
--   por horas    (false + hora_fin NOT NULL)-> recalcula costo_total y total_horas
--   MEDIO DIA    (false + hora_fin NULL)    -> no entra a ninguna rama;
--                                              conserva lo que escribio la app
CREATE OR REPLACE FUNCTION public.calcular_totales_vale_renta()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_costo_hr NUMERIC;
  v_costo_dia NUMERIC;
  v_horas_calculadas NUMERIC;
BEGIN
  IF NEW.id_precios_renta IS NOT NULL THEN
    SELECT costo_hr, costo_dia
      INTO v_costo_hr, v_costo_dia
      FROM public.precios_renta
     WHERE id_precios_renta = NEW.id_precios_renta;
  END IF;

  v_costo_hr  := COALESCE(NEW.costo_hr_aplicado,  v_costo_hr);
  v_costo_dia := COALESCE(NEW.costo_dia_aplicado, v_costo_dia);

  IF NEW.es_renta_por_dia = true THEN
    NEW.hora_fin    := NULL;
    NEW.total_horas := 0;
    NEW.total_dias  := 1;
    IF v_costo_dia IS NOT NULL THEN
      NEW.costo_total := ROUND(v_costo_dia, 2);
    END IF;

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

  RETURN NEW;
END;
$function$;

-- ── generar_folio_conciliacion ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generar_folio_conciliacion()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.folio := nextval('conciliaciones_folio_seq')::varchar;
  RETURN NEW;
END;
$function$;

-- ── crear_notificaciones_nuevo_vale ──────────────────────────────────────────
-- ROTA: compara r.role IN ('ADMINISTRADOR','FINANZAS') en MAYUSCULAS y los
-- valores reales son 'Administrador' / 'Finanzas'. Nunca inserta nada.
-- Ver HALLAZGOS #1 al final.
CREATE OR REPLACE FUNCTION public.crear_notificaciones_nuevo_vale()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO notificaciones (id_vale, id_usuario, leida)
  SELECT
    NEW.id_vale,
    p.id_persona,
    false
  FROM persona p
  INNER JOIN roles r ON p.id_role = r.id_roles
  WHERE r.role IN ('ADMINISTRADOR', 'FINANZAS')
  AND p.id_persona IS NOT NULL;

  RETURN NEW;
END;
$function$;

-- ── Recalculo de presupuesto: 4 triggers + 2 funciones de apoyo ──────────────
-- Todos excluyen la obra 888 (prueba), consistente con la regla del proyecto.

CREATE OR REPLACE FUNCTION public.recalcular_consumo_material()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_det RECORD;
  ESTADOS TEXT[] := ARRAY['en_proceso','emitido','verificado','conciliado'];
BEGIN
  IF NEW.tipo_vale != 'material'                                   THEN RETURN NEW; END IF;
  IF OLD.estado = NEW.estado                                       THEN RETURN NEW; END IF;
  IF NOT (OLD.estado = ANY(ESTADOS) OR NEW.estado = ANY(ESTADOS))  THEN RETURN NEW; END IF;
  IF NEW.id_obra = 888                                             THEN RETURN NEW; END IF;

  FOR v_det IN
    SELECT DISTINCT id_material FROM vale_material_detalles WHERE id_vale = NEW.id_vale
  LOOP
    PERFORM recalcular_presupuesto_material_fn(NEW.id_obra, v_det.id_material);
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalcular_consumo_material_desde_detalle()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_id_obra     INTEGER;
  v_id_vale     BIGINT;
  v_id_material INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_id_vale := OLD.id_vale; v_id_material := OLD.id_material;
  ELSE
    v_id_vale := NEW.id_vale; v_id_material := NEW.id_material;
  END IF;

  SELECT id_obra INTO v_id_obra FROM vales WHERE id_vale = v_id_vale;

  IF v_id_obra IS NOT NULL AND v_id_obra != 888 THEN
    PERFORM recalcular_presupuesto_material_fn(v_id_obra, v_id_material);
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalcular_consumo_renta()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  ESTADOS TEXT[] := ARRAY['en_proceso','emitido','verificado','conciliado'];
BEGIN
  IF NEW.tipo_vale != 'renta'                                      THEN RETURN NEW; END IF;
  IF OLD.estado = NEW.estado                                       THEN RETURN NEW; END IF;
  IF NOT (OLD.estado = ANY(ESTADOS) OR NEW.estado = ANY(ESTADOS))  THEN RETURN NEW; END IF;
  IF NEW.id_obra = 888                                             THEN RETURN NEW; END IF;

  PERFORM recalcular_presupuesto_renta_fn(NEW.id_obra);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalcular_consumo_renta_desde_detalle()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_id_obra INTEGER;
  v_id_vale BIGINT;
BEGIN
  IF TG_OP = 'DELETE' THEN v_id_vale := OLD.id_vale;
  ELSE v_id_vale := NEW.id_vale;
  END IF;

  SELECT id_obra INTO v_id_obra FROM vales WHERE id_vale = v_id_vale;

  IF v_id_obra IS NOT NULL AND v_id_obra != 888 THEN
    PERFORM recalcular_presupuesto_renta_fn(v_id_obra);
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;


-- =============================================================================
-- 3. FUNCIONES DE APOYO (llamadas con PERFORM desde los triggers de arriba)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recalcular_presupuesto_material_fn(p_id_obra integer, p_id_material integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(vmd.volumen_real_m3), 0)
  INTO v_total
  FROM vale_material_detalles vmd
  JOIN vales v ON v.id_vale = vmd.id_vale
  WHERE v.id_obra       = p_id_obra
    AND vmd.id_material = p_id_material
    AND v.tipo_vale     = 'material'
    AND v.estado        IN ('en_proceso','emitido','verificado','conciliado')
    AND v.id_obra      != 888;

  UPDATE presupuesto_material_obra
     SET m3_consumidos = v_total, updated_at = now()
   WHERE id_obra     = p_id_obra
     AND id_material = p_id_material
     AND activo      = true;
END;
$function$;

-- NOT v.es_pipa_agua: las pipas no consumen presupuesto de renta (feature pipas)
CREATE OR REPLACE FUNCTION public.recalcular_presupuesto_renta_fn(p_id_obra integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
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
    AND NOT v.es_pipa_agua
    AND v.estado    IN ('en_proceso','emitido','verificado','conciliado')
    AND v.id_obra  != 888;

  UPDATE presupuesto_renta_obra
     SET monto_consumido = v_total, updated_at = now()
   WHERE id_obra = p_id_obra
     AND activo  = true;
END;
$function$;


-- =============================================================================
-- 4. FUNCIONES DE NEGOCIO (RPC)
-- =============================================================================
-- LA APP MOVIL/WEB SOLO LLAMA A UNA: refrescar_stats
-- (src/screens/EstadisticasScreen.js:60 es el unico .rpc() del repo).
-- Todo lo demas de esta seccion o lo consume la web publica de verificacion
-- (otro repo) o es codigo muerto. Ver HALLAZGOS #2 y #3.

-- ── refrescar_stats — LA UNICA QUE USA LA APP ────────────────────────────────
-- CONCURRENTLY exige indice UNIQUE en cada matview; si agregas una matview
-- nueva a esta funcion, no olvides el indice o falla en runtime.
CREATE OR REPLACE FUNCTION public.refrescar_stats()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_material;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_renta;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_pipas;
END;
$function$;

-- ── registrar_descarga_vale_web — la usa la WEB PUBLICA (rol anon) ───────────
-- NO revocar el GRANT a anon: web-acarreos.vercel.app depende de ella.
CREATE OR REPLACE FUNCTION public.registrar_descarga_vale_web(p_folio character varying, p_user_agent text)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_id_vale BIGINT;
  v_total_descargas INTEGER;
BEGIN
  SELECT id_vale, total_descargas_web
  INTO v_id_vale, v_total_descargas
  FROM vales
  WHERE folio = p_folio;

  IF v_id_vale IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Vale no encontrado');
  END IF;

  INSERT INTO vale_accesos (id_vale, id_persona, tipo_accion, ip_address, user_agent)
  VALUES (v_id_vale, NULL, 'descarga_pdf_web', NULL, p_user_agent);

  UPDATE vales
  SET total_descargas_web = total_descargas_web + 1
  WHERE id_vale = v_id_vale;

  RETURN json_build_object('success', true, 'total_descargas', v_total_descargas + 1);
END;
$function$;

-- ── generar_folio_vale — NO LA USA LA APP ────────────────────────────────────
-- src/hooks/useFolioGenerator.js genera el folio en el cliente (SELECT del
-- ultimo + 1). Por eso useValeMaterialLogic tiene que verificar folio duplicado
-- antes de insertar: esta funcion existe justo para evitar esa carrera con un
-- LOCK TABLE, pero nadie la llama. Ver HALLAZGOS #3.
CREATE OR REPLACE FUNCTION public.generar_folio_vale(p_id_obra integer, p_prefijo text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_ultimo_numero INTEGER;
  v_siguiente_numero INTEGER;
  v_nuevo_folio TEXT;
BEGIN
  LOCK TABLE vales IN SHARE ROW EXCLUSIVE MODE;

  SELECT COALESCE(MAX(CAST(SUBSTRING(folio FROM '[0-9]+$') AS INTEGER)), 0)
  INTO v_ultimo_numero
  FROM vales
  WHERE id_obra = p_id_obra
  AND folio LIKE p_prefijo || '%';

  v_siguiente_numero := v_ultimo_numero + 1;
  v_nuevo_folio := p_prefijo || LPAD(v_siguiente_numero::TEXT, 5, '0');

  RETURN v_nuevo_folio;
END;
$function$;

-- ── completar_vale_material — NO LA USA LA APP ───────────────────────────────
-- El flujo real de completado vive en los hooks (useViajesMaterial + los
-- componentes de detalle) con UPDATE directos.
CREATE OR REPLACE FUNCTION public.completar_vale_material(p_id_vale bigint, p_id_detalle integer, p_peso_ton numeric, p_folio_banco text, p_id_material integer, p_id_banco integer)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_peso_especifico numeric;
  v_volumen_real numeric;
  v_result json;
BEGIN
  SELECT peso_especifico INTO v_peso_especifico
  FROM peso_especifico
  WHERE id_material = p_id_material AND id_banco = p_id_banco
  LIMIT 1;

  IF v_peso_especifico IS NULL THEN
    v_peso_especifico := 1.0;
  END IF;

  v_volumen_real := p_peso_ton / v_peso_especifico;

  UPDATE vale_material_detalles
  SET peso_ton = p_peso_ton,
      volumen_real_m3 = v_volumen_real,
      folio_banco = p_folio_banco
  WHERE id_detalle_material = p_id_detalle;

  UPDATE vales
  SET estado = 'emitido', fecha_emision = NOW()
  WHERE id_vale = p_id_vale;

  SELECT json_build_object(
    'success', true,
    'peso_ton', p_peso_ton,
    'volumen_real_m3', v_volumen_real,
    'folio_banco', p_folio_banco
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

-- ── completar_vale_renta — DOS SOBRECARGAS, NINGUNA EN USO ───────────────────
-- La de 7 parametros NO escribe costo_total; la de 8 si. Conviven, asi que una
-- llamada RPC con 7 argumentos elige silenciosamente la que deja el importe sin
-- tocar. Ver HALLAZGOS #4.

CREATE OR REPLACE FUNCTION public.completar_vale_renta(p_id_vale bigint, p_id_detalle integer, p_hora_fin timestamp with time zone, p_total_horas numeric, p_total_dias numeric, p_numero_viajes integer, p_es_renta_por_dia boolean DEFAULT false)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE vale_renta_detalle
  SET es_renta_por_dia = p_es_renta_por_dia,
      hora_fin = p_hora_fin,
      total_horas = p_total_horas,
      total_dias = p_total_dias,
      numero_viajes = p_numero_viajes,
      updated_at = NOW()
  WHERE id_vale_renta_detalle = p_id_detalle;

  UPDATE vales SET estado = 'emitido' WHERE id_vale = p_id_vale;

  RETURN json_build_object('success', true, 'id_vale', p_id_vale);
END;
$function$;

CREATE OR REPLACE FUNCTION public.completar_vale_renta(p_id_vale bigint, p_id_detalle integer, p_hora_fin timestamp with time zone, p_total_horas numeric, p_total_dias numeric, p_numero_viajes integer, p_es_renta_por_dia boolean DEFAULT false, p_costo_total numeric DEFAULT NULL::numeric)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE vale_renta_detalle
  SET es_renta_por_dia = p_es_renta_por_dia,
      hora_fin = p_hora_fin,
      total_horas = p_total_horas,
      total_dias = p_total_dias,
      numero_viajes = p_numero_viajes,
      costo_total = p_costo_total,
      updated_at = NOW()
  WHERE id_vale_renta_detalle = p_id_detalle;

  UPDATE vales SET estado = 'emitido' WHERE id_vale = p_id_vale;

  RETURN json_build_object('success', true, 'id_vale', p_id_vale);
END;
$function$;

-- ── verificar_vale — NO LA LLAMA ESTA APP (posible consumidor: web publica) ──
CREATE OR REPLACE FUNCTION public.verificar_vale(p_folio text, p_id_persona_verificador integer)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_vale_id bigint;
BEGIN
  SELECT id_vale INTO v_vale_id
  FROM vales
  WHERE folio = p_folio
  AND estado = 'emitido'
  AND verificado_por_sindicato = false;

  IF v_vale_id IS NULL THEN
    RETURN json_build_object('success', false,
      'error', 'Vale no encontrado, ya verificado, o no está en estado emitido');
  END IF;

  UPDATE vales
  SET verificado_por_sindicato = true,
      fecha_verificacion = now(),
      id_persona_verificador = p_id_persona_verificador,
      estado = 'verificado'
  WHERE id_vale = v_vale_id;

  RETURN json_build_object('success', true, 'id_vale', v_vale_id, 'folio', p_folio);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- ── Desverificacion: solicitar / responder ───────────────────────────────────
-- solicitar_desverificacion es la mejor escrita de todo el archivo: resuelve la
-- identidad del llamador con auth.uid() en vez de confiar en el parametro, y
-- compara 'Administrador' en PascalCase (correcto).
CREATE OR REPLACE FUNCTION public.solicitar_desverificacion(p_id_vale integer, p_id_persona_solicitante integer, p_motivo text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_estado_vale      VARCHAR;
  v_id_sindicato     INT;
  v_sindicato_nombre TEXT;
  v_id_solicitud     INT;
  v_id_persona_auth  INT;
  v_role_auth        TEXT;
BEGIN
  SELECT p.id_persona, r.role INTO v_id_persona_auth, v_role_auth
  FROM persona p
  JOIN roles r ON r.id_roles = p.id_role
  WHERE p.auth_user_id = auth.uid();

  IF v_id_persona_auth IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sesión no válida');
  END IF;

  IF v_id_persona_auth IS DISTINCT FROM p_id_persona_solicitante THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes solicitar en nombre de otra persona');
  END IF;

  IF v_role_auth <> 'Administrador' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo un Administrador puede solicitar desverificación');
  END IF;

  SELECT estado INTO v_estado_vale FROM vales WHERE id_vale = p_id_vale FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Vale no encontrado'); END IF;
  IF v_estado_vale <> 'verificado' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo se pueden desverificar vales en estado verificado');
  END IF;
  IF EXISTS (SELECT 1 FROM solicitudes_desverificacion WHERE id_vale = p_id_vale AND estado = 'pendiente') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya existe una solicitud pendiente para este vale');
  END IF;

  SELECT o.id_sindicato, s.sindicato INTO v_id_sindicato, v_sindicato_nombre
  FROM vales v
  JOIN operadores o ON o.id_operador = v.id_operador
  JOIN sindicatos s ON s.id_sindicato = o.id_sindicato
  WHERE v.id_vale = p_id_vale;

  IF v_id_sindicato IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se pudo determinar el sindicato del operador');
  END IF;

  INSERT INTO solicitudes_desverificacion (id_vale, id_persona_solicitante, id_sindicato_requerido, estado, motivo_solicitud)
  VALUES (p_id_vale, p_id_persona_solicitante, v_id_sindicato, 'pendiente', p_motivo)
  RETURNING id_solicitud INTO v_id_solicitud;

  INSERT INTO vale_accesos (id_vale, id_persona, tipo_accion, user_agent)
  VALUES (p_id_vale, p_id_persona_solicitante, 'solicitud_desverificacion', 'system');

  RETURN jsonb_build_object('success', true, 'id_solicitud', v_id_solicitud, 'sindicato_nombre', v_sindicato_nombre);
END;
$function$;

CREATE OR REPLACE FUNCTION public.responder_desverificacion(p_id_solicitud integer, p_id_persona_respondedor integer, p_aprobado boolean, p_motivo_respuesta text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_solicitud  solicitudes_desverificacion%ROWTYPE;
  v_sindicato_respondedor INT;
BEGIN
  SELECT * INTO v_solicitud FROM solicitudes_desverificacion WHERE id_solicitud = p_id_solicitud FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Solicitud no encontrada'); END IF;
  IF v_solicitud.estado <> 'pendiente' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta solicitud ya fue respondida');
  END IF;

  SELECT id_sindicato INTO v_sindicato_respondedor FROM persona WHERE id_persona = p_id_persona_respondedor;
  IF v_sindicato_respondedor IS DISTINCT FROM v_solicitud.id_sindicato_requerido THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permiso para responder esta solicitud');
  END IF;

  IF p_aprobado THEN
    UPDATE vales SET
      estado = 'emitido',
      verificado_por_sindicato = false,
      fecha_verificacion = NULL,
      id_persona_verificador = NULL
    WHERE id_vale = v_solicitud.id_vale;
  END IF;

  UPDATE solicitudes_desverificacion SET
    estado = CASE WHEN p_aprobado THEN 'aprobada' ELSE 'rechazada' END,
    motivo_respuesta = p_motivo_respuesta,
    fecha_respuesta = NOW(),
    id_persona_respondedor = p_id_persona_respondedor
  WHERE id_solicitud = p_id_solicitud;

  INSERT INTO vale_accesos (id_vale, id_persona, tipo_accion, user_agent)
  VALUES (v_solicitud.id_vale, p_id_persona_respondedor,
    CASE WHEN p_aprobado THEN 'desverificacion_aprobada' ELSE 'desverificacion_rechazada' END,
    'system');

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- ── verificar_conciliacion ───────────────────────────────────────────────────
-- SECURITY DEFINER SIN "SET search_path" — ver HALLAZGOS #5.
CREATE OR REPLACE FUNCTION public.verificar_conciliacion(p_folio character varying, p_id_persona_verificador integer)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_id_conciliacion INTEGER;
  v_ya_verificada BOOLEAN;
  v_role TEXT;
BEGIN
  SELECT r.role INTO v_role
  FROM persona p JOIN roles r ON r.id_roles = p.id_role
  WHERE p.id_persona = p_id_persona_verificador;

  IF v_role IS DISTINCT FROM 'Administrador' THEN
    RETURN json_build_object('success', false, 'error', 'Solo un Administrador puede verificar conciliaciones.');
  END IF;

  SELECT id_conciliacion, verificado INTO v_id_conciliacion, v_ya_verificada
  FROM conciliaciones WHERE folio = p_folio;

  IF v_id_conciliacion IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Conciliación no encontrada.');
  END IF;

  IF v_ya_verificada THEN
    RETURN json_build_object('success', false, 'error', 'Esta conciliación ya fue verificada anteriormente.');
  END IF;

  UPDATE conciliaciones
  SET verificado = true, fecha_verificacion = now(), id_persona_verificador = p_id_persona_verificador
  WHERE id_conciliacion = v_id_conciliacion;

  RETURN json_build_object('success', true);
END;
$function$;

-- ── autorizar_vale / desautorizar_vale — CODIGO MUERTO ───────────────────────
-- Nada en el repo las llama y dependen de columnas (vales.autorizado,
-- fecha_autorizacion, id_persona_autorizador) que no aparecen en schema.sql ni
-- en ninguna migracion. Parecen un feature de autorizacion que se empezo y se
-- abandono. Ambas son SECURITY DEFINER sin SET search_path. Ver HALLAZGOS #5.

CREATE OR REPLACE FUNCTION public.autorizar_vale(p_id_vale bigint, p_id_persona_autorizador bigint)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER
AS $function$
declare
  v_vale record;
  v_rol text;
begin
  select upper(r.role) into v_rol
  from persona p join roles r on r.id_roles = p.id_role
  where p.id_persona = p_id_persona_autorizador;

  if v_rol is distinct from 'ADMINISTRADOR' then
    return json_build_object('success', false, 'error', 'Solo un Administrador puede autorizar vales');
  end if;

  select * into v_vale from vales where id_vale = p_id_vale for update;
  if not found then
    return json_build_object('success', false, 'error', 'Vale no encontrado');
  end if;
  if v_vale.autorizado then
    return json_build_object('success', false, 'error', 'El vale ya está autorizado');
  end if;
  if v_vale.estado in ('conciliado', 'cancelado') then
    return json_build_object('success', false, 'error', 'No se puede autorizar un vale ' || v_vale.estado);
  end if;

  update vales set autorizado = true, fecha_autorizacion = now(),
    id_persona_autorizador = p_id_persona_autorizador where id_vale = p_id_vale;

  return json_build_object('success', true);
end; $function$;

CREATE OR REPLACE FUNCTION public.desautorizar_vale(p_id_vale bigint, p_id_persona_autorizador bigint, p_motivo text DEFAULT NULL::text)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER
AS $function$
declare
  v_vale record;
  v_rol text;
begin
  select upper(r.role) into v_rol
  from persona p join roles r on r.id_roles = p.id_role
  where p.id_persona = p_id_persona_autorizador;

  if v_rol is distinct from 'ADMINISTRADOR' then
    return json_build_object('success', false, 'error', 'Solo un Administrador puede desautorizar vales');
  end if;

  select * into v_vale from vales where id_vale = p_id_vale for update;
  if not found then
    return json_build_object('success', false, 'error', 'Vale no encontrado');
  end if;
  if not v_vale.autorizado then
    return json_build_object('success', false, 'error', 'El vale no está autorizado');
  end if;
  if v_vale.estado = 'conciliado' then
    return json_build_object('success', false, 'error', 'No se puede desautorizar un vale ya conciliado');
  end if;

  update vales set autorizado = false, fecha_autorizacion = null,
    id_persona_autorizador = null where id_vale = p_id_vale;

  return json_build_object('success', true);
end; $function$;


-- =============================================================================
-- 5. TRIGGERS (14)
-- =============================================================================

CREATE TRIGGER app_config_updated_at BEFORE UPDATE ON public.app_config
  FOR EACH ROW EXECUTE FUNCTION update_app_config_timestamp();

CREATE TRIGGER trigger_actualizar_conciliaciones_updated_at BEFORE UPDATE ON public.conciliaciones
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_generar_folio_conciliacion BEFORE INSERT ON public.conciliaciones
  FOR EACH ROW EXECUTE FUNCTION generar_folio_conciliacion();

CREATE TRIGGER trigger_update_persona_obra_timestamp BEFORE UPDATE ON public.persona_obra
  FOR EACH ROW EXECUTE FUNCTION update_persona_obra_updated_at();

CREATE TRIGGER trg_presupuesto_material_updated_at BEFORE UPDATE ON public.presupuesto_material_obra
  FOR EACH ROW EXECUTE FUNCTION update_presupuesto_updated_at();

CREATE TRIGGER trg_presupuesto_renta_updated_at BEFORE UPDATE ON public.presupuesto_renta_obra
  FOR EACH ROW EXECUTE FUNCTION update_presupuesto_updated_at();

CREATE TRIGGER trg_recalcular_consumo_material_detalle
  AFTER INSERT OR DELETE OR UPDATE OF volumen_real_m3, id_material ON public.vale_material_detalles
  FOR EACH ROW EXECUTE FUNCTION recalcular_consumo_material_desde_detalle();

CREATE TRIGGER trg_recalcular_consumo_renta_detalle
  AFTER INSERT OR DELETE OR UPDATE OF costo_total ON public.vale_renta_detalle
  FOR EACH ROW EXECUTE FUNCTION recalcular_consumo_renta_desde_detalle();

-- EL QUE PISA EL IMPORTE DE RENTA. Ver seccion 2.
CREATE TRIGGER trigger_calcular_totales_vale_renta
  BEFORE INSERT OR UPDATE ON public.vale_renta_detalle
  FOR EACH ROW EXECUTE FUNCTION calcular_totales_vale_renta();

CREATE TRIGGER update_vale_renta_detalle_updated_at BEFORE UPDATE ON public.vale_renta_detalle
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_recalcular_consumo_material AFTER UPDATE OF estado ON public.vales
  FOR EACH ROW EXECUTE FUNCTION recalcular_consumo_material();

CREATE TRIGGER trg_recalcular_consumo_renta AFTER UPDATE OF estado ON public.vales
  FOR EACH ROW EXECUTE FUNCTION recalcular_consumo_renta();

CREATE TRIGGER trigger_crear_notificaciones AFTER INSERT ON public.vales
  FOR EACH ROW EXECUTE FUNCTION crear_notificaciones_nuevo_vale();

CREATE TRIGGER update_vales_updated_at BEFORE UPDATE ON public.vales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- 6. VISTAS
-- =============================================================================
-- Ninguna de las dos estaba en el repo ni en schema.sql.

-- Solo estados finales; numero_semana/anio_semana con EXTRACT sin conversion de
-- zona horaria (a diferencia de las matviews, que si usan America/Mexico_City).
CREATE OR REPLACE VIEW public.vales_con_semanas AS
SELECT id_vale, folio, tipo_vale, estado, id_persona_creador, id_obra, fecha_creacion,
    (EXTRACT(week FROM fecha_creacion))::integer AS numero_semana,
    (EXTRACT(year FROM fecha_creacion))::integer AS anio_semana
FROM vales
WHERE ((estado)::text = ANY (ARRAY['emitido'::text, 'verificado'::text, 'conciliado'::text]));

-- Vehiculos activos con sus vales en_proceso agregados. La usa el flujo de QR.
CREATE OR REPLACE VIEW public.vehiculos_vales_activos AS
SELECT vh.id_vehiculo, vh.placas, vh.qr_uid, vh.id_sindicato, vh.capacidad_m3,
    vh.id_operador_sugerido,
    op.nombre_completo AS operador_sugerido_nombre,
    count(v.id_vale) AS vales_activos,
    array_agg(v.id_vale ORDER BY v.fecha_creacion) FILTER (WHERE (v.id_vale IS NOT NULL)) AS ids_vales_activos,
    array_agg(v.folio  ORDER BY v.fecha_creacion) FILTER (WHERE (v.folio IS NOT NULL))    AS folios_activos
FROM ((vehiculos vh
  LEFT JOIN operadores op ON ((op.id_operador = vh.id_operador_sugerido)))
  LEFT JOIN vales v ON (((v.id_vehiculo = vh.id_vehiculo) AND ((v.estado)::text = 'en_proceso'::text))))
WHERE (vh.activo = true)
GROUP BY vh.id_vehiculo, vh.placas, vh.qr_uid, vh.id_sindicato, vh.capacidad_m3,
         vh.id_operador_sugerido, op.nombre_completo;


-- =============================================================================
-- 7. MATVIEWS DE ESTADISTICAS
-- =============================================================================
-- Definidas originalmente en migrations/20260505_mv_stats.sql (material, renta)
-- y 20260718_vales_pipas_agua.sql (pipas). Aqui va el estado REAL en la BD, que
-- ya incorpora la particion renta / pipas por es_pipa_agua.
--
-- Las tres agrupan por mes en America/Mexico_City y excluyen la obra 888.
-- Las tres suman el costo_total DEL DETALLE, no la suma de los viajes: si un
-- viaje trae override de banco y el detalle no se reacumulo, la estadistica
-- arrastra la diferencia (ver CLAUDE.md raiz, seccion overrides).

CREATE MATERIALIZED VIEW public.mv_stats_material AS
SELECT v.id_obra,
    (date_trunc('month'::text, (v.fecha_creacion AT TIME ZONE 'America/Mexico_City'::text)))::date AS mes,
    vmd.id_material,
    m.material AS nombre_material,
    count(DISTINCT v.id_vale) AS total_vales,
    sum(COALESCE(vmd.volumen_real_m3, vmd.cantidad_pedida_m3, (0)::numeric)) AS m3_total,
    sum(COALESCE(vmd.costo_total, (0)::numeric)) AS costo_total,
    sum(COALESCE(vc.viaje_count, (0)::bigint)) AS total_viajes
FROM (((vales v
  JOIN vale_material_detalles vmd ON ((vmd.id_vale = v.id_vale)))
  JOIN material m ON ((m.id_material = vmd.id_material)))
  LEFT JOIN ( SELECT vale_material_viajes.id_detalle_material, count(*) AS viaje_count
              FROM vale_material_viajes
              GROUP BY vale_material_viajes.id_detalle_material) vc
         ON ((vc.id_detalle_material = vmd.id_detalle_material)))
WHERE (((v.tipo_vale)::text = 'material'::text)
  AND ((v.estado)::text = ANY ((ARRAY['en_proceso'::character varying, 'emitido'::character varying, 'verificado'::character varying, 'conciliado'::character varying])::text[]))
  AND (v.id_obra <> 888))
GROUP BY v.id_obra,
  ((date_trunc('month'::text, (v.fecha_creacion AT TIME ZONE 'America/Mexico_City'::text)))::date),
  vmd.id_material, m.material;

-- OJO: renta y pipas aceptan ademas el estado 'aceptado', que material no.
CREATE MATERIALIZED VIEW public.mv_stats_renta AS
SELECT v.id_obra,
    (date_trunc('month'::text, (v.fecha_creacion AT TIME ZONE 'America/Mexico_City'::text)))::date AS mes,
    count(DISTINCT v.id_vale) AS total_vales,
    sum(COALESCE(vrd.total_horas, (0)::numeric)) AS total_horas,
    sum(COALESCE(vrd.total_dias, (0)::numeric)) AS total_dias,
    sum(COALESCE(vrd.costo_total, (0)::numeric)) AS costo_total
FROM (vales v JOIN vale_renta_detalle vrd ON ((vrd.id_vale = v.id_vale)))
WHERE (((v.tipo_vale)::text = 'renta'::text) AND (NOT v.es_pipa_agua)
  AND ((v.estado)::text = ANY ((ARRAY['aceptado'::character varying, 'en_proceso'::character varying, 'emitido'::character varying, 'verificado'::character varying, 'conciliado'::character varying])::text[]))
  AND (v.id_obra <> 888))
GROUP BY v.id_obra,
  ((date_trunc('month'::text, (v.fecha_creacion AT TIME ZONE 'America/Mexico_City'::text)))::date);

CREATE MATERIALIZED VIEW public.mv_stats_pipas AS
SELECT v.id_obra,
    (date_trunc('month'::text, (v.fecha_creacion AT TIME ZONE 'America/Mexico_City'::text)))::date AS mes,
    count(DISTINCT v.id_vale) AS total_vales,
    sum(COALESCE(vrd.total_horas, (0)::numeric)) AS total_horas,
    sum(COALESCE(vrd.total_dias, (0)::numeric)) AS total_dias,
    sum(COALESCE(vrd.costo_total, (0)::numeric)) AS costo_total
FROM (vales v JOIN vale_renta_detalle vrd ON ((vrd.id_vale = v.id_vale)))
WHERE (((v.tipo_vale)::text = 'renta'::text) AND v.es_pipa_agua
  AND ((v.estado)::text = ANY ((ARRAY['aceptado'::character varying, 'en_proceso'::character varying, 'emitido'::character varying, 'verificado'::character varying, 'conciliado'::character varying])::text[]))
  AND (v.id_obra <> 888))
GROUP BY v.id_obra,
  ((date_trunc('month'::text, (v.fecha_creacion AT TIME ZONE 'America/Mexico_City'::text)))::date);


-- =============================================================================
-- HALLAZGOS (2026-08-04) — encontrados al leer este volcado, sin corregir
-- =============================================================================
--
-- #1  crear_notificaciones_nuevo_vale NUNCA INSERTA NADA.
--     Filtra r.role IN ('ADMINISTRADOR','FINANZAS') en MAYUSCULAS; los valores
--     reales son 'Administrador' y 'Finanzas'. Es el mismo bug de casing que ya
--     esta documentado en CLAUDE.md de esta carpeta para las policies.
--     Doblemente inerte: la tabla `notificaciones` tampoco la lee ningun archivo
--     de src/. Antes de "arreglarlo" hay que decidir si el feature se quiere; si
--     se corrige el casing sin mas, empezaria a escribir una fila por
--     admin/finanzas en CADA vale creado, en una tabla que nadie consulta.
--
-- #2  La app solo llama a UN RPC: refrescar_stats.
--     completar_vale_material, completar_vale_renta (x2), verificar_vale,
--     generar_folio_vale, solicitar/responder_desverificacion,
--     verificar_conciliacion, autorizar_vale, desautorizar_vale: ninguna se
--     invoca desde src/. Algunas puede usarlas la web publica de verificacion
--     (otro repo) — confirmar antes de borrar nada.
--
-- #3  generar_folio_vale existe para evitar folios duplicados con un
--     LOCK TABLE, pero la app genera el folio en el cliente
--     (src/hooks/useFolioGenerator.js: SELECT del ultimo + 1). Por eso
--     useValeMaterialLogic tiene que revisar folio duplicado antes de insertar.
--     Dos usuarios creando un vale de la misma obra al mismo tiempo pueden
--     chocar; la funcion que lo resolveria esta ahi sin usarse.
--
-- #4  completar_vale_renta tiene dos sobrecargas conviviendo (7 y 8 parametros).
--     La de 7 NO escribe costo_total. Una llamada RPC con 7 argumentos elige esa
--     en silencio y deja el importe intacto. Si algun dia se usan, borrar la de
--     7 parametros.
--
-- #5  Cuatro SECURITY DEFINER sin "SET search_path":
--       autorizar_vale, desautorizar_vale, verificar_conciliacion, refrescar_stats
--     Las migraciones 20260626_security_fixes*.sql endurecieron el resto pero se
--     saltaron estas. Corren con permisos del owner y resuelven nombres de tabla
--     contra el search_path del llamador.
--
-- #6  autorizar_vale / desautorizar_vale usan columnas que no existen en
--     schema.sql ni en ninguna migracion: vales.autorizado, fecha_autorizacion,
--     id_persona_autorizador. O el schema esta incompleto o son restos de un
--     feature abandonado. Verificar con information_schema.columns antes de
--     tocarlas.
--
-- #7  vales_con_semanas calcula la semana con EXTRACT sobre fecha_creacion SIN
--     convertir a America/Mexico_City, mientras que las tres matviews SI
--     convierten. Un vale creado de noche puede caer en semana distinta segun
--     por donde se consulte.
--
-- #8  schema.sql (2026-04-19) esta desactualizado: le faltan las tablas
--     asignacion_operador_vehiculo, solicitudes_desverificacion,
--     distancias_banco_planta, precios_material_obra, precios_renta_obra; y las
--     columnas sindicatos.es_pipas, material.es_agua_pipa, vales.es_programado,
--     vales.es_pipa_agua, obras.activo, vale_material_detalles.es_planta_asfaltos
--     y las de tarifas por obra.
--
-- =============================================================================
