-- Migración: permisos DELETE para Residente en viajes y tickets de material
-- Fecha: 2026-04-27
--
-- Permite que el rol Residente elimine el último viaje o ticket de un vale
-- de material que esté en estado 'en_proceso'.
-- La restricción de orden inverso se aplica en la app — la BD solo valida
-- que el vale siga activo.

-- ── Política DELETE en vale_material_viajes ───────────────────────────────────

CREATE POLICY "residente_delete_viajes_material"
ON vale_material_viajes
FOR DELETE
TO authenticated
USING (
  -- El usuario autenticado es Residente
  EXISTS (
    SELECT 1
    FROM persona p
    JOIN roles r ON r.id_roles = p.id_role
    WHERE p.auth_user_id = auth.uid()
      AND r.role = 'Residente'
  )
  -- El vale al que pertenece el viaje sigue en proceso
  AND EXISTS (
    SELECT 1
    FROM vale_material_detalles vmd
    JOIN vales v ON v.id_vale = vmd.id_vale
    WHERE vmd.id_detalle_material = vale_material_viajes.id_detalle_material
      AND v.estado = 'en_proceso'
  )
);

-- ── Política DELETE en tickets_material ──────────────────────────────────────

CREATE POLICY "residente_delete_tickets_material"
ON tickets_material
FOR DELETE
TO authenticated
USING (
  -- El usuario autenticado es Residente
  EXISTS (
    SELECT 1
    FROM persona p
    JOIN roles r ON r.id_roles = p.id_role
    WHERE p.auth_user_id = auth.uid()
      AND r.role = 'Residente'
  )
  -- El vale al que pertenece el ticket sigue en proceso
  AND EXISTS (
    SELECT 1
    FROM vales v
    WHERE v.id_vale = tickets_material.id_vale
      AND v.estado = 'en_proceso'
  )
);
