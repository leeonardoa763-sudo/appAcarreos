import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import styles from "./valeDetalleMaterialStyles";
import InfoRow from "./InfoRow";

const ValeInfoGeneral = ({
  vale,
  detalleMaterial,
  formatDate,
  userProfile,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Información General</Text>

      <InfoRow icon="domain" label="Obra" value={vale.obras?.obra || "N/A"} />
      <InfoRow
        icon="account-hard-hat"
        label="Operador"
        value={vale.operadores?.nombre_completo || "Pendiente"}
      />
      <InfoRow
        icon="truck"
        label="Placas"
        value={vale.vehiculos?.placas || "Pendiente"}
      />
      <InfoRow
        icon="home-group"
        label="Sindicato"
        value={
          detalleMaterial?.sindicatos?.sindicato ||
          vale?.vehiculos?.sindicatos?.sindicato ||
          "N/A"
        }
      />
      <InfoRow
        icon="account-plus"
        label="Creado por"
        value={
          vale.persona
            ? `${vale.persona.nombre} ${vale.persona.primer_apellido || ""} ${vale.persona.segundo_apellido || ""}`.trim()
            : "N/A"
        }
      />

      {vale.estado !== "en_proceso" &&
        vale.estado !== "borrador" &&
        vale.persona_completador && (
          <InfoRow
            icon="account-check"
            label="Completado por"
            value={`${vale.persona_completador.nombre} ${vale.persona_completador.primer_apellido || ""} ${vale.persona_completador.segundo_apellido || ""}`.trim()}
          />
        )}

      {vale.fecha_completado && (
        <InfoRow
          icon="calendar-check"
          label="Fecha completado"
          value={`${formatDate(vale.fecha_completado)} ${new Date(vale.fecha_completado).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`}
        />
      )}

      {vale.estado === "cancelado" && vale.motivo_cancelacion && (
        <View style={styles.motivoCancelacionContainer}>
          <View style={styles.motivoCancelacionHeader}>
            <MaterialCommunityIcons
              name="cancel"
              size={16}
              color={colors.danger}
            />
            <Text style={styles.motivoCancelacionLabel}>
              Motivo de cancelación
            </Text>
          </View>
          <Text style={styles.motivoCancelacionTexto}>
            {vale.motivo_cancelacion}
          </Text>
        </View>
      )}
    </View>
  );
};

export default ValeInfoGeneral;
