-- Migración: catálogo de bancos de descarga ya usados, por obra (renta normal)
-- Fecha: 2026-09-05
--
-- Contexto: banco_descarga en vale_renta_viajes (ver
-- 20260904_banco_descarga_viaje_renta.sql) es texto libre capturado por el
-- checador en ModalRegistrarViaje. Sin nada que lo estandarice, el mismo banco
-- termina escrito de formas distintas ("SOLEDAD" / "CALLE SOLEDAD"), lo que
-- ensucia cualquier filtro o reporte futuro por banco de descarga.
--
-- No se vuelve un catálogo cerrado (FK a una tabla de bancos): el checador
-- sigue pudiendo escribir un banco nuevo la primera vez. Esta vista solo
-- expone los bancos ya usados en ESA obra para que el modal se los sugiera
-- mientras escribe y, si coincide, toque uno en vez de retipearlo.
--
-- security_invoker: la vista respeta el RLS de quien consulta, igual que
-- ciclos_banco_obra (ver 20260804_tiempo_dinamico_y_motivos.sql).

DROP VIEW IF EXISTS public.bancos_descarga_renta_obra;
CREATE VIEW public.bancos_descarga_renta_obra
WITH (security_invoker = true) AS
SELECT
  v.id_obra,
  vrv.banco_descarga,
  COUNT(*)              AS usos,
  MAX(vrv.hora_registro) AS ultimo_uso
FROM public.vale_renta_viajes vrv
JOIN public.vale_renta_detalle vd ON vd.id_vale_renta_detalle = vrv.id_vale_renta_detalle
JOIN public.vales v ON v.id_vale = vd.id_vale
WHERE vrv.banco_descarga IS NOT NULL
GROUP BY v.id_obra, vrv.banco_descarga;
