-- Migración: corrección de permisos SECURITY DEFINER (v2)
-- Fecha: 2026-06-26
--
-- Por qué falló la v1:
-- Los REVOKE EXECUTE FROM anon no tuvieron efecto porque en PostgreSQL los permisos
-- se heredan de PUBLIC. Si PUBLIC tiene EXECUTE, anon también lo tiene aunque no
-- tenga un grant explícito. Hay que revocar de PUBLIC y luego re-otorgar solo a
-- los roles que realmente necesitan acceso.
--
-- Estrategia:
--   A) Funciones internas (disparadas por triggers, nadie llama vía REST):
--      REVOKE FROM PUBLIC — sin re-grant
--
--   B) Funciones de negocio (llamadas por la app con usuario autenticado):
--      REVOKE FROM PUBLIC → GRANT solo a authenticated
--      → seguirán apareciendo como "authenticated_security_definer" (aviso INFORMATIVO,
--        es correcto — son funciones que authenticated SÍ debe poder llamar)
--
--   C) Funciones de la web pública:
--      Mantienen PUBLIC (registrar_descarga_vale_web necesita anon)


-- ============================================================
-- GRUPO A — Funciones internas / disparadas por triggers
--   Nadie debería invocarlas directamente vía REST
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.actualizar_updated_at()
  FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.calcular_totales_vale_renta()
  FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.recalcular_consumo_material()
  FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.recalcular_consumo_renta()
  FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.recalcular_consumo_material_desde_detalle()
  FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.recalcular_consumo_renta_desde_detalle()
  FROM PUBLIC;


-- ============================================================
-- GRUPO B — Funciones de negocio: solo authenticated
--   REVOKE PUBLIC + re-grant a authenticated
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.completar_vale_material(bigint, integer, numeric, text, integer, integer)
  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.completar_vale_material(bigint, integer, numeric, text, integer, integer)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.completar_vale_renta(bigint, integer, timestamptz, numeric, numeric, integer, boolean)
  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.completar_vale_renta(bigint, integer, timestamptz, numeric, numeric, integer, boolean)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.completar_vale_renta(bigint, integer, timestamptz, numeric, numeric, integer, boolean, numeric)
  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.completar_vale_renta(bigint, integer, timestamptz, numeric, numeric, integer, boolean, numeric)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.generar_folio_vale(integer, text)
  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.generar_folio_vale(integer, text)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.generar_folio_conciliacion()
  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.generar_folio_conciliacion()
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.verificar_vale(text, integer)
  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.verificar_vale(text, integer)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.solicitar_desverificacion(integer, integer, text)
  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.solicitar_desverificacion(integer, integer, text)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.responder_desverificacion(integer, integer, boolean, text)
  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.responder_desverificacion(integer, integer, boolean, text)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.refrescar_stats()
  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.refrescar_stats()
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recalcular_presupuesto_material_fn(integer, integer)
  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.recalcular_presupuesto_material_fn(integer, integer)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recalcular_presupuesto_renta_fn(integer)
  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.recalcular_presupuesto_renta_fn(integer)
  TO authenticated;


-- ============================================================
-- GRUPO C — Web pública (mantiene acceso anon via PUBLIC)
-- registrar_descarga_vale_web: no tocar, la usa web-acarreos.vercel.app
-- ============================================================


-- ============================================================
-- NOTA SOBRE LOS AVISOS RESTANTES DESPUÉS DE ESTA MIGRACIÓN
-- ============================================================
--
-- Quedarán activos estos avisos — todos son aceptables o irresolubles:
--
-- authenticated_security_definer_function_executable
--   → Para completar_vale_*, generar_folio_*, verificar_vale,
--     solicitar/responder_desverificacion, refrescar_stats,
--     recalcular_presupuesto_*:
--     ESPERADO Y CORRECTO. Esas funciones deben ser llamadas por
--     usuarios autenticados. El linter avisa pero no es un problema.
--
-- anon_security_definer_function_executable
--   → Solo registrar_descarga_vale_web: INTENCIONAL (web pública).
--
-- materialized_view_in_api (mv_stats_material, mv_stats_renta)
--   → authenticated tiene SELECT (necesario para EstadisticasScreen).
--     anon fue revocado en migración 20260505. El linter detecta
--     el grant de authenticated — es correcto e intencional.
--
-- extension_in_public (pg_net)
--   → Gestionado por Supabase, no se puede mover. Ignorar.
--
-- rls_policy_always_true (asignacion_operador_vehiculo, notificaciones, vale_accesos)
--   → Tablas de operación interna. Riesgo mínimo para este sistema.
--
-- public_bucket_allows_listing (evidencias-vales)
--   → Los PDFs se comparten públicamente por QR. Listing expone solo
--     nombres de archivo. Riesgo bajo, diseño intencional.
