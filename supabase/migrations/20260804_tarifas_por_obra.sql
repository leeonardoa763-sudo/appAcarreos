-- Migracion: tarifas por obra (capa que sobrescribe la tarifa del sindicato)
-- Fecha: 2026-08-04
--
-- Estado previo:
--   precios_material → clave (id_tipo_de_material, id_sindicato)
--   precios_renta    → clave (id_sindicato)
-- Ambas pasan a ser la TARIFA POR DEFECTO DEL SINDICATO. Ninguna se modifica
-- aqui: se agregan dos tablas espejo con id_obra que la sobrescriben cuando
-- existe fila para esa obra.
--
-- Por que tablas nuevas y no una columna id_obra nullable en las existentes:
-- todos los consumidores actuales (TarifasModal, useCatalogos.preciosRenta, el
-- .find() de ValeRentaScreen, obtenerTarifaMaterial) leen esas tablas sin
-- filtrar por obra. Agregarles filas de obra haria que empezaran a devolver 2
-- filas por combinacion y eligieran una al azar — un cambio de precio silencioso
-- en la obra 146 (produccion). Con tablas aparte siguen devolviendo exactamente
-- lo mismo que hoy.
--
-- Regla de resolucion, identica para material, renta, asfaltico y pipas:
--   tarifa de (obra, sindicato, [tipo material]) → si no existe → tarifa del sindicato
--
-- IMPORTANTE: correr en el SQL Editor de Supabase ANTES de desplegar la app.
-- Es aditiva: no borra ni modifica ninguna fila existente.

BEGIN;

-- ── 1. Tarifa de material por obra ──────────────────────────────────────────
-- Mismos campos que precios_material para que calcularPrecioM3() (el motor de
-- intervalos en src/utils/preciosMaterial.js) se reutilice sin cambios.
CREATE TABLE IF NOT EXISTS public.precios_material_obra (
  id_precios_material_obra serial      PRIMARY KEY,
  id_obra                  integer     NOT NULL REFERENCES public.obras (id_obra),
  id_tipo_de_material      integer     NOT NULL REFERENCES public.tipo_de_material (id_tipo_de_material),
  id_sindicato             integer     NOT NULL REFERENCES public.sindicatos (id_sindicato),
  numero_de_intervalos     numeric     NOT NULL,
  primer_km                numeric     NOT NULL,
  km_sub_int1              numeric,
  limite_int1              numeric,
  km_sub_int2              numeric,
  limite_int2              numeric,
  activo                   boolean     NOT NULL DEFAULT true,
  creado_en                timestamptz NOT NULL DEFAULT now(),
  actualizado_en           timestamptz NOT NULL DEFAULT now(),
  -- Sin esto se repetiria el problema de precios_material, donde los duplicados
  -- obligaron a obtenerTarifaMaterial() a no poder usar .single()
  CONSTRAINT precios_material_obra_unico
    UNIQUE (id_obra, id_tipo_de_material, id_sindicato)
);

-- ── 2. Tarifa de renta por obra (cubre tambien pipas de agua) ───────────────
CREATE TABLE IF NOT EXISTS public.precios_renta_obra (
  id_precios_renta_obra serial      PRIMARY KEY,
  id_obra               integer     NOT NULL REFERENCES public.obras (id_obra),
  id_sindicato          integer     NOT NULL REFERENCES public.sindicatos (id_sindicato),
  costo_hr              numeric,
  costo_dia             numeric,
  activo                boolean     NOT NULL DEFAULT true,
  creado_en             timestamptz NOT NULL DEFAULT now(),
  actualizado_en        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT precios_renta_obra_unico UNIQUE (id_obra, id_sindicato)
);

-- ── 3. Trazabilidad en material ─────────────────────────────────────────────
-- El importe de material ya queda congelado en precio_m3 / costo_total /
-- tarifa_primer_km / tarifa_subsecuente. Estas columnas solo registran DE DONDE
-- salio la tarifa: si vienen pobladas, se uso la de obra (y id_precios_material
-- queda NULL); si no, se uso la del sindicato como siempre.
ALTER TABLE public.vale_material_detalles
  ADD COLUMN IF NOT EXISTS id_precios_material_obra integer
  REFERENCES public.precios_material_obra (id_precios_material_obra);

