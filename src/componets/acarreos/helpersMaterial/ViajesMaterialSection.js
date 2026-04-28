/**
 * components/acarreos/helpersMaterial/ViajesMaterialSection.js
 *
 * Sección de viajes para vales de MATERIAL.
 * Análogo a ViajesRentaSection pero con:
 * - Formulario de captura por tipo (peso ton / m³ directo / folio físico)
 * - Muestra m³ y costo por viaje en cada fila
 * - Modal de impresión de ticket después de cada viaje registrado
 *
 * PROPS:
 * - vale: object — datos completos del vale
 * - detalle: object — vale_material_detalles[0]
 * - viajes: array
 * - loading: boolean
 * - registrando: boolean
 * - totalViajes: number
 * - onRegistrarViaje: function({ pesoTon, volumenDirecto, folioValeFisico }) => Promise<viaje|false>
 * - tipoMaterial: number — 1, 2 o 3
 */

// 1. React
import React, { useState, useCallback } from "react";

// 2. React Native
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";
// 4. Local - Config
import { colors } from "../../../config/colors";
import { BLUETOOTH_ENABLED } from "../../../config/features";

// 5. Local - Componentes
import FormInput from "../../forms/FormInput";
import ModalImprimirTicketRenta from "../rentaHelpers/ModalImprimirTicketRenta";
import ValeFormCompletarNormal from "./ValeFormCompletarNormal";
import ModalEvidenciaViaje from "./ModalEvidenciaViaje";

