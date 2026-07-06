-- Migración: rol "Planta de Asfaltos" + distancias banco -> planta de asfaltos
-- Fecha: 2026-07-02
--
-- Vales de material para fabricar carpeta asfáltica: el camión no descarga
-- en la obra, descarga en la planta de asfaltos. El flete debe calcularse
-- con la distancia banco -> planta (no banco -> obra), pero el vale se
-- sigue cargando a la obra que consume el material (presupuesto correcto).
--
-- Solo existe una planta de asfaltos, por eso la tabla nueva es banco -> km
-- (sin catálogo de plantas). El acceso a obras del rol nuevo se resuelve
-- con persona_obra (ya existente) -- esta migración no toca RLS de `vales`.

-- ============================================================
-- Rol nuevo
-- ============================================================

INSERT INTO public.roles (id_roles, role)
SELECT COALESCE((SELECT MAX(id_roles) FROM public.roles), 0) + 1, 'Planta de Asfaltos'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role = 'Planta de Asfaltos');

-- ============================================================
-- distancias_banco_planta
-- ============================================================

CREATE TABLE IF NOT EXISTS public.distancias_banco_planta (
  id_distancia_banco_planta  integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_banco                   integer NOT NULL REFERENCES public.bancos(id_banco),
  distancia_km               numeric NOT NULL,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id_banco)
);

ALTER TABLE public.distancias_banco_planta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read distancias_banco_planta" ON public.distancias_banco_planta;
CREATE POLICY "Authenticated read distancias_banco_planta"
ON public.distancias_banco_planta
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Only admins can insert distancias_banco_planta" ON public.distancias_banco_planta;
CREATE POLICY "Only admins can insert distancias_banco_planta"
ON public.distancias_banco_planta
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

DROP POLICY IF EXISTS "Only admins can update distancias_banco_planta" ON public.distancias_banco_planta;
CREATE POLICY "Only admins can update distancias_banco_planta"
ON public.distancias_banco_planta
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

DROP POLICY IF EXISTS "Only admins can delete distancias_banco_planta" ON public.distancias_banco_planta;
CREATE POLICY "Only admins can delete distancias_banco_planta"
ON public.distancias_banco_planta
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
