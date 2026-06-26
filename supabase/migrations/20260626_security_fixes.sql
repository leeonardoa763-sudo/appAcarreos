-- Migración: correcciones del Security Advisor de Supabase
-- Fecha: 2026-06-26
--
-- Resuelve:
--   - security_definer_view                      (ERROR)
--   - anon_security_definer_function_executable  (WARN)
--   - function_search_path_mutable               (WARN)
--   - rls_policy_always_true en presupuestos     (WARN)
--
-- Pendientes manuales documentados al final del archivo.


-- ============================================================
-- 1. REVOCAR EXECUTE de anon en funciones SECURITY DEFINER
--    Ninguna de estas debe ejecutarse sin login
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.actualizar_updated_at()
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.calcular_totales_vale_renta()
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.completar_vale_material(bigint, integer, numeric, text, integer, integer)
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.completar_vale_renta(bigint, integer, timestamptz, numeric, numeric, integer, boolean)
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.completar_vale_renta(bigint, integer, timestamptz, numeric, numeric, integer, boolean, numeric)
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.generar_folio_conciliacion()
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.generar_folio_vale(integer, text)
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.recalcular_consumo_material()
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.recalcular_consumo_material_desde_detalle()
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.recalcular_consumo_renta()
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.recalcular_consumo_renta_desde_detalle()
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.recalcular_presupuesto_material_fn(integer, integer)
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.recalcular_presupuesto_renta_fn(integer)
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.refrescar_stats()
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.responder_desverificacion(integer, integer, boolean, text)
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.solicitar_desverificacion(integer, integer, text)
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.verificar_vale(text, integer)
  FROM anon;

-- registrar_descarga_vale_web mantiene acceso anon:
-- la usa web-acarreos.vercel.app para registrar descargas sin login.


-- ============================================================
-- 2. FIJAR search_path EN FUNCIONES
--    Previene ataques de PATH hijacking
-- ============================================================

ALTER FUNCTION public.update_presupuesto_updated_at()
  SET search_path = public;

ALTER FUNCTION public.update_persona_obra_updated_at()
  SET search_path = public;

ALTER FUNCTION public.update_app_config_timestamp()
  SET search_path = public;

ALTER FUNCTION public.refrescar_stats()
  SET search_path = public;

ALTER FUNCTION public.crear_notificaciones_nuevo_vale()
  SET search_path = public;

ALTER FUNCTION public.registrar_descarga_vale_web(character varying, text)
  SET search_path = public;

ALTER FUNCTION public.solicitar_desverificacion(integer, integer, text)
  SET search_path = public;

ALTER FUNCTION public.responder_desverificacion(integer, integer, boolean, text)
  SET search_path = public;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public;

ALTER FUNCTION public.recalcular_presupuesto_material_fn(integer, integer)
  SET search_path = public;

ALTER FUNCTION public.recalcular_presupuesto_renta_fn(integer)
  SET search_path = public;

ALTER FUNCTION public.recalcular_consumo_material()
  SET search_path = public;

ALTER FUNCTION public.recalcular_consumo_renta()
  SET search_path = public;

ALTER FUNCTION public.recalcular_consumo_material_desde_detalle()
  SET search_path = public;

ALTER FUNCTION public.recalcular_consumo_renta_desde_detalle()
  SET search_path = public;


-- ============================================================
-- 3. ENDURECER POLÍTICAS RLS con CHECK/USING (true) en escritura
--    Solo el rol Administrador puede actualizar presupuestos
-- ============================================================

DROP POLICY IF EXISTS "admin_update_presupuesto_material" ON public.presupuesto_material_obra;
CREATE POLICY "admin_update_presupuesto_material"
ON public.presupuesto_material_obra
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM persona p
    JOIN roles r ON r.id_roles = p.id_role
    WHERE p.auth_user_id = auth.uid()
      AND r.role = 'Administrador'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM persona p
    JOIN roles r ON r.id_roles = p.id_role
    WHERE p.auth_user_id = auth.uid()
      AND r.role = 'Administrador'
  )
);

DROP POLICY IF EXISTS "admin_update_presupuesto_renta" ON public.presupuesto_renta_obra;
CREATE POLICY "admin_update_presupuesto_renta"
ON public.presupuesto_renta_obra
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM persona p
    JOIN roles r ON r.id_roles = p.id_role
    WHERE p.auth_user_id = auth.uid()
      AND r.role = 'Administrador'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM persona p
    JOIN roles r ON r.id_roles = p.id_role
    WHERE p.auth_user_id = auth.uid()
      AND r.role = 'Administrador'
  )
);


-- ============================================================
-- 4. VISTA vehiculos_vales_activos → SECURITY INVOKER
--    Une solo vehiculos + operadores + vales, tablas que authenticated
--    ya consulta directamente. Con SECURITY INVOKER la vista respeta
--    el RLS del usuario que consulta, igual que las queries directas.
-- ============================================================

DROP VIEW IF EXISTS public.vehiculos_vales_activos;
CREATE VIEW public.vehiculos_vales_activos
WITH (security_invoker = true) AS
SELECT
  vh.id_vehiculo,
  vh.placas,
  vh.qr_uid,
  vh.id_sindicato,
  vh.capacidad_m3,
  vh.id_operador_sugerido,
  op.nombre_completo AS operador_sugerido_nombre,
  count(v.id_vale) AS vales_activos,
  array_agg(v.id_vale ORDER BY v.fecha_creacion)
    FILTER (WHERE v.id_vale IS NOT NULL) AS ids_vales_activos,
  array_agg(v.folio ORDER BY v.fecha_creacion)
    FILTER (WHERE v.folio IS NOT NULL) AS folios_activos
FROM vehiculos vh
LEFT JOIN operadores op ON op.id_operador = vh.id_operador_sugerido
LEFT JOIN vales v ON v.id_vehiculo = vh.id_vehiculo
  AND v.estado = 'en_proceso'
WHERE vh.activo = true
GROUP BY
  vh.id_vehiculo,
  vh.placas,
  vh.qr_uid,
  vh.id_sindicato,
  vh.capacidad_m3,
  vh.id_operador_sugerido,
  op.nombre_completo;

GRANT SELECT ON public.vehiculos_vales_activos TO authenticated;


-- ============================================================
-- PENDIENTES — requieren acción manual en Supabase Dashboard
-- ============================================================
--
-- A. Bucket evidencias-vales (public_bucket_allows_listing)
--    En Storage > Policies, editar la política "Public read evidencias"
--    para que tenga una condición en name (ej: bucket_id = 'evidencias-vales')
--    en lugar de SELECT sin restricción en objects.
--    Si los PDFs son públicos por diseño (se comparten por QR), el riesgo
--    es bajo: listing expone nombres de archivo, no contenido adicional.
--
-- C. pg_net en schema public (extension_in_public)
--    Extensión gestionada por Supabase internamente.
--    No se puede mover sin asistencia del soporte de Supabase.
--    Riesgo real mínimo para esta app — ignorar.
--
-- D. asignacion_operador_vehiculo (acceso_autenticados ALL true)
--    Evaluar si se necesita restringir por id_sindicato o id_obra.
--    Si todos los operadores asignados ven y modifican lo mismo, es aceptable.
--
-- E. notificaciones / vale_accesos (INSERT WITH CHECK true)
--    Tablas de log interno. INSERT abierto es aceptable si no hay datos sensibles
--    que un usuario pueda inyectar falsamente.
