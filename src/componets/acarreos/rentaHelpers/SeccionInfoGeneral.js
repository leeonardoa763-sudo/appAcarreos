/**
 * components/acarreos/rentaHelpers/SeccionInfoGeneral.js
 *
 * Sección "Información General" del detalle de vale de renta.
 * Muestra obra, operador, placas, sindicato, creador y completador.
 *
 * PROPS:
 * - vale: object — datos completos del vale
 * - detalleRenta: object — detalle específico de renta
 * - formatDate: function — formateador de fechas
 */

import React from "react";
import { View, Text } from "react-native";
import { rentaStyles as styles } from "./rentaStyles";
import InfoRow from "./InfoRow";

const SeccionInfoGeneral = ({ vale, detalleRenta, formatDate }) => {
  const nombreCompleto = (persona) => {
    if (!persona) return "N/A";
    return `${persona.nombre} ${persona.primer_apellido || ""} ${persona.segundo_apellido || ""}`.trim();
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Información General</Text>

      <InfoRow icon="domain" label="Obra" value={vale.obras?.obra || "N/A"} />
      <InfoRow
        icon="account-hard-hat"
        label="Operador"
        value={vale.operadores?.nombre_completo || "N/A"}
      />
      <InfoRow
        icon="truck"
        label="Placas"
        value={vale.vehiculos?.placas || "N/A"}
      />
      <InfoRow
        icon="home-group"
        label="Sindicato"
        value={
          detalleRenta?.sindicatos?.sindicato ||
          vale?.vehiculos?.sindicatos?.sindicato ||
          "N/A"
        }
      />
      <InfoRow
        icon="account-plus"
        label="Creado por"
        value={nombreCompleto(vale.persona)}
      />

      {vale.estado !== "en_proceso" &&
        vale.estado !== "borrador" &&
        vale.persona_completador && (
          <InfoRow
            icon="account-check"
            label="Completado por"
            value={nombreCompleto(vale.persona_completador)}
          />
        )}

      {vale.fecha_completado && (
        <InfoRow
          icon="calendar-check"
          label="Fecha completado"
          value={formatDate(vale.fecha_completado)}
        />
      )}
    </View>
  );
};

export default SeccionInfoGeneral;
