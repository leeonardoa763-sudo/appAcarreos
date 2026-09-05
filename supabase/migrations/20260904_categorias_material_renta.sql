-- Migración: categorías de material para Renta (categoría planeada al crear el
-- vale + categoría/subcategoría/carga por viaje registrado)
-- Fecha: 2026-09-04
--
-- Contexto: en vale de renta, el material dejó de elegirse una sola vez al crear
-- el vale. El Residente declara al crear una "categoría planeada" (orientativa),
-- y el checador elige categoría + material + carga aproximada en cada viaje que
-- registra. Ver appAcarreos/CLAUDE.md si se agrega sección de referencia.
--
-- Tabla nueva en vez de reusar tipo_de_material: tipo_de_material ya agrupa
-- materiales para precios_material (pricing de vale de material por km/sindicato)
-- — mezclar esta jerarquía nueva ahí pisaría ese uso. Mismo criterio que
-- precios_material_obra (tabla nueva) en vez de columna en precios_material.

-- ── Tabla de categorías ─────────────────────────────────────────────────────

CREATE TABLE categoria_material_renta (
  id_categoria_material_renta  serial PRIMARY KEY,
  categoria                    text NOT NULL,
  descripcion                  text,
  orden                        smallint NOT NULL DEFAULT 0,
  activo                       boolean NOT NULL DEFAULT true
);

-- ── Columnas nuevas (todas aditivas / nullable) ─────────────────────────────

ALTER TABLE material
  ADD COLUMN id_categoria_material_renta integer
    REFERENCES categoria_material_renta(id_categoria_material_renta);

-- Categoría "planeada" que el Residente declara al crear el vale (orientativa,
-- el checador la puede cambiar libremente por viaje)
ALTER TABLE vale_renta_detalle
  ADD COLUMN id_categoria_planeada integer
    REFERENCES categoria_material_renta(id_categoria_material_renta);

-- Material real + carga aproximada, declarados por el checador en cada viaje
ALTER TABLE vale_renta_viajes
  ADD COLUMN id_material integer REFERENCES material(id_material),
  ADD COLUMN carga_porcentaje smallint CHECK (carga_porcentaje IN (50, 75, 100));

-- ── Seed: 4 categorías fijas ─────────────────────────────────────────────────

INSERT INTO categoria_material_renta (categoria, descripcion, orden) VALUES
  ('Producto de Excavación', 'Tepetate, desperdicio, escombro o base retirados al excavar o cortar.', 1),
  ('Fresado', 'Carpeta asfáltica removida por la fresadora.', 2),
  ('Basura', 'Basura general del sitio de trabajo.', 3),
  ('Material de almacén', 'Material que sale del almacén para usarse en obra.', 4);

-- ── Seed: materiales nuevos, uno por subcategoría ───────────────────────────
-- id_tipo_de_material queda NULL: el pricing de renta es por sindicato
-- (precios_renta), no usa tipo_de_material como el de material/bancos.

INSERT INTO material (material, id_tipo_de_material, es_material_descarga, activo, id_categoria_material_renta)
SELECT v.nombre, NULL, false, true, c.id_categoria_material_renta
FROM (VALUES
  ('Tepetate',                  'Producto de Excavación'),
  ('Desperdicio',               'Producto de Excavación'),
  ('Escombro',                  'Producto de Excavación'),
  ('Base en corte',             'Producto de Excavación'),
  ('Carpeta asfáltica removida','Fresado'),
  ('Basura',                    'Basura'),
  ('Grava',                     'Material de almacén'),
  ('Arena',                     'Material de almacén'),
  ('Tepetate',                  'Material de almacén'),
  ('Base hidráulica',           'Material de almacén'),
  ('Fresado',                   'Material de almacén')
) AS v(nombre, categoria)
JOIN categoria_material_renta c ON c.categoria = v.categoria;

-- ── RLS: mismo patrón que material / tipo_de_material ───────────────────────

ALTER TABLE categoria_material_renta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categoria_material_renta"
ON categoria_material_renta
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "admin_insert_categoria_material_renta"
ON categoria_material_renta
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM persona p
    JOIN roles r ON r.id_roles = p.id_role
    WHERE p.auth_user_id = auth.uid()
      AND r.role = 'Administrador'
  )
);

CREATE POLICY "admin_update_categoria_material_renta"
ON categoria_material_renta
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
);