// 6. Imports condicionales Bluetooth
let generarTicketMaterialViaje;
if (BLUETOOTH_ENABLED) {
  const tg = require("../../../services/ticketGenerator");
  generarTicketMaterialViaje = tg.generarTicketMaterialViaje;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatHora = (isoString) => {
  if (!isoString) return "--:--";
  return new Date(isoString).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatCosto = (costo) => {
  if (!costo) return null;
  return `$${parseFloat(costo).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
// ─── DEBUG temporal: visualiza el ticket en consola ───────────────────────────

const debugTicketEnConsola = (vale, detalle, viaje) => {
  if (!generarTicketMaterialViaje) {
    return;
  }
  const lineas = generarTicketMaterialViaje(vale, detalle, viaje);
  const SEP_DOBLE = "══════════════════════════════════";
  const SEP_SIMPLE = "──────────────────────────────────";

  lineas.forEach((linea) => {
    if (linea.tipo === "separador") {
    } else if (linea.tipo === "texto") {
      const contenido = linea.contenido.trimEnd();
      const bold = linea.opciones?.bold ? "★ " : "  ";
      const align = linea.opciones?.align;
      if (align === "center") {
      } else {
      }
    } else if (linea.tipo === "qr") {
    }
  });

  // Resumen de campos para detectar N/A
  const detalleCampos = {
    empresa: vale?.obras?.empresas?.empresa,
    obra: vale?.obras?.obra,
    cc: vale?.obras?.cc,
    operador: vale?.operadores?.nombre_completo,
    placas: vale?.vehiculos?.placas,
    material: detalle?.material?.material,
    banco: detalle?.bancos?.banco,
    distancia_km: detalle?.distancia_km,
    capacidad_m3: vale?.vehiculos?.capacidad_m3 ?? detalle?.capacidad_m3,
    volumen_m3: viaje?.volumen_m3,
    peso_ton: viaje?.peso_ton,
    folio_vale_fisico: viaje?.folio_vale_fisico,
    costo_viaje: viaje?.costo_viaje,
    folio: vale?.folio,
    qr_url: vale?.qr_verification_url,
  };

  const faltantes = Object.entries(detalleCampos)
    .filter(([, v]) => v == null || v === "")
    .map(([k]) => k);

  if (faltantes.length > 0) {
    console.warn("[TICKET DEBUG] Campos vacios/null:", faltantes.join(", "));
  } else {
  }
};

// ─── ViajeItem ────────────────────────────────────────────────────────────────

const ViajeItem = ({ viaje, detalle, esTipo3, esChecador, onTomarFoto }) => {
  // Resolver valores efectivos: override tiene prioridad
  const bancoEfectivo =
    viaje.bancos_override?.banco ?? detalle?.bancos?.banco ?? "—";
  const costoEfectivo = viaje.costo_viaje_override ?? viaje.costo_viaje;
  const precioEfectivo = viaje.precio_m3_override ?? viaje.precio_m3;
  const distanciaEfectiva =
    viaje.distancia_km_override ?? detalle?.distancia_km;

  return (
    <View style={styles.viajeItem}>
      <View style={styles.viajeIcono}>
        <MaterialCommunityIcons
          name="truck-check"
          size={16}
          color={colors.accent}
        />
      </View>

      <View style={styles.viajeInfo}>
        <Text style={styles.viajeNumero}>Viaje {viaje.numero_viaje}</Text>
        <Text style={styles.viajeHora}>{formatHora(viaje.hora_registro)}</Text>
        {viaje.folio_vale_fisico ? (
          <Text style={styles.viajeFolio}>Rem. {viaje.folio_vale_fisico}</Text>
        ) : null}
        <Text style={styles.viajeBanco}>{bancoEfectivo}</Text>
      </View>

      <View style={styles.viajeMetrics}>
        <Text style={styles.viajeM3}>
          {viaje.volumen_m3
            ? `${parseFloat(viaje.volumen_m3).toFixed(2)} m³`
            : "—"}
        </Text>
        {!esTipo3 && viaje.peso_ton != null && (
          <Text style={styles.viajeTon}>
            {parseFloat(viaje.peso_ton).toFixed(2)} ton
          </Text>
        )}
        {!esChecador && costoEfectivo != null && (
          <Text style={styles.viajeCosto}>{formatCosto(costoEfectivo)}</Text>
        )}
      </View>

      {/* Botón fallback: solo visible cuando el viaje no tiene foto */}
      {onTomarFoto && !viaje.foto_evidencia_url && (
        <TouchableOpacity
          style={styles.botonFotoFallback}
          onPress={onTomarFoto}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="camera-plus"
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Formulario de captura por tipo ───────────────────────────────────────────
const FormularioViaje = ({
  tipoMaterial,
  valores,
  onChange,
  disabled,
  capacidadVehiculo,
}) => {
  if (tipoMaterial === 3) {
    return (
      <View style={styles.formulario}>
        <FormInput
          label="Capacidad del viaje"
          value={valores.volumenDirecto}
          onChangeText={() => {}}
          placeholder={capacidadVehiculo ? `${capacidadVehiculo}` : "Ej: 8.5"}
          keyboardType="numeric"
          suffix="m³"
          disabled={true}
          editable={false}
        />
        <Text style={styles.campoFijoTexto}>
          Capacidad fija del vehiculo. No editable.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.formulario}>
      <FormInput
        label="Peso del viaje"
        value={valores.pesoTon}
        onChangeText={(v) => onChange({ ...valores, pesoTon: v })}
        placeholder="Ej: 14.2"
        keyboardType="numeric"
        suffix="ton"
        disabled={disabled}
      />

      <FormInput
        label="Folio de Remisión"
        value={valores.folioValeFisico}
        onChangeText={(v) =>
          onChange({ ...valores, folioValeFisico: v.replace(/[^0-9]/g, "") })
        }
        placeholder="Ej: 12345"
        keyboardType="number-pad"
        disabled={disabled}
      />
    </View>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const ViajesMaterialSection = ({
  vale,
  detalle,
  viajes,
  loading,
  registrando,
  totalViajes,
  totalTickets = 0,
  onRegistrarViaje,
  puedeRegistrar,
  minutosRestantes,
  tipoMaterial,
  onCompletar,
  saving,
  obraData,
  actualizarFotoViaje,
  notasAdicionales,
  setNotasAdicionales,
  cantidadConfirmada,
  setCantidadConfirmada,
  esChecador,
}) => {
  const esTipo3 = tipoMaterial === 3;

  const capacidadVehiculo =
    vale?.vehiculos?.capacidad_m3?.toString() ??
    detalle?.capacidad_m3?.toString() ??
    "";

  const valorInicialForm = {
    pesoTon: "",
    volumenDirecto: esTipo3 ? capacidadVehiculo : "",
    folioValeFisico: "",
  };

  const [valores, setValores] = useState(valorInicialForm);
  const [viajeParaImprimir, setViajeParaImprimir] = useState(null);
  const [viajeParaFoto, setViajeParaFoto] = useState(null);

  // ─── Validar formulario antes de registrar ────────────────────────────────

  const validarFormulario = useCallback(() => {
    if (esTipo3) {
      const vol = parseFloat(valores.volumenDirecto);
      if (!valores.volumenDirecto || isNaN(vol) || vol <= 0) {
        Alert.alert("Campo requerido", "Ingresa el volumen del viaje en m³.");
        return false;
      }
    } else {
      const peso = parseFloat(valores.pesoTon);
      if (!valores.pesoTon || isNaN(peso) || peso <= 0) {
        Alert.alert(
          "Campo requerido",
          "Ingresa el peso del viaje en toneladas.",
        );
        return false;
      }
      if (peso > 200) {
        Alert.alert(
          "Peso inválido",
          "El peso no puede ser superior a 200 toneladas.",
        );
        return false;
      }
      if (!valores.folioValeFisico || valores.folioValeFisico.trim() === "") {
        Alert.alert("Campo requerido", "Ingresa el folio de remisión.");
        return false;
      }
    }
    return true;
  }, [esTipo3, valores]);

  const tieneTicketPendiente = totalTickets > totalViajes;

  // ─── Manejar registro de viaje ────────────────────────────────────────────

  const handleRegistrar = useCallback(async () => {
    if (!tieneTicketPendiente) {
      Alert.alert(
        "Ticket requerido",
        "Debes imprimir el ticket antes de registrar el viaje.",
        [{ text: "Entendido" }],
      );
      return;
    }
    if (!validarFormulario()) return;

    const resultado = await onRegistrarViaje({
      pesoTon: esTipo3 ? null : valores.pesoTon,
      volumenDirecto: esTipo3 ? valores.volumenDirecto : null,
      folioValeFisico: valores.folioValeFisico || null,
    });

    if (resultado) {
      setValores({
        pesoTon: "",
        volumenDirecto: esTipo3 ? capacidadVehiculo : "",
        folioValeFisico: "",
      });
      debugTicketEnConsola(vale, detalle, resultado);
      setViajeParaFoto(resultado);
    }
  }, [validarFormulario, onRegistrarViaje, esTipo3, valores, tieneTicketPendiente]);

  const handleFotoGuardada = useCallback(
    async (idViaje, fotoUrl, ubicacion, distanciaObra) => {
      setViajeParaFoto(null);
      if (fotoUrl && actualizarFotoViaje) {
        await actualizarFotoViaje(
          idViaje,
          fotoUrl,
          ubicacion?.latitud ?? null,
          ubicacion?.longitud ?? null,
          distanciaObra ?? null,
        );
      }
    },
    [actualizarFotoViaje],
  );

  // ─── Generar líneas del ticket por viaje ─────────────────────────────────

  const generarLineasTicketViaje = useCallback(() => {
    if (!vale || !detalle || !viajeParaImprimir) return [];
    if (!generarTicketMaterialViaje) return [];
  }, [vale, detalle, viajeParaImprimir]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="truck-fast"
          size={20}
          color={colors.secondary}
        />
        <Text style={styles.titulo}>Viajes Registrados</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>{totalViajes}</Text>
        </View>
      </View>

      {/* Lista o estado vacío */}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.loader}
        />
      ) : viajes.length === 0 ? (
        <View style={styles.sinViajes}>
          <MaterialCommunityIcons
            name="truck-outline"
            size={32}
            color={colors.textSecondary}
          />
          <Text style={styles.sinViajesTexto}>Sin viajes registrados</Text>
        </View>
      ) : (
        <>
          {/* Encabezado de columnas */}
          <View style={styles.tablaHeader}>
            <Text style={[styles.tablaHeaderTexto, { flex: 1 }]}>Viaje</Text>
            <Text
              style={[
                styles.tablaHeaderTexto,
                { width: 90, textAlign: "right" },
              ]}
            >
              m³ / Costo
            </Text>
          </View>

          <View style={styles.lista}>
            {viajes.map((viaje) => (
              <ViajeItem
                key={viaje.id_viaje}
                viaje={viaje}
                detalle={detalle}
                esTipo3={esTipo3}
                esChecador={esChecador}
                onTomarFoto={
                  actualizarFotoViaje
                    ? () => setViajeParaFoto(viaje)
                    : undefined
                }
              />
            ))}
          </View>
        </>
      )}

      {/* Formulario de captura */}
      <FormularioViaje
        tipoMaterial={tipoMaterial}
        valores={valores}
        onChange={setValores}
        disabled={registrando}
        capacidadVehiculo={capacidadVehiculo}
      />

      {/* Botón registrar */}
      {(() => {
        const botonActivo = puedeRegistrar && tieneTicketPendiente && !registrando;
        const labelViaje =
          totalViajes === 0
            ? "Registrar Primer Viaje"
            : `Registrar Viaje ${totalViajes + 1}`;
        return (
          <TouchableOpacity
            style={[
              styles.botonRegistrar,
              !botonActivo && styles.botonDeshabilitado,
            ]}
            onPress={handleRegistrar}
            disabled={registrando}
            activeOpacity={0.8}
          >
            {registrando ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={20}
                  color={botonActivo ? colors.surface : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.botonTexto,
                    !botonActivo && { color: colors.textSecondary },
                  ]}
                >
                  {labelViaje}
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      })()}
      {!tieneTicketPendiente && (
        <Text style={styles.avisoTicket}>
          Imprime el ticket antes de registrar el siguiente viaje
        </Text>
      )}
      {tieneTicketPendiente && !puedeRegistrar && (
        <Text style={styles.avisoTicket}>
          Espera {minutosRestantes} min antes del siguiente viaje
        </Text>
      )}
      {/* Formulario de completar — tipo 1/2 */}
      {!esTipo3 && (
        <ValeFormCompletarNormal
          notasAdicionales={notasAdicionales}
          onChangeNotas={setNotasAdicionales}
          savingToneladas={saving}
          onCompletar={onCompletar}
        />
      )}

      {/* Completar vale — tipo 3 */}
      {esTipo3 && (
        <ValeFormCompletarNormal
          notasAdicionales={notasAdicionales}
          onChangeNotas={setNotasAdicionales}
          savingToneladas={saving}
          onCompletar={onCompletar}
        />
      )}

      {/* Modal de foto obligatoria por viaje */}
      <ModalEvidenciaViaje
        visible={!!viajeParaFoto}
        viaje={viajeParaFoto}
        folioVale={vale?.folio}
        obraData={obraData}
        onFotoGuardada={handleFotoGuardada}
      />
    </View>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8EAF0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  titulo: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  badgeTexto: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  loader: {
    paddingVertical: 20,
  },
  sinViajes: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  sinViajesTexto: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tablaHeader: {
    flexDirection: "row",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  tablaHeaderTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  lista: {
    marginBottom: 16,
    gap: 6,
  },
  viajeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  viajeIcono: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  viajeInfo: {
    flex: 1,
  },
  viajeNumero: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  viajeHora: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  viajeFolio: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 2,
  },

  viajeBanco: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 2,
  },
  viajeCostoOverride: {
    color: colors.primary,
  },
  viajeMetrics: {
    alignItems: "flex-end",
    gap: 2,
  },
  viajeM3: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.secondary,
  },
  viajeTon: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  viajeCosto: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent,
  },
  formulario: {
    marginBottom: 12,
    gap: 4,
  },
  botonRegistrar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  botonDeshabilitado: {
    backgroundColor: "#E8EAF0",
  },
  botonTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface,
  },
  campoFijoTexto: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: -8,
    marginLeft: 2,
    fontStyle: "italic",
  },
  botonFotoFallback: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFF0EA",
    alignItems: "center",
    justifyContent: "center",
  },
  avisoTicket: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});

export default ViajesMaterialSection;
