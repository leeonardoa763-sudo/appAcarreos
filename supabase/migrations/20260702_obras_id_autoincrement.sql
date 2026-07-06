-- Migración: id_obra autoincremental
-- Fecha: 2026-07-02
--
-- id_obra era integer PRIMARY KEY sin default (se insertaba a mano, ej. 146,
-- 888). Se agrega una secuencia arrancando después del id_obra más alto
-- existente, para que las obras nuevas creadas desde el panel Admin obtengan
-- su ID automáticamente sin chocar con IDs ya usados.

CREATE SEQUENCE IF NOT EXISTS public.obras_id_obra_seq;

SELECT setval(
  'public.obras_id_obra_seq',
  COALESCE((SELECT MAX(id_obra) FROM public.obras), 0) + 1,
  false
);

ALTER TABLE public.obras
  ALTER COLUMN id_obra SET DEFAULT nextval('public.obras_id_obra_seq');

ALTER SEQUENCE public.obras_id_obra_seq OWNED BY public.obras.id_obra;
