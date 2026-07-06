-- Migración: columna activo (soft-delete) + políticas INSERT/UPDATE para Administrador en obras
-- Fecha: 2026-07-02
-- YA APLICADA EN SUPABASE — no volver a correr (CREATE POLICY fallaría por duplicado).
--
-- obras solo tenía SELECT (anon + authenticated), sin políticas de escritura.
-- No se agrega política DELETE: las obras no se eliminan, solo se desactivan
-- vía UPDATE (activo = false), ya cubierto por admin_update_obra.

ALTER TABLE public.obras
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

CREATE POLICY "admin_insert_obra"
ON public.obras
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

CREATE POLICY "admin_update_obra"
ON public.obras
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
