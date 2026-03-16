/**
 * components/acarreos/rentaHelpers/SeccionTarifas.js
 *
 * Sección "Tarifas y Costo" del detalle del vale de renta.
 * Solo visible para vales emitidos y usuarios que no sean CHECADOR.
 *
 * PROPS:
 * - vale: object — datos completos del vale
 * - detalleRenta: object — detalle específico de renta
 * - preciosRenta: object — tarifas del sindicato (costo_hr, costo_dia)
 * - userProfile: object — perfil del usuario autenticado
 * - formatCurrency: function — formateador de moneda
 */

import React from "react";
import { View, Text } from "react-native";
import { rentaStyles as styles } from "./rentaStyles";
import InfoRow from "./InfoRow";

const SeccionTarifas = ({
  vale,
  detalleRenta,
  preciosRenta,
  userProfile,
  formatCurrency,
}) => {
  if (
    vale.estado === "en_proceso" ||
    !preciosRenta ||
    userProfile?.roles?.role === "CHECADOR"
  ) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tarifas y Costo</Text>

      {preciosRenta.costo_hr !== null &&
        preciosRenta.costo_hr !== undefined && (
          <InfoRow
            icon="cash"
            label="Tarifa por Hora"
            value={formatCurrency(preciosRenta.costo_hr)}
          />
        )}

      {preciosRenta.costo_dia !== null &&
        preciosRenta.costo_dia !== undefined && (
          <InfoRow
            icon="cash-multiple"
            label="Tarifa por Día"
            value={formatCurrency(preciosRenta.costo_dia)}
          />
        )}

      {detalleRenta.costo_total !== null &&
        detalleRenta.costo_total !== undefined && (
          <View style={styles.totalContainer}>
            <InfoRow
              icon="currency-usd"
              label="Costo Total"
              value={formatCurrency(detalleRenta.costo_total)}
            />
          </View>
        )}
    </View>
  );
};

export default SeccionTarifas;
