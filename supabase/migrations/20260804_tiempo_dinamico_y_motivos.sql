-- Migracion: tiempo minimo dinamico entre viajes + motivos de excepcion
-- Fecha: 2026-08-04
--
-- ── Problema 1: el tiempo minimo entre viajes es un numero fijo ─────────────
-- obras.min_minutos_entre_viajes (default 20) se aplica igual a un banco a 2 km
-- que a uno a 40 km: injusto en los cercanos (bloquea trabajo real) e inutil en
-- los lejanos (permite registros fisicamente imposibles).
-- Esta migracion agrega los parametros para calcularlo por distancia y la vista
-- que expone el piso historico real de cada banco.
--
-- min_minutos_entre_viajes NO se toca ni se migra: pasa a ser el fallback
-- cuando el vale no tiene distancia. Sigue siendo la fuente de verdad si algo
-- del calculo nuevo falla.
--
-- ── Problema 2: la foto de evidencia se toma "a la nada" ────────────────────
-- Cuando el vale se captura despues y fuera de campo, el checador toma una foto
-- de algo negro solo para poder avanzar. Eso es peor que no pedirla: queda en la
-- BD como evidencia valida. Se agrega la opcion explicita de omitirla con un
-- motivo escrito, en las 3 tablas donde vive la foto hoy.
--
-- IMPORTANTE: correr en el SQL Editor de Supabase ANTES de desplegar la app.
-- Es aditiva: no borra ni modifica ninguna fila ni columna existente.

BEGIN;

-- ── 1. Parametros de la formula, por obra ───────────────────────────────────
-- Van en obras y no como constantes en el codigo para poder recalibrarlos sin
-- publicar un APK nuevo (los usuarios de campo tardan dias en actualizar).
--
-- factor_tolerancia_tiempo existe porque el umbral debe ser un PISO FISICO
-- PLAUSIBLE, no el tiempo promedio del ciclo. Sin el, por definicion la mitad
-- de los viajes legitimos caeria por debajo del umbral.
--
-- DEFAULTS CALIBRADOS con los 9,439 viajes reales del 2026-03-23 al 2026-08-04.
-- Ajustando una recta a las MEDIANAS de duracion por distancia
-- (5 km -> 39 min, 15 -> 76, 21.5 -> 87, 36 -> 165): pendiente 4.06 min/km de
-- ida y vuelta => 29.5 km/h de recorrido, con 19 min de intercepto (carga,
-- descarga y cola en el banco).
-- Se ajusto contra las medianas y no contra los percentiles bajos porque estos
-- estan contaminados: hay ciclos de 1.0 min para un banco a 5 km, que es
-- justo el registro imposible que este cambio busca detectar.
-- Con factor 0.55 el umbral queda por debajo del percentil 25 observado en
-- todos los bancos medidos, y muy por encima de los ciclos de 1-3 min.
ALTER TABLE public.obras
  ADD COLUMN IF NOT EXISTS velocidad_promedio_kmh   numeric DEFAULT 30,
  ADD COLUMN IF NOT EXISTS minutos_carga_descarga   integer DEFAULT 19,
  ADD COLUMN IF NOT EXISTS factor_tolerancia_tiempo numeric DEFAULT 0.55;

COMMENT ON COLUMN public.obras.velocidad_promedio_kmh IS
  'Velocidad promedio del camion para estimar el ciclo obra-banco-obra. Calibrada en 30 km/h (2026-08-04) contra la velocidad implicita de los ciclos reales.';
COMMENT ON COLUMN public.obras.minutos_carga_descarga IS
  'Minutos fijos del ciclo que no dependen de la distancia: carga, descarga y cola en el banco. Calibrado en 19 min (2026-08-04).';
COMMENT ON COLUMN public.obras.factor_tolerancia_tiempo IS
  'Factor sobre el ciclo tipico (0.55 = se exige el 55%). El umbral debe ser un piso plausible, no el promedio: con 1.0 se bloquearia la mitad de los viajes legitimos.';

