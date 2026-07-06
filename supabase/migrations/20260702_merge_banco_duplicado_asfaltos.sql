-- Migración: fusiona banco duplicado "PLANTA DE ASFALTOS" (id_banco=4)
-- en "PLANTA ASFALTOS KM18" (id_banco=14)
-- Fecha: 2026-07-02
--
-- id_banco=4 queda como duplicado a eliminar. Antes de borrar, se reasignan
-- todas las referencias existentes (histórico de vales incluido) al banco
-- que se conserva (id_banco=14), para no dejar vales viejos con un banco roto.
--
-- Todo en una transacción: si alguna reasignación falla (ej. por una
-- restricción unique no documentada en schema.sql), no se aplica nada.

BEGIN;

UPDATE peso_especifico
SET id_banco = 14
WHERE id_banco = 4;

UPDATE distancias_banco_obra
SET id_banco = 14
WHERE id_banco = 4;

UPDATE vale_material_detalles
SET id_banco = 14
WHERE id_banco = 4;

UPDATE vale_material_viajes
SET id_banco_override = 14
WHERE id_banco_override = 4;

DELETE FROM bancos
WHERE id_banco = 4;

COMMIT;
