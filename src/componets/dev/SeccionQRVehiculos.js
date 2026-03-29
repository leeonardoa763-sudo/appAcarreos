// 1. React y hooks
import React, { useEffect, useCallback } from "react";

// 2. React Native
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// 4. Local - Config
import { colors } from "../../config/colors";

// 5. Local - Hooks
import useVehiculosQR from "../../hooks/useVehiculosQR";

/**
 * SeccionQRVehiculos
 *
 * Lista vehículos activos con qr_uid y permite imprimir etiquetas QR en PDF.
 * Cada etiqueta muestra: nombre del operador, placas y código QR.
 *
 * USADO EN:
 * - DevToolsScreen
 */

// ── Generador de HTML para el PDF ─────────────────────────────────────────────

const ETIQUETAS_POR_FILA = 3;

const generarHtmlTodos = (vehiculos) => {
  // Agrupar en filas de 3
  const filas = [];
  for (let i = 0; i < vehiculos.length; i += ETIQUETAS_POR_FILA) {
    filas.push(vehiculos.slice(i, i + ETIQUETAS_POR_FILA));
  }

  const htmlFilas = filas
    .map((fila, indiceFila) => {
      const etiquetas = fila
        .map((v) => {
          const operador =
            v.operador_sugerido?.nombre_completo ?? "Sin operador";
          const qrUid = v.qr_uid;
          const capacidad = v.capacidad_m3 ? `${v.capacidad_m3} m³` : "";

          return `
        <td class="celda">
          <div class="etiqueta">
            <p class="operador">${operador}</p>
            <p class="placas">${v.placas}</p>
            ${capacidad ? `<p class="capacidad">${capacidad}</p>` : ""}
            <img
              class="qr"
              src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUid)}"
            />
            <p class="uid">${qrUid}</p>
          </div>
        </td>
      `;
        })
        .join("");

      // Rellenar celdas vacías si la fila no está completa
      const vacias = ETIQUETAS_POR_FILA - fila.length;
      const celdasVacias = Array(vacias)
        .fill(`<td class="celda"></td>`)
        .join("");

      return `
      <tr class="fila${indiceFila % 2 === 0 ? "" : " fila-par"}">
        ${etiquetas}
        ${celdasVacias}
      </tr>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #fff; }

        table {
          width: 100%;
          border-collapse: collapse;
          padding: 12px;
        }

        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .celda {
          width: 33.33%;
          padding: 8px;
          vertical-align: top;
        }

        .etiqueta {
          border: 2px solid #004E89;
          border-radius: 10px;
          padding: 10px 8px;
          text-align: center;
        }

        .operador {
          font-size: 10px;
          font-weight: bold;
          color: #2C3E50;
          margin-bottom: 2px;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .placas {
          font-size: 17px;
          font-weight: 900;
          color: #FF6B35;
          letter-spacing: 2px;
          margin-bottom: 2px;
        }

        .capacidad {
          font-size: 10px;
          color: #7F8C8D;
          margin-bottom: 4px;
        }

        .qr {
          width: 150px;
          height: 150px;
          margin: 4px auto;
          display: block;
        }

        .uid {
          font-size: 8px;
          color: #7F8C8D;
          margin-top: 4px;
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      <table>
        <tbody>
          ${htmlFilas}
        </tbody>
      </table>
    </body>
    </html>
  `;
};
const generarHtmlUno = (vehiculo) => generarHtmlTodos([vehiculo]);

// ── Componente principal ──────────────────────────────────────────────────────

const SeccionQRVehiculos = () => {
  const { vehiculos, loading, cargarVehiculos } = useVehiculosQR();

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const imprimirTodos = useCallback(async () => {
    if (vehiculos.length === 0) return;
    try {
      const html = generarHtmlTodos(vehiculos);
      const filas = Math.ceil(vehiculos.length / ETIQUETAS_POR_FILA);
      // Cada fila ocupa ~280px, más margen base de 60px
      const alturaHoja = Math.max(842, filas * 280 + 60);
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        height: alturaHoja,
        width: 794,
      });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
    } catch {
      // El usuario canceló el diálogo de compartir — no se muestra error
    }
  }, [vehiculos]);

  const imprimirUno = useCallback(async (vehiculo) => {
    try {
      const html = generarHtmlUno(vehiculo);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
    } catch {
      // Cancelado por el usuario
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="small" color={colors.secondary} />
        <Text style={styles.cargandoTexto}>Cargando vehículos...</Text>
      </View>
    );
  }

  if (vehiculos.length === 0) {
    return (
      <View style={styles.centrado}>
        <MaterialCommunityIcons
          name="truck-outline"
          size={40}
          color={colors.textSecondary}
        />
        <Text style={styles.vacioDTexto}>
          No hay vehículos con QR asignado.
        </Text>
        <Text style={styles.vacioSubtexto}>
          Asigna qr_uid en Supabase para que aparezcan aquí.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Botón imprimir todos */}
      <TouchableOpacity style={styles.botonTodos} onPress={imprimirTodos}>
        <MaterialCommunityIcons
          name="printer-outline"
          size={18}
          color={colors.surface}
        />
        <Text style={styles.botonTodosTexto}>
          Imprimir todos ({vehiculos.length})
        </Text>
      </TouchableOpacity>

      {/* Lista de vehículos */}
      <FlatList
        data={vehiculos}
        keyExtractor={(item) => item.id_vehiculo.toString()}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        renderItem={({ item }) => (
          <ItemVehiculo vehiculo={item} onImprimir={imprimirUno} />
        )}
      />
    </View>
  );
};

// ── Item individual ───────────────────────────────────────────────────────────

const ItemVehiculo = ({ vehiculo, onImprimir }) => {
  const operador =
    vehiculo.operador_sugerido?.nombre_completo ?? "Sin operador";

  return (
    <View style={styles.item}>
      <View style={styles.itemIcono}>
        <MaterialCommunityIcons
          name="dump-truck"
          size={28}
          color={colors.secondary}
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemPlacas}>{vehiculo.placas}</Text>
        <Text style={styles.itemOperador} numberOfLines={1}>
          {operador}
        </Text>
        <Text style={styles.itemUid}>{vehiculo.qr_uid}</Text>
      </View>
      <TouchableOpacity
        style={styles.botonImprimir}
        onPress={() => onImprimir(vehiculo)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons
          name="printer"
          size={20}
          color={colors.secondary}
        />
      </TouchableOpacity>
    </View>
  );
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centrado: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  cargandoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  vacioDTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: 8,
  },
  vacioSubtexto: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  botonTodos: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingVertical: 11,
    marginBottom: 14,
  },
  botonTodosTexto: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 14,
  },
  separador: {
    height: 1,
    backgroundColor: colors.background,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  itemIcono: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemPlacas: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  itemOperador: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemUid: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  botonImprimir: {
    padding: 6,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
});

export default SeccionQRVehiculos;
