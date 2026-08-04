-- Migración: previene duplicados en bancos y distancias_banco_obra
-- Fecha: 2026-08-03
--
-- Estado previo:
--   - peso_especifico        → UNIQUE (id_material, id_banco)  [20260707]
--   - distancias_banco_planta→ UNIQUE (id_banco)               [20260702]
--   - distancias_banco_obra  → SIN restriccion  ← se agrega aqui
--   - bancos.banco           → SIN restriccion  ← se agrega aqui
--
-- El duplicado de banco no es hipotetico: 20260702_merge_banco_duplicado_asfaltos.sql
-- existio precisamente para fusionar "PLANTA DE ASFALTOS" (id 4) dentro de
-- "PLANTA ASFALTOS KM18" (id 14) despues de que se crearan los dos.
--
-- La app ya bloquea ambos casos antes de llamar a Supabase (useGestionBancos.js
-- + listas con opciones deshabilitadas en GestionBancosModales.js). Esto es la
-- red de seguridad: dos admins guardando a la vez, o cualquier insert hecho
-- directo desde el SQL Editor.
--
-- IMPORTANTE: correr en el SQL Editor de Supabase. Es aditiva, no borra bancos.
-- Si aborta, es porque encontro duplicados preexistentes — ver mas abajo.

BEGIN;

-- ── 1. distancias_banco_obra: una sola distancia por (banco, obra) ───────────
-- Se conserva la fila de menor id de cada combinacion, igual que hizo la
-- migracion de peso_especifico. Estas filas no son referenciadas por los vales
-- (los vales copian distancia_km al crearse), asi que borrar la repetida no
-- afecta al historico.
DELETE FROM public.distancias_banco_obra d
USING public.distancias_banco_obra d2
WHERE d.id_banco = d2.id_banco
  AND d.id_obra  = d2.id_obra
  AND d.id_distancia_banco_obra > d2.id_distancia_banco_obra;

ALTER TABLE public.distancias_banco_obra
  DROP CONSTRAINT IF EXISTS distancias_banco_obra_banco_obra_unique;

ALTER TABLE public.distancias_banco_obra
  ADD CONSTRAINT distancias_banco_obra_banco_obra_unique
  UNIQUE (id_banco, id_obra);

-- ── 2. bancos: nombre unico (ignorando mayusculas y espacios de sobra) ───────
-- NO se borra ni fusiona nada automaticamente: un id_banco duplicado esta
-- referenciado por vale_material_detalles, vale_material_viajes,
-- peso_especifico y distancias_*. Fusionarlo requiere reasignar esas
-- referencias a mano, como hizo 20260702_merge_banco_duplicado_asfaltos.sql.
-- Si hay duplicados, esta migracion aborta y los lista para que se resuelvan
-- primero.
DO $$
DECLARE
  repetidos text;
BEGIN
  SELECT string_agg(nombre || ' (ids: ' || ids || ')', '; ')
  INTO repetidos
  FROM (
    SELECT upper(regexp_replace(btrim(banco), '\s+', ' ', 'g')) AS nombre,
           string_agg(id_banco::text, ', ' ORDER BY id_banco)   AS ids
    FROM public.bancos
    WHERE banco IS NOT NULL
    GROUP BY 1
    HAVING count(*) > 1
  ) t;

  IF repetidos IS NOT NULL THEN
    RAISE EXCEPTION
      'Hay bancos duplicados que deben fusionarse a mano antes de aplicar la restriccion: %',
      repetidos;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS bancos_nombre_unique
  ON public.bancos (upper(regexp_replace(btrim(banco), '\s+', ' ', 'g')));

COMMIT;

-- ── Verificacion posterior ──────────────────────────────────────────────────
-- SELECT conname FROM pg_constraint
-- WHERE conrelid = 'public.distancias_banco_obra'::regclass;
--
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'bancos';
