/**
 * components/acarreos/rentaHelpers/ModalImprimirTicketRenta.js
 *
 * Modal OBLIGATORIO de impresión de ticket físico para vales de RENTA completados.
 *
 * PROPÓSITO:
 * - Aparece después de que el usuario comparte la copia blanca por WhatsApp
 * - No se puede cerrar ni saltar — el usuario DEBE imprimir o confirmar que no hay impresora
 * - Imprime los mismos datos que la copia blanca del vale de renta
 * - Usa generarTicketRenta() del ticketGenerator existente
 *
 * PROPS:
 * - visible: boolean — controla visibilidad del modal
 * - valeData: object — datos completos del vale (mismo objeto que se pasó al PDF)
 * - onImpreso: function — se llama cuando la impresión fue exitosa
 * - onSinImpresora: function — se llama cuando el usuario confirma que no hay impresora
 */

// 1. React
import React, { useState, useCallback } from "react";

// 2. React Native
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../../../config/colors";
import { BLUETOOTH_ENABLED } from "../../../config/features";

// 5. Imports condicionales de Bluetooth y generador
let verificarBluetooth, escanearImpresoras, conectarImpresora, imprimirTicket;
let generarTicketRenta;

if (BLUETOOTH_ENABLED) {
  const bt = require("../../../services/bluetoothPrinter");
  verificarBluetooth = bt.verificarBluetooth;
  escanearImpresoras = bt.escanearImpresoras;
  conectarImpresora = bt.conectarImpresora;
  imprimirTicket = bt.imprimirTicket;

  const tg = require("../../../services/ticketGenerator");
  generarTicketRenta = tg.generarTicketRenta;
}

// ─── Subcomponente: item de impresora ─────────────────────────────────────────

const ImpresoraItem = ({ dispositivo, onSeleccionar, deshabilitado }) => (
  <TouchableOpacity
    style={[
      styles.impresoraItem,
      deshabilitado && styles.impresoraItemDisabled,
    ]}
    onPress={() => onSeleccionar(dispositivo)}
    disabled={deshabilitado}
    activeOpacity={0.7}
  >
    <MaterialCommunityIcons
      name="printer-pos"
      size={22}
      color={deshabilitado ? colors.textSecondary : colors.secondary}
    />
    <View style={styles.impresoraInfo}>
      <Text style={styles.impresoraNombre}>{dispositivo.name}</Text>
      <Text style={styles.impresoraDireccion}>{dispositivo.address}</Text>
    </View>
    <MaterialCommunityIcons
      name="chevron-right"
      size={20}
      color={colors.textSecondary}
    />
  </TouchableOpacity>
);

// ─── Componente principal ─────────────────────────────────────────────────────

