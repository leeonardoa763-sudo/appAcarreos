// 1. React y hooks
import React, { useState, useEffect, useCallback } from "react";

// 2. React Native
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../config/colors";

// 5. Local - Hooks
import useVehiculoQR from "../hooks/useVehiculoQR";
import SeccionQRVehiculos from "../componets/dev/SeccionQRVehiculos";
// QR de prueba — vehículo con operador sugerido confirmado en BD
const QR_PRUEBA = "VH-TH3620G";

export default function DevToolsScreen() {
  const {
    vehiculo,
    valesActivos,
    valesDisponibles,
    foliosActivos,
    cargando,
    asignando,
    error,
    limiteAlcanzado,
    buscarVehiculoPorQR,
    reset,
  } = useVehiculoQR();

  const [log, setLog] = useState([]);

  const agregarLog = useCallback((mensaje, tipo = "info") => {
    const hora = new Date().toLocaleTimeString("es-MX");
    setLog((prev) => [{ hora, mensaje, tipo }, ...prev].slice(0, 30));
  }, []);

  // Reflejar cambios de estado en el log visual
  useEffect(() => {
    if (vehiculo) {
      agregarLog(`Vehiculo encontrado: ${vehiculo.placas}`, "ok");
      agregarLog(`Vales activos: ${valesActivos}`, "info");
      agregarLog(
        `Folios activos: ${foliosActivos?.length ? foliosActivos.join(", ") : "ninguno"}`,
        "info",
      );
      agregarLog(
        `Limite alcanzado: ${limiteAlcanzado ? "SI" : "NO"}`,
        limiteAlcanzado ? "warn" : "ok",
      );
      agregarLog(
        `Operador sugerido: ${vehiculo.operador_sugerido_nombre ?? "sin asignar"}`,
        "info",
      );
    }
  }, [vehiculo]);

  useEffect(() => {
    if (valesDisponibles.length > 0) {
      agregarLog(`Vales disponibles: ${valesDisponibles.length}`, "ok");
      valesDisponibles.forEach((v) => {
        agregarLog(
          `  → ${v.folio} | ${v.obras?.obra ?? "?"} | ${v.tipo_vale}`,
          "info",
        );
      });
    } else if (vehiculo && !cargando) {
      agregarLog("Sin vales disponibles para asignar", "warn");
    }
  }, [valesDisponibles]);

  useEffect(() => {
    if (error) {
      agregarLog(`ERROR: ${error}`, "error");
    }
  }, [error]);

  // ─── Acciones ─────────────────────────────────────────────────────────────

  const handleProbarQR = useCallback(async () => {
    agregarLog(`Buscando QR: ${QR_PRUEBA}...`, "info");
    await buscarVehiculoPorQR(QR_PRUEBA);
  }, [buscarVehiculoPorQR]);

  const handleProbarQRInvalido = useCallback(async () => {
    agregarLog("Probando QR inexistente...", "warn");
    await buscarVehiculoPorQR("VH-NOEXISTE");
  }, [buscarVehiculoPorQR]);

  const handleReset = useCallback(() => {
    reset();
    setLog([]);
    agregarLog("Estado reseteado", "info");
  }, [reset]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header de advertencia */}
      <View style={styles.bannerDev}>
        <MaterialCommunityIcons name="bug" size={18} color={colors.surface} />
        <Text style={styles.bannerTexto}>
          MODO DESARROLLADOR — Solo Administrador
        </Text>
      </View>
      {/* ── Sección: Etiquetas QR Vehículos ── */}
      <View style={styles.separadorSeccion} />
      <Text style={styles.seccionTitulo}>Etiquetas QR Vehículos</Text>
      <SeccionQRVehiculos />

      {/* ── Sección: useVehiculoQR ── */}
      <Text style={styles.seccionTitulo}>useVehiculoQR</Text>

      {/* Botones de prueba */}
      <View style={styles.fila}>
        <TouchableOpacity
          style={[
            styles.boton,
            styles.botonPrimario,
            cargando && styles.botonDisabled,
          ]}
          onPress={handleProbarQR}
          disabled={cargando || asignando}
        >
          {cargando ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={18}
              color={colors.surface}
            />
          )}
          <Text style={styles.botonTexto}>
            {cargando ? "Buscando..." : "Probar QR válido"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.boton,
            styles.botonWarn,
            cargando && styles.botonDisabled,
          ]}
          onPress={handleProbarQRInvalido}
          disabled={cargando || asignando}
        >
          <MaterialCommunityIcons
            name="qrcode-remove"
            size={18}
            color={colors.surface}
          />
          <Text style={styles.botonTexto}>QR inválido</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.boton, styles.botonReset]}
        onPress={handleReset}
      >
        <MaterialCommunityIcons
          name="refresh"
          size={18}
          color={colors.textSecondary}
        />
        <Text style={[styles.botonTexto, { color: colors.textSecondary }]}>
          Reset
        </Text>
      </TouchableOpacity>

      {/* Resultado del vehículo */}
      {vehiculo && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Vehículo encontrado</Text>
          <Fila label="Placas" valor={vehiculo.placas} />
          <Fila label="QR UID" valor={vehiculo.qr_uid} />
          <Fila
            label="Capacidad"
            valor={vehiculo.capacidad_m3 ? `${vehiculo.capacidad_m3} m³` : "—"}
          />
          <Fila
            label="Operador sugerido"
            valor={vehiculo.operador_sugerido?.nombre_completo ?? "—"}
          />
          <Fila
            label="Vales activos"
            valor={`${valesActivos} / ${2}`}
            alerta={limiteAlcanzado}
          />
          <Fila
            label="Límite alcanzado"
            valor={limiteAlcanzado ? "SI" : "NO"}
            alerta={limiteAlcanzado}
          />
          {foliosActivos?.length > 0 && (
            <Fila label="Folios activos" valor={foliosActivos.join(", ")} />
          )}
        </View>
      )}

      {/* Lista de vales disponibles */}
      {valesDisponibles.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>
            Vales disponibles ({valesDisponibles.length})
          </Text>
          {valesDisponibles.map((v) => (
            <View key={v.id_vale} style={styles.valeItem}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={16}
                color={colors.secondary}
              />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.valeFolio}>{v.folio}</Text>
                <Text style={styles.valeObra}>
                  {v.obras?.obra ?? "—"} · {v.tipo_vale}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Log en pantalla */}
      <Text style={styles.seccionTitulo}>Log</Text>
      <View style={styles.logContainer}>
        {log.length === 0 ? (
          <Text style={styles.logVacio}>Sin eventos aún</Text>
        ) : (
          log.map((entry, i) => (
            <Text
              key={i}
              style={[styles.logLinea, styles[`log_${entry.tipo}`]]}
            >
              {entry.hora} {entry.mensaje}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ─── Subcomponente auxiliar ───────────────────────────────────────────────────

const Fila = ({ label, valor, alerta = false }) => (
  <View style={styles.filaCard}>
    <Text style={styles.filaLabel}>{label}</Text>
    <Text style={[styles.filaValor, alerta && styles.filaAlerta]}>{valor}</Text>
  </View>
);

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // Banner
  bannerDev: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7F2982",
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginBottom: 20,
  },
  bannerTexto: {
    color: colors.surface,
    fontWeight: "bold",
    fontSize: 13,
  },

  // Secciones
  seccionTitulo: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },

  // Botones
  fila: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  botonPrimario: {
    backgroundColor: colors.secondary,
  },
  botonWarn: {
    backgroundColor: colors.primary,
  },
  botonReset: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 0,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  botonDisabled: {
    opacity: 0.5,
  },
  botonTexto: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: 13,
  },

  // Card resultado
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitulo: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  filaCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  filaLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  filaValor: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  filaAlerta: {
    color: colors.primary,
  },

  // Vales disponibles
  valeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  valeFolio: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  valeObra: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  separadorSeccion: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },

  // Log
  logContainer: {
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
  },
  logVacio: {
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
  },
  logLinea: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
    marginBottom: 3,
  },
  log_info: { color: "#8be9fd" },
  log_ok: { color: "#50fa7b" },
  log_warn: { color: "#ffb86c" },
  log_error: { color: "#ff5555" },
});