-- ── 2. Auditoria del registro anticipado y de la foto omitida (material) ────
-- minutos_minimos_calculados se guarda SIEMPRE, tambien cuando el viaje es
-- puntual: es lo unico que permite auditar despues si el umbral quedo bien
-- calibrado, comparandolo contra los ciclos reales.
ALTER TABLE public.vale_material_viajes
  ADD COLUMN IF NOT EXISTS registro_anticipado          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS minutos_minimos_calculados   integer,
  ADD COLUMN IF NOT EXISTS minutos_faltantes_anticipado integer,
  ADD COLUMN IF NOT EXISTS motivo_anticipado_codigo     text,
  ADD COLUMN IF NOT EXISTS motivo_anticipado_texto      text,
  ADD COLUMN IF NOT EXISTS foto_omitida                 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_sin_foto_codigo       text,
  ADD COLUMN IF NOT EXISTS motivo_sin_foto_texto        text;

COMMENT ON COLUMN public.vale_material_viajes.minutos_minimos_calculados IS
  'Umbral que aplicaba al registrar este viaje. Se guarda siempre, no solo en registros anticipados.';
COMMENT ON COLUMN public.vale_material_viajes.registro_anticipado IS
  'true si se registro antes de cumplirse el tiempo minimo, con motivo escrito por el usuario.';

-- ── 3. Foto omitida en renta/pipas y en asfaltico ───────────────────────────
-- La foto vive en 3 tablas distintas segun el tipo de vale (por viaje en
-- material, por vale en renta y en asfaltico). Se replica el mismo trio.
ALTER TABLE public.vale_renta_detalle
  ADD COLUMN IF NOT EXISTS foto_omitida           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_sin_foto_codigo text,
  ADD COLUMN IF NOT EXISTS motivo_sin_foto_texto  text;

ALTER TABLE public.vale_material_detalles
  ADD COLUMN IF NOT EXISTS foto_omitida           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_sin_foto_codigo text,
  ADD COLUMN IF NOT EXISTS motivo_sin_foto_texto  text;

-- ── 4. Vista del piso historico por (obra, banco) ───────────────────────────
-- Expone, por cada combinacion obra-banco-ruta, cuantos ciclos completos hay
-- registrados y el percentil 5 de su duracion en minutos.
--
-- OJO: la app usa este percentil SOLO para SUBIR el umbral cuando resulta mayor
-- que la formula, nunca para bajarlo (utils/tiempoEntreViajes.js). Los
-- percentiles bajos del historico estan contaminados por los registros
-- imposibles que este cambio ataca (1.0 min para un banco a 5 km, 1.3 min para
-- uno a 16 km); si pudieran bajar el umbral, esos registros se volverian la
-- norma del banco.
-- Lo que el historial si aporta con confianza es lo contrario: que un banco
-- concreto es MAS lento que la fisica (camino malo, cola larga).
--
-- SE AGRUPA TAMBIEN POR es_planta_asfaltos, no solo por (obra, banco).
-- Un vale de planta se carga a una obra pero el material NO se descarga ahi: va
-- a la Planta de Asfaltos, y su distancia sale de distancias_banco_planta
-- (banco -> planta), que es mas corta que banco -> obra. Ver
-- ValeMaterialScreen.js, efecto "Calcular distancia".
-- Son dos RUTAS DISTINTAS desde el mismo banco. Sin separarlas, el p10 de un
-- banco mezcla ciclos cortos de planta con ciclos largos de obra, y el
-- resultado no describe ninguna de las dos.
--
-- SE USA EL PERCENTIL 5, NO EL 10.
-- Cuando el historial gana el MAX, el umbral ES el percentil, asi que este
-- numero fija por construccion cuantos viajes pediran motivo: con p10, uno de
-- cada diez, tambien en rutas impecables. En rutas sucias el percentil ni se usa
-- (gana la formula), asi que bajarlo a p05 no debilita la deteccion: solo quita
-- friccion donde no habia nada que detectar.
--
-- LOS VIAJES ANTICIPADOS SE DESCARTAN DESPUES DEL LAG, NO ANTES.
-- Es sutil y estuvo mal en la primera version: WHERE se evalua ANTES que las
-- funciones de ventana, asi que filtrar registro_anticipado en el WHERE del CTE
-- borra esa fila de la particion y el LAG termina emparejando el viaje 2 con el
-- 4 — inventando un ciclo que vale la suma de dos y que nunca ocurrio.
-- El LAG corre sobre TODOS los viajes y el descarte se hace en el SELECT
-- exterior, sobre el ciclo ya calculado.
-- Se descarta el ciclo si CUALQUIERA de sus dos extremos es anticipado: la
-- hora_registro de un viaje capturado tarde no dice cuando ocurrio el viaje,
-- asi que envenena tanto el ciclo que termina en el como el que arranca de el.
--
-- Otros filtros y por que:
--   ultimos 180 dias             → mantiene la vista barata y hace que se
--       adapte si cambia la ruta o el estado del camino.
--   ciclo entre 1 y 300 min      → descarta dobles registros accidentales y
--       saltos entre jornadas (el ultimo viaje del dia vs. el primero del
--       siguiente no es un ciclo).
--   tipo_de_material <> 2        → el asfaltico nunca registra viajes.
--   id_obra <> 888               → obra de pruebas.
--
-- security_invoker: la vista respeta el RLS del usuario que consulta, igual que
-- vehiculos_vales_activos (ver 20260626_security_fixes.sql).
DROP VIEW IF EXISTS public.ciclos_banco_obra;
CREATE VIEW public.ciclos_banco_obra
WITH (security_invoker = true) AS
WITH viajes AS (
  SELECT
    val.id_obra,
    COALESCE(vmv.id_banco_override, vmd.id_banco) AS id_banco,
    COALESCE(vmd.es_planta_asfaltos, false)       AS es_planta_asfaltos,
    COALESCE(vmv.registro_anticipado, false)      AS anticipado,
    vmv.id_detalle_material,
    vmv.numero_viaje,
    vmv.hora_registro
  FROM public.vale_material_viajes vmv
  JOIN public.vale_material_detalles vmd
    ON vmd.id_detalle_material = vmv.id_detalle_material
  JOIN public.vales val
    ON val.id_vale = vmd.id_vale
  LEFT JOIN public.material m
    ON m.id_material = vmd.id_material
  WHERE val.id_obra <> 888
    AND COALESCE(val.estado, '') <> 'cancelado'
    AND COALESCE(m.id_tipo_de_material, 1) <> 2
    AND vmv.hora_registro >= (now() - interval '180 days')
),
ciclos AS (
  SELECT
    id_obra,
    id_banco,
    es_planta_asfaltos,
    anticipado,
    LAG(anticipado)     OVER w AS anticipado_previo,
    EXTRACT(
      EPOCH FROM (hora_registro - LAG(hora_registro) OVER w)
    ) / 60.0 AS minutos_ciclo
  FROM viajes
  WINDOW w AS (PARTITION BY id_detalle_material ORDER BY numero_viaje)
)
SELECT
  id_obra,
  id_banco,
  es_planta_asfaltos,
  COUNT(*)::integer AS n_ciclos,
  ROUND(
    percentile_cont(0.05) WITHIN GROUP (ORDER BY minutos_ciclo)::numeric,
    1
  ) AS p05_minutos,
  ROUND(
    percentile_cont(0.50) WITHIN GROUP (ORDER BY minutos_ciclo)::numeric,
    1
  ) AS mediana_minutos
