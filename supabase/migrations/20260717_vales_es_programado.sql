-- Migración: vale de material programado para la jornada siguiente
-- Fecha: 2026-07-17
--
-- Caso de uso: a veces al camionero se le entrega el ticket un día antes para
-- que llegue directo al banco (en lugar de pasar primero por la obra), y así
-- ahorrar tiempo y combustible. Ese vale se crea hoy pero sus viajes se
-- registran en la jornada siguiente.
--
-- Por defecto un vale solo admite viajes dentro de su misma jornada laboral
-- (ver src/utils/jornadaLaboral.js). Con esta marca en true, la app permite
-- registrar viajes también en la jornada siguiente (máximo un día de
-- diferencia). Los vales normales quedan en false y no cambian de
-- comportamiento.

ALTER TABLE public.vales
  ADD COLUMN IF NOT EXISTS es_programado boolean NOT NULL DEFAULT false;
