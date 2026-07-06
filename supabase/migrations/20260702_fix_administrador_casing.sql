-- Migración: corrige casing de rol 'ADMINISTRADOR' -> 'Administrador'
-- Fecha: 2026-07-02
--
-- El rol real en la tabla `roles` es 'Administrador' (PascalCase) — así lo
-- compara todo el código de la app (ver src/screens/CLAUDE.md). Las policies
-- de distancias_banco_obra y persona_obra comparaban contra 'ADMINISTRADOR'
-- (mayúsculas), un valor que nunca existe, por lo que nunca matcheaban:
-- ningún Administrador podía escribir distancias ni gestionar asignaciones
-- de persona a obra, aunque las policies parecían correctas a simple vista.


-- ============================================================
-- distancias_banco_obra
-- ============================================================

DROP POLICY IF EXISTS "Only admins can insert distancias" ON public.distancias_banco_obra;
CREATE POLICY "Only admins can insert distancias"
ON public.distancias_banco_obra
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

DROP POLICY IF EXISTS "Only admins can update distancias" ON public.distancias_banco_obra;
CREATE POLICY "Only admins can update distancias"
ON public.distancias_banco_obra
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

DROP POLICY IF EXISTS "Only admins can delete distancias" ON public.distancias_banco_obra;
CREATE POLICY "Only admins can delete distancias"
ON public.distancias_banco_obra
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


-- ============================================================
-- persona_obra
-- ============================================================

DROP POLICY IF EXISTS "Admins read all obra assignments" ON public.persona_obra;
CREATE POLICY "Admins read all obra assignments"
ON public.persona_obra
FOR SELECT
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

DROP POLICY IF EXISTS "Admins insert obra assignments" ON public.persona_obra;
CREATE POLICY "Admins insert obra assignments"
ON public.persona_obra
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

DROP POLICY IF EXISTS "Admins delete obra assignments" ON public.persona_obra;
CREATE POLICY "Admins delete obra assignments"
ON public.persona_obra
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