FROM ciclos
WHERE minutos_ciclo IS NOT NULL
  AND minutos_ciclo BETWEEN 1 AND 300
  AND id_banco IS NOT NULL
  AND anticipado = false
  AND COALESCE(anticipado_previo, false) = false
GROUP BY id_obra, id_banco, es_planta_asfaltos;

COMMENT ON VIEW public.ciclos_banco_obra IS
  'Piso historico del ciclo de acarreo, por obra, banco y tipo de ruta (es_planta_asfaltos separa banco->planta de banco->obra: son rutas distintas). Ultimos 180 dias. La consulta useViajesMaterial para el tiempo minimo entre viajes.';

-- ── 5. Indice de apoyo ──────────────────────────────────────────────────────
-- El LAG particiona por id_detalle_material y ordena por numero_viaje; sin este
-- indice la vista hace un sort completo de vale_material_viajes en cada lectura.
CREATE INDEX IF NOT EXISTS vale_material_viajes_detalle_numero_idx
  ON public.vale_material_viajes (id_detalle_material, numero_viaje);

COMMIT;

-- ── Verificacion posterior ──────────────────────────────────────────────────
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'obras'
--   AND column_name IN ('velocidad_promedio_kmh', 'minutos_carga_descarga',
--                       'factor_tolerancia_tiempo');
--
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'vale_material_viajes'
--   AND column_name LIKE ANY (ARRAY['%anticipado%', '%sin_foto%', 'foto_omitida',
--                                   'minutos_minimos_calculados']);
--
-- Debe devolver filas y responder rapido (< 300 ms):
-- SELECT * FROM ciclos_banco_obra ORDER BY n_ciclos DESC;
--
-- Sus p10_minutos deben coincidir con los de la query de calibracion por banco.