const ModalImprimirTicketRenta = ({
  visible,
  valeData,
  onImpreso,
  onSinImpresora,
}) => {
  const [fase, setFase] = useState("inicio"); // "inicio" | "escaneando" | "lista" | "imprimiendo" | "exito"
  const [impresoras, setImpresoras] = useState([]);
  const [errorMensaje, setErrorMensaje] = useState(null);

  // ─── Escanear impresoras ───────────────────────────────────────────────────

  const handleBuscarImpresoras = useCallback(async () => {
    console.log("[ModalImprimirTicketRenta] Iniciando búsqueda de impresoras");
    setErrorMensaje(null);

    try {
      // 1. Verificar Bluetooth activo
      setFase("escaneando");
      console.log("[ModalImprimirTicketRenta] Verificando Bluetooth...");
      const bluetoothActivo = await verificarBluetooth();
      console.log(
        "[ModalImprimirTicketRenta] Bluetooth activo:",
        bluetoothActivo,
      );

      if (!bluetoothActivo) {
        setFase("inicio");
        Alert.alert(
          "Bluetooth desactivado",
          "Activa el Bluetooth para conectar la impresora.",
        );
        return;
      }

      // 2. Escanear dispositivos vinculados
      console.log(
        "[ModalImprimirTicketRenta] Escaneando impresoras vinculadas...",
      );
      const dispositivos = await escanearImpresoras();
      console.log(
        `[ModalImprimirTicketRenta] Impresoras encontradas: ${dispositivos.length}`,
      );
      dispositivos.forEach((d) =>
        console.log(`[ModalImprimirTicketRenta]   - ${d.name} | ${d.address}`),
      );

      setImpresoras(dispositivos);
      setFase("lista");
    } catch (error) {
      console.log(
        "[ModalImprimirTicketRenta] Error al escanear:",
        error.message,
      );
      setFase("inicio");
      setErrorMensaje(
        "No se pudieron buscar impresoras. Verifica que el Bluetooth esté activo.",
      );
    }
  }, []);

  // ─── Seleccionar impresora e imprimir ──────────────────────────────────────

  const handleSeleccionarImpresora = useCallback(
    async (dispositivo) => {
      console.log(
        `[ModalImprimirTicketRenta] Impresora seleccionada: ${dispositivo.name} | ${dispositivo.address}`,
      );
      setFase("imprimiendo");
      setErrorMensaje(null);

      try {
        // 1. Conectar
        console.log("[ModalImprimirTicketRenta] Conectando a impresora...");
        const device = await conectarImpresora(dispositivo.address);
        console.log("[ModalImprimirTicketRenta] Conexión exitosa");

        // 2. Generar líneas del ticket (mismos datos que copia blanca)
        console.log(
          "[ModalImprimirTicketRenta] Generando contenido del ticket...",
        );
        const lineas = generarTicketRenta(valeData);
        console.log(
          `[ModalImprimirTicketRenta] Ticket generado con ${lineas.length} líneas`,
        );

        // 3. Imprimir
        console.log("[ModalImprimirTicketRenta] Enviando a impresora...");
        await imprimirTicket(device, lineas);
        console.log("[ModalImprimirTicketRenta] Impresión exitosa");

        // 4. Mostrar éxito y notificar
        setFase("exito");
      } catch (error) {
        console.log(
          `[ModalImprimirTicketRenta] Error al imprimir: ${error.message}`,
        );
        setFase("lista");
        setErrorMensaje(`Error al imprimir: ${error.message}`);
      }
    },
    [valeData],
  );

  // ─── Confirmar éxito y cerrar ──────────────────────────────────────────────

  const handleConfirmarExito = useCallback(() => {
    console.log(
      "[ModalImprimirTicketRenta] Impresión confirmada, cerrando modal",
    );
    setFase("inicio");
    setImpresoras([]);
    setErrorMensaje(null);
    onImpreso?.();
  }, [onImpreso]);

  // ─── Sin impresora disponible ──────────────────────────────────────────────

  const handleSinImpresora = useCallback(() => {
    console.log(
      "[ModalImprimirTicketRenta] Usuario confirmó sin impresora disponible",
    );
    Alert.alert(
      "Continuar sin imprimir",
      "El ticket físico no se imprimirá. ¿Deseas continuar de todas formas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            console.log(
              "[ModalImprimirTicketRenta] Confirmado continuar sin impresora",
            );
            setFase("inicio");
            setImpresoras([]);
            setErrorMensaje(null);
            onSinImpresora?.();
          },
        },
      ],
    );
  }, [onSinImpresora]);

  // ─── Reintentar desde lista ────────────────────────────────────────────────

  const handleReintentar = useCallback(() => {
    console.log(
      "[ModalImprimirTicketRenta] Reintentando búsqueda de impresoras",
    );
    setFase("inicio");
    setImpresoras([]);
    setErrorMensaje(null);
  }, []);

  // ─── Render por fase ───────────────────────────────────────────────────────

  const renderContenido = () => {
    // Fase: escaneando
    if (fase === "escaneando") {
      return (
        <View style={styles.estadoContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.estadoTitulo}>Buscando impresoras...</Text>
          <Text style={styles.estadoSubtitulo}>
            Asegúrate de que la impresora esté encendida y vinculada por
            Bluetooth
          </Text>
        </View>
      );
    }

    // Fase: imprimiendo
    if (fase === "imprimiendo") {
      return (
        <View style={styles.estadoContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.estadoTitulo}>Imprimiendo ticket...</Text>
          <Text style={styles.estadoSubtitulo}>No cierres esta pantalla</Text>
        </View>
      );
    }

    // Fase: éxito
    if (fase === "exito") {
      return (
        <View style={styles.estadoContainer}>
          <View style={styles.exitoIcono}>
            <MaterialCommunityIcons
              name="check-circle"
              size={64}
              color={colors.accent}
            />
          </View>
          <Text style={styles.exitoTitulo}>Ticket impreso</Text>
          <Text style={styles.estadoSubtitulo}>
            El ticket físico fue enviado a la impresora exitosamente
          </Text>
          <TouchableOpacity
            style={styles.botonPrimario}
            onPress={handleConfirmarExito}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="check"
              size={20}
              color={colors.surface}
            />
            <Text style={styles.botonPrimarioTexto}>Listo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Fase: lista de impresoras
    if (fase === "lista") {
      return (
        <View style={styles.listaContainer}>
          {impresoras.length === 0 ? (
            <View style={styles.sinImpresorasContainer}>
              <MaterialCommunityIcons
                name="printer-off"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.sinImpresorasTexto}>
                No se encontraron impresoras vinculadas
              </Text>
              <Text style={styles.sinImpresorasSubtexto}>
                Vincula la impresora en la configuración Bluetooth del
                dispositivo
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.listaLabel}>Selecciona una impresora:</Text>
              <FlatList
                data={impresoras}
                keyExtractor={(item) => item.address}
                renderItem={({ item }) => (
                  <ImpresoraItem
                    dispositivo={item}
                    onSeleccionar={handleSeleccionarImpresora}
                    deshabilitado={false}
                  />
                )}
                style={styles.flatList}
                scrollEnabled={impresoras.length > 3}
              />
            </>
          )}

          {errorMensaje && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={16}
                color={colors.danger}
              />
              <Text style={styles.errorTexto}>{errorMensaje}</Text>
            </View>
          )}

          <View style={styles.botonesLista}>
            <TouchableOpacity
              style={styles.botonSecundario}
              onPress={handleReintentar}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={18}
                color={colors.secondary}
              />
              <Text style={styles.botonSecundarioTexto}>Buscar de nuevo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botonPeligro}
              onPress={handleSinImpresora}
              activeOpacity={0.7}
            >
              <Text style={styles.botonPeligroTexto}>Sin impresora</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Fase: inicio (pantalla principal)
    return (
      <View style={styles.inicioContainer}>
        <View style={styles.iconoPrincipal}>
          <MaterialCommunityIcons
            name="printer-pos"
            size={56}
            color={colors.secondary}
          />
        </View>

        <Text style={styles.inicioTitulo}>Imprimir ticket físico</Text>
        <Text style={styles.inicioSubtitulo}>
          La copia blanca fue compartida. Ahora imprime el ticket físico para el
          operador.
        </Text>

        {/* Resumen de datos del vale */}
        {valeData && (
          <View style={styles.resumenVale}>
            <View style={styles.resumenFila}>
              <Text style={styles.resumenLabel}>Folio:</Text>
              <Text style={styles.resumenValor}>{valeData.folio || "N/A"}</Text>
            </View>
            <View style={styles.resumenFila}>
              <Text style={styles.resumenLabel}>Operador:</Text>
              <Text style={styles.resumenValor} numberOfLines={1}>
                {valeData.operadores?.nombre_completo || "N/A"}
              </Text>
            </View>
            <View style={styles.resumenFila}>
              <Text style={styles.resumenLabel}>Placas:</Text>
              <Text style={styles.resumenValor}>
                {valeData.vehiculos?.placas || "N/A"}
              </Text>
            </View>
            <View style={styles.resumenFila}>
              <Text style={styles.resumenLabel}>Material:</Text>
              <Text style={styles.resumenValor} numberOfLines={1}>
                {valeData.vale_renta_detalle?.[0]?.material?.material || "N/A"}
              </Text>
            </View>
          </View>
        )}

        {errorMensaje && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={16}
              color={colors.danger}
            />
            <Text style={styles.errorTexto}>{errorMensaje}</Text>
          </View>
        )}

        {/* Solo mostrar botón de Bluetooth si está habilitado */}
        {BLUETOOTH_ENABLED ? (
          <TouchableOpacity
            style={styles.botonPrimario}
            onPress={handleBuscarImpresoras}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="bluetooth"
              size={20}
              color={colors.surface}
            />
            <Text style={styles.botonPrimarioTexto}>Buscar impresoras</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.bluetoothDeshabilitado}>
            <MaterialCommunityIcons
              name="bluetooth-off"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.bluetoothDeshabilitadoTexto}>
              Impresión Bluetooth no disponible en este entorno
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.botonSinImpresora}
          onPress={handleSinImpresora}
          activeOpacity={0.7}
        >
          <Text style={styles.botonSinImpresoraTexto}>
            No tengo impresora disponible
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // onRequestClose vacío — el modal es obligatorio, no se cierra con botón atrás
      onRequestClose={() => {
        console.log(
          "[ModalImprimirTicketRenta] Intento de cerrar con botón atrás — bloqueado",
        );
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.contenedor}>
          {/* Header — sin botón de cerrar */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="printer-pos"
              size={22}
              color={colors.secondary}
            />
            <Text style={styles.headerTitulo}>Ticket Físico</Text>
          </View>

          {/* Separador */}
          <View style={styles.separador} />

          {/* Contenido según fase */}
          {renderContenido()}
        </View>
      </View>
    </Modal>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  contenedor: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  separador: {
    height: 1,
    backgroundColor: colors.border || "#E5E7EB",
    marginHorizontal: 20,
  },

  // ─── Fase: inicio ───────────────────────────────────────────────────────────
  inicioContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  iconoPrincipal: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  inicioTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  inicioSubtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  resumenVale: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  resumenFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resumenLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  resumenValor: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },

  // ─── Fase: estado genérico (escaneando / imprimiendo) ───────────────────────
  estadoContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
    alignItems: "center",
    gap: 16,
  },
  estadoTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  estadoSubtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },

  // ─── Fase: éxito ────────────────────────────────────────────────────────────
  exitoIcono: {
    marginBottom: 4,
  },
  exitoTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.accent,
    textAlign: "center",
  },

  // ─── Fase: lista ────────────────────────────────────────────────────────────
  listaContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listaLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  flatList: {
    maxHeight: 200,
  },
  impresoraItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  impresoraItemDisabled: {
    opacity: 0.5,
  },
  impresoraInfo: {
    flex: 1,
  },
  impresoraNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  impresoraDireccion: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sinImpresorasContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
  },
  sinImpresorasTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  sinImpresorasSubtexto: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  botonesLista: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    justifyContent: "space-between",
  },

  // ─── Botones ─────────────────────────────────────────────────────────────────
  botonPrimario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    width: "100%",
    marginBottom: 10,
  },
  botonPrimarioTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface,
  },
  botonSecundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    flex: 1,
  },
  botonSecundarioTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.secondary,
  },
  botonPeligro: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.danger || "#E53E3E",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flex: 1,
  },
  botonPeligroTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger || "#E53E3E",
  },
  botonSinImpresora: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  botonSinImpresoraTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  bluetoothDeshabilitado: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    gap: 10,
    width: "100%",
    marginBottom: 10,
  },
  bluetoothDeshabilitadoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },

  // ─── Error ────────────────────────────────────────────────────────────────
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginBottom: 12,
    width: "100%",
  },
  errorTexto: {
    fontSize: 12,
    color: colors.danger || "#E53E3E",
    flex: 1,
    lineHeight: 16,
  },
});

export default ModalImprimirTicketRenta;
