-- Migración: políticas INSERT/UPDATE/DELETE para Administrador en bancos y peso_especifico
-- Fecha: 2026-06-26
--
-- bancos solo tenía SELECT (anon + authenticated). Se agregan escritura para admin.
-- peso_especifico solo tenía SELECT (authenticated). Se agregan escritura para admin.
-- distancias_banco_obra ya tenía las tres políticas de escritura (role='ADMINISTRADOR').

-- ── Políticas en bancos ───────────────────────────────────────────────────────

CREATE POLICY "admin_insert_banco"
ON bancos
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

CREATE POLICY "admin_update_banco"
ON bancos
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

CREATE POLICY "admin_delete_banco"
ON bancos
FOR DELETE
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

-- ── Políticas en peso_especifico ──────────────────────────────────────────────

CREATE POLICY "admin_insert_peso_especifico"
ON peso_especifico
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

CREATE POLICY "admin_update_peso_especifico"
ON peso_especifico
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

CREATE POLICY "admin_delete_peso_especifico"
ON peso_especifico
FOR DELETE
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
