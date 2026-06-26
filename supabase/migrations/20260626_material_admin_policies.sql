-- Migración: políticas INSERT/UPDATE para Administrador en catálogos de material
-- Fecha: 2026-06-26
--
-- Permite que el rol Administrador cree y edite materiales y tipos de material
-- desde la pantalla de Gestión de Materiales.
-- RLS estaba habilitado pero sin políticas de escritura, bloqueando todo INSERT/UPDATE.

-- ── Políticas en material ─────────────────────────────────────────────────────

CREATE POLICY "admin_insert_material"
ON material
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

CREATE POLICY "admin_update_material"
ON material
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

-- ── Políticas en tipo_de_material ─────────────────────────────────────────────

CREATE POLICY "admin_insert_tipo_material"
ON tipo_de_material
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

CREATE POLICY "admin_update_tipo_material"
ON tipo_de_material
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