ALTER TABLE public.vale_material_viajes
  ADD COLUMN IF NOT EXISTS id_precios_material_obra integer
  REFERENCES public.precios_material_obra (id_precios_material_obra);

-- ── 4. Renta: congelar la tarifa aplicada ───────────────────────────────────
-- A diferencia de material, renta NO congelaba nada: id_precios_renta es una FK
-- y todos los lectores (ValeDetalleRenta, los 2 PDFs, los 2 CSV) muestran
-- costo_hr/costo_dia del join en vivo. Con eso, editar una tarifa reprecia
-- visualmente todos los vales historicos de ese sindicato.
-- Al guardar aqui la tarifa resuelta al crear el vale, un cambio posterior de
-- tarifa (de obra o de sindicato) ya no toca los vales viejos.
-- Las filas anteriores a esta migracion quedan en NULL y siguen leyendose del
-- join, igual que hoy — sin cambio de comportamiento para el historico.
ALTER TABLE public.vale_renta_detalle
  ADD COLUMN IF NOT EXISTS id_precios_renta_obra integer
  REFERENCES public.precios_renta_obra (id_precios_renta_obra);

ALTER TABLE public.vale_renta_detalle
  ADD COLUMN IF NOT EXISTS costo_hr_aplicado numeric;

ALTER TABLE public.vale_renta_detalle
  ADD COLUMN IF NOT EXISTS costo_dia_aplicado numeric;

COMMENT ON COLUMN public.vale_renta_detalle.costo_hr_aplicado IS
  'Tarifa por hora congelada al crear el vale. NULL en vales previos a 2026-08-04: para esos se lee precios_renta via join.';
COMMENT ON COLUMN public.vale_renta_detalle.costo_dia_aplicado IS
  'Tarifa por dia congelada al crear el vale. NULL en vales previos a 2026-08-04: para esos se lee precios_renta via join.';

-- ── 5. Indices de lectura ───────────────────────────────────────────────────
-- La resolucion de tarifa corre en cada creacion de vale y en cada registro de
-- viaje; el UNIQUE ya cubre la busqueda de material, aqui solo el listado por obra.
CREATE INDEX IF NOT EXISTS precios_material_obra_obra_idx
  ON public.precios_material_obra (id_obra);
CREATE INDEX IF NOT EXISTS precios_renta_obra_obra_idx
  ON public.precios_renta_obra (id_obra);

-- ── 6. RLS ──────────────────────────────────────────────────────────────────
-- Lectura: solo authenticated, igual que precios_material. No se abre a anon
-- aunque precios_renta si lo este: la web publica de verificacion no necesita
-- estas tablas porque el importe de renta ahora viaja congelado en
-- vale_renta_detalle (que si tiene lectura anon).
-- Escritura: solo Administrador, patron EXISTS estandar. 'Administrador' en
-- PascalCase — 'ADMINISTRADOR' no existe como valor real y nunca matchea.
ALTER TABLE public.precios_material_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios_renta_obra    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "precios_material_obra_select_authenticated"
ON public.precios_material_obra
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "precios_material_obra_admin_write"
ON public.precios_material_obra
FOR ALL
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

CREATE POLICY "precios_renta_obra_select_authenticated"
ON public.precios_renta_obra
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "precios_renta_obra_admin_write"
ON public.precios_renta_obra
FOR ALL
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

COMMIT;

-- ── Verificacion posterior ──────────────────────────────────────────────────
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('precios_material_obra', 'precios_renta_obra')
-- ORDER BY table_name, ordinal_position;
--
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'vale_renta_detalle'
--   AND column_name IN ('id_precios_renta_obra', 'costo_hr_aplicado', 'costo_dia_aplicado');
--
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('precios_material_obra', 'precios_renta_obra')
-- ORDER BY tablename, policyname;
