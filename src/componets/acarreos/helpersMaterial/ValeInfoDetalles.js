import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import styles from "./valeDetalleMaterialStyles";
import InfoRow from "./InfoRow";

const ValeInfoDetalles = ({
  vale,
  detalleMaterial,
  esTipo3,
  formatDate,
  userProfile,
}) => {
  return (
    <>
      {/* Detalles del Material */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles del Material</Text>

        <InfoRow
          icon="cube-outline"
          label="Material"
          value={detalleMaterial.material?.material || "N/A"}
        />

        {detalleMaterial.requisicion && (
          <InfoRow
            icon="file-document-outline"
            label="Requisición"
            value={detalleMaterial.requisicion}
          />
        )}

        {detalleMaterial.folio_vale_fisico && (
          <InfoRow
            icon="file-document-outline"
            label="Vale Físico"
            value={String(detalleMaterial.folio_vale_fisico)}
          />
        )}

        <InfoRow
          icon="bank"
          label="Banco"
          value={detalleMaterial.bancos?.banco || "N/A"}
        />

        <InfoRow
          icon="cube-send"
          label="Capacidad"
          value={`${detalleMaterial.capacidad_m3} m³`}
        />

        <InfoRow
          icon="map-marker-distance"
          label="Distancia"
          value={`${detalleMaterial.distancia_km} km`}
        />

        <InfoRow
          icon="package-variant"
          label="Cantidad Pedida"
          value={`${detalleMaterial.cantidad_pedida_m3} m³`}
        />

        {vale.estado !== "en_proceso" && (
          <>
            {!esTipo3 && (
              <>
                <InfoRow
                  icon="weight"
                  label="Peso"
                  value={`${detalleMaterial.peso_ton} Ton`}
                />
                <InfoRow
                  icon="cube"
                  label="Volumen Real"
                  value={`${detalleMaterial.volumen_real_m3?.toFixed(2) || "N/A"} m³`}
                />
                <InfoRow
                  icon="file-document"
                  label="Folio Banco"
                  value={detalleMaterial.folio_banco || "N/A"}
                />
              </>
            )}

            {esTipo3 && (
              <InfoRow
                icon="cube"
                label="Cantidad Final"
                value={`${detalleMaterial.volumen_real_m3?.toFixed(2) || "N/A"} m³`}
              />
            )}

            <InfoRow
              icon="calendar-check"
              label="Emitido el"
              value={formatDate(vale.fecha_creacion)}
            />
          </>
        )}

        {detalleMaterial.notas_adicionales && (
          <View style={styles.notasContainer}>
            <View style={styles.notasHeader}>
              <MaterialCommunityIcons
                name="note-text"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.notasLabel}>Notas Adicionales</Text>
            </View>
            <Text style={styles.notasText}>
              {detalleMaterial.notas_adicionales}
            </Text>
          </View>
        )}
      </View>

      {/* Precios y Costo */}
      {vale.estado !== "en_proceso" &&
        detalleMaterial.precio_m3 &&
        userProfile?.roles?.role !== "CHECADOR" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Precios y Costo</Text>

            <InfoRow
              icon="cash"
              label="Precio por m³"
              value={`$${parseFloat(detalleMaterial.precio_m3).toFixed(2)} MXN`}
            />

            {detalleMaterial.tarifa_primer_km && (
              <InfoRow
                icon="currency-usd"
                label="Tarifa 1er Km"
                value={`$${parseFloat(detalleMaterial.tarifa_primer_km).toFixed(2)} MXN`}
              />
            )}

            {detalleMaterial.tarifa_subsecuente && (
              <InfoRow
                icon="currency-usd"
                label="Tarifa Subsecuente"
                value={`$${parseFloat(detalleMaterial.tarifa_subsecuente).toFixed(2)} MXN/km`}
              />
            )}

            {detalleMaterial.costo_total && (
              <View style={styles.totalContainer}>
                <InfoRow
                  icon="currency-usd"
                  label="Costo Total"
                  value={`$${parseFloat(detalleMaterial.costo_total).toFixed(2)} MXN`}
                />
              </View>
            )}
          </View>
        )}
    </>
  );
};

export default ValeInfoDetalles;
