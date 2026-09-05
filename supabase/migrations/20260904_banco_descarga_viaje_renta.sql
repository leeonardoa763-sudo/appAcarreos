-- Migración: banco de descarga obligatorio por viaje de renta (las 4 categorías)
-- Fecha: 2026-09-04
--
-- Contexto: el sistema viejo de "tickets de descarga" (tickets_descarga,
-- impresión Bluetooth) exigía banco solo para materiales con
-- es_material_descarga = true, leído de vale_renta_detalle.material — que ya
-- no se llena en renta normal (ver 20260904_categorias_material_renta.sql).
-- Se decidió con el usuario: las 4 categorías nuevas piden banco de descarga
-- como un paso más del mismo modal de "Registrar Viaje" (no una fila aparte
-- en tickets_descarga), guardado directo en el viaje. El sistema viejo de
-- tickets_descarga sigue intacto para pipas de agua (su material sigue
-- siendo fijo por vale).
--
-- El ticket SÍ se sigue imprimiendo por Bluetooth (aclarado por el usuario):
-- tras registrar el viaje se abre el mismo modal de impresión que ya existía
-- (ModalImprimirTicketRenta) con los datos de ESE viaje, y no se puede
-- registrar el viaje N+1 hasta marcar impreso el ticket del viaje N —mismo
-- candado que tenía el sistema viejo, ahora guardado en la propia fila del
-- viaje en vez de en una tabla de tickets aparte.

ALTER TABLE vale_renta_viajes
  ADD COLUMN banco_descarga text,
  ADD COLUMN ticket_impreso boolean NOT NULL DEFAULT false;
