/**
 * ErrorReportable.js
 *
 * Componente de error con capacidad de diagnóstico reportable.
 *
 * PROPÓSITO:
 * - Mostrar errores de forma clara al usuario de campo
 * - Permitir copiar el detalle del error al portapapeles
 * - Facilitar el reporte al administrador
 * - Ofrecer acción de reinicio/salida
 *
 * USO:
 * <ErrorReportable
 *   codigo="AG-K3X9M"
 *   titulo="Tiempo de Espera Agotado"
 *   mensaje="La app tardó demasiado en cargar."
 *   detalle="timeout en initializeAuth después de 12s"
 *   onReintentar={handleRetry}
 *   onSalir={handleSignOut}
 *   textoReintentar="Reintentar"
 *   textoSalir="Cerrar Sesión"
 *   icono="clock-alert-outline"
 *   colorIcono={colors.warning}
 * />
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const ErrorReportable = ({
  codigo = null,
  titulo = "Error inesperado",
  mensaje = "Ocurrió un problema. Intenta de nuevo.",
  detalle = null,
  onReintentar = null,
  onSalir = null,
  textoReintentar = "Reintentar",
  textoSalir = "Cerrar Sesión",
  icono = "alert-circle-outline",
  colorIcono = null,
  cargando = false,
}) => {
  const [copiado, setCopiado] = useState(false);

  const colorFinalIcono = colorIcono || colors.danger;

  // Construir el texto completo que se copia
  const buildTextoReporte = () => {
    const lineas = [
      "--- Error App Acarreos ---",
      `Codigo: ${codigo || "SIN-CODIGO"}`,
      `Fecha: ${new Date().toLocaleString("es-MX")}`,
      `Titulo: ${titulo}`,
      `Mensaje: ${mensaje}`,
    ];

    if (detalle) {
      lineas.push(`Detalle: ${detalle}`);
    }

    lineas.push("--- Enviar al administrador ---");
    return lineas.join("\n");
  };

  const handleCopiar = async () => {
    try {
      const texto = buildTextoReporte();
      await Clipboard.setStringAsync(texto);
      setCopiado(true);

      // Resetear el estado visual después de 3 segundos
      setTimeout(() => setCopiado(false), 3000);
    } catch (e) {
      // Si falla el clipboard (poco probable) no romper nada
      console.error("[ErrorReportable] Error copiando al clipboard:", e);
    }
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icono} size={72} color={colorFinalIcono} />

      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.mensaje}>{mensaje}</Text>

      {/* Bloque de codigo + copiar */}
      {codigo && (
        <View style={styles.codigoBloque}>
          <View style={styles.codigoFila}>
            <MaterialCommunityIcons
              name="bug-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={styles.codigoLabel}>Codigo de error:</Text>
            <Text style={styles.codigoValor}>{codigo}</Text>
          </View>

          <TouchableOpacity
            style={[styles.copiarBtn, copiado && styles.copiarBtnExito]}
            onPress={handleCopiar}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons
              name={copiado ? "check-circle-outline" : "content-copy"}
              size={18}
              color={copiado ? colors.accent : colors.primary}
            />
            <Text
              style={[
                styles.copiarBtnText,
                copiado && styles.copiarBtnTextExito,
              ]}
            >
              {copiado
                ? "Copiado — mándalo al administrador"
                : "Copiar error para reportar"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Acciones */}
      <View style={styles.acciones}>
        {onReintentar && (
          <TouchableOpacity
            style={[styles.btnPrimario, cargando && styles.btnDeshabilitado]}
            onPress={onReintentar}
            disabled={cargando}
            activeOpacity={0.8}
          >
            {cargando ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
            )}
            <Text style={styles.btnPrimarioTexto}>
              {cargando ? "Espera..." : textoReintentar}
            </Text>
          </TouchableOpacity>
        )}

        {onSalir && (
          <TouchableOpacity
            style={[styles.btnSecundario, cargando && styles.btnDeshabilitado]}
            onPress={onSalir}
            disabled={cargando}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={colors.danger}
            />
            <Text style={styles.btnSecundarioTexto}>{textoSalir}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.ayuda}>
        Copia el error y mándalo al administrador para recibir soporte
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 28,
  },
  titulo: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  mensaje: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  codigoBloque: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codigoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  codigoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  codigoValor: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  copiarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  copiarBtnExito: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}15`,
  },
  copiarBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  copiarBtnTextExito: {
    color: colors.accent,
  },
  acciones: {
    width: "100%",
    gap: 10,
  },
  btnPrimario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnPrimarioTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  btnSecundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  btnSecundarioTexto: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "600",
  },
  btnDeshabilitado: {
    opacity: 0.6,
  },
  ayuda: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 18,
    fontStyle: "italic",
    lineHeight: 18,
  },
});

export default ErrorReportable;
