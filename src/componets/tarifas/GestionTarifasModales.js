// src/componets/tarifas/GestionTarifasModales.js
// Formularios de captura de la TARIFA DE OBRA. Las tarifas por defecto del
// sindicato no se editan desde aqui — solo se usan para precargar el formulario.
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { estilosTarifas as estilos } from "./gestionTarifasStyles";

// Android no ofrece "numbers-and-punctuation"; con "numeric" al menos evita el
// teclado completo y sigue permitiendo el punto decimal.
const TECLADO_DECIMAL =
  Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric";

const aTexto = (valor) => (valor === null || valor === undefined ? "" : String(valor));

/** null cuando el campo esta vacio: en limite_int* significa "sin limite". */
const aNumero = (texto) => (texto.trim() ? parseFloat(texto) : null);

const esDecimalValido = (texto) => /^\d+(\.\d+)?$/.test(texto.trim());

function CajaError({ mensaje }) {
  if (!mensaje) return null;
  return (
    <View style={estilos.errorCaja}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={17}
        color={colors.danger}
      />
      <Text style={estilos.errorCajaTexto}>{mensaje}</Text>
    </View>
  );
}

function PieModal({ guardando, onCerrar, onGuardar }) {
  return (
    <View style={estilos.modalPie}>
      <TouchableOpacity
        style={estilos.btnCancelar}
        onPress={onCerrar}
        disabled={guardando}
      >
        <Text style={estilos.btnCancelarTexto}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          estilos.btnGuardar,
          guardando && estilos.btnGuardarDeshabilitado,
        ]}
        onPress={onGuardar}
        disabled={guardando}
      >
        {guardando ? (
          <ActivityIndicator size="small" color={colors.surface} />
        ) : (
          <Text style={estilos.btnGuardarTexto}>Guardar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function Campo({ etiqueta, ayuda, valor, onCambiar, placeholder }) {
  return (
    <View style={estilos.campoMitad}>
      <Text style={estilos.campoEtiqueta}>{etiqueta}</Text>
      <TextInput
        style={estilos.input}
        value={valor}
        onChangeText={onCambiar}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={TECLADO_DECIMAL}
      />
      {!!ayuda && <Text style={estilos.campoAyuda}>{ayuda}</Text>}
    </View>
  );
}

/**
 * Tarifa de material por obra. Mismos campos que precios_material: el motor de
 * intervalos (calcularPrecioM3) es el mismo para ambas tablas.
 *
 * @param tarifa   Fila de precios_material_obra a editar, o null para crear
 * @param base     Tarifa por defecto del sindicato, para precargar al crear
 */
export function ModalTarifaMaterialObra({
  visible,
  tarifa,
  base,
  tipoMaterialNombre,
  sindicatoNombre,
  obraNombre,
  onGuardar,
  onCerrar,
}) {
  const esEdicion = !!tarifa;

  const [numIntervalos, setNumIntervalos] = useState("1");
  const [primerKm, setPrimerKm] = useState("");
  const [kmSubInt1, setKmSubInt1] = useState("");
  const [limiteInt1, setLimiteInt1] = useState("");
  const [kmSubInt2, setKmSubInt2] = useState("");
  const [limiteInt2, setLimiteInt2] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!visible) return;
    // Al crear se precarga con el default del sindicato: el admin solo ajusta
    // lo que cambia en esta obra.
    const origen = tarifa ?? base ?? null;
    setNumIntervalos(
      origen?.numero_de_intervalos != null
        ? String(parseInt(origen.numero_de_intervalos, 10))
        : "1",
    );
    setPrimerKm(aTexto(origen?.primer_km));
    setKmSubInt1(aTexto(origen?.km_sub_int1));
    setLimiteInt1(aTexto(origen?.limite_int1));
    setKmSubInt2(aTexto(origen?.km_sub_int2));
    setLimiteInt2(aTexto(origen?.limite_int2));
    setErrMsg("");
    setGuardando(false);
  }, [visible, tarifa, base]);

  const limpiarError = (setter) => (valor) => {
    setter(valor);
    setErrMsg("");
  };

  const dosIntervalos = numIntervalos === "2";

  const validar = () => {
    if (!esDecimalValido(primerKm))
      return "Captura la tarifa del primer km (numero mayor a 0)";
    if (parseFloat(primerKm) <= 0)
      return "La tarifa del primer km debe ser mayor a 0";

    if (!esDecimalValido(kmSubInt1))
      return "Captura la tarifa de km subsecuentes del intervalo 1";

    if (limiteInt1.trim() && !esDecimalValido(limiteInt1))
      return "El limite del intervalo 1 debe ser un numero, o dejarse vacio para sin limite";

    if (dosIntervalos) {
      if (!limiteInt1.trim())
        return "Con 2 intervalos el limite del intervalo 1 es obligatorio: marca donde termina el primero";
      if (!esDecimalValido(kmSubInt2))
        return "Captura la tarifa de km subsecuentes del intervalo 2";
      if (limiteInt2.trim()) {
        if (!esDecimalValido(limiteInt2))
          return "El limite del intervalo 2 debe ser un numero, o dejarse vacio para sin limite";
        if (parseFloat(limiteInt2) <= parseFloat(limiteInt1))
          return "El limite del intervalo 2 debe ser mayor que el del intervalo 1";
      }
    }

    return null;
  };

  const handleGuardar = async () => {
    const problema = validar();
    if (problema) {
      setErrMsg(problema);
      return;
    }

    const datos = {
      numero_de_intervalos: parseInt(numIntervalos, 10),
      primer_km: parseFloat(primerKm),
      km_sub_int1: parseFloat(kmSubInt1),
      limite_int1: aNumero(limiteInt1),
      // Con 1 intervalo los campos del 2 se guardan en null aunque el default
      // del sindicato los trajera: calcularPrecioM3 nunca los mira.
      km_sub_int2: dosIntervalos ? parseFloat(kmSubInt2) : null,
      limite_int2: dosIntervalos ? aNumero(limiteInt2) : null,
    };

    setGuardando(true);
    try {
      await onGuardar(datos);
      onCerrar();
    } catch (e) {
      console.error("[ModalTarifaMaterialObra] Error al guardar:", e);
      setErrMsg(e.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <View style={estilos.overlay}>
        <View style={estilos.caja}>
          <View style={estilos.modalHeader}>
            <MaterialCommunityIcons
              name="dump-truck"
              size={21}
              color={colors.primary}
            />
            <View style={estilos.modalHeaderTextos}>
              <Text style={estilos.modalTitulo}>
                {esEdicion ? "Editar tarifa de obra" : "Nueva tarifa de obra"}
              </Text>
              <Text style={estilos.modalSubtitulo}>
                {tipoMaterialNombre} · {sindicatoNombre} · {obraNombre}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={estilos.modalCuerpo}>
            {!esEdicion && base && (
              <View style={estilos.avisoDefault}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={15}
                  color={colors.textSecondary}
                />
                <Text style={estilos.avisoDefaultTexto}>
                  Los campos vienen precargados con la tarifa por defecto del
                  sindicato. Ajusta solo lo que cambia en esta obra.
                </Text>
              </View>
            )}

            <View style={estilos.campo}>
              <Text style={estilos.campoEtiqueta}>Numero de intervalos</Text>
              <View style={estilos.chipsRow}>
                {["1", "2"].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      estilos.chip,
                      numIntervalos === n && estilos.chipActivo,
                    ]}
                    onPress={() => {
                      setNumIntervalos(n);
                      setErrMsg("");
                    }}
                  >
                    <Text
                      style={[
                        estilos.chipTexto,
                        numIntervalos === n && estilos.chipTextoActivo,
                      ]}
                    >
                      {n === "1" ? "1 intervalo" : "2 intervalos"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={estilos.campoAyuda}>
                El precio por m3 se acumula: primer km + km subsecuentes de cada
                intervalo, segun la distancia al banco.
              </Text>
            </View>

            <View style={estilos.campo}>
              <Text style={estilos.campoEtiqueta}>Tarifa del primer km</Text>
              <TextInput
                style={estilos.input}
                value={primerKm}
                onChangeText={limpiarError(setPrimerKm)}
                placeholder="Ej. 11"
                placeholderTextColor={colors.textSecondary}
                keyboardType={TECLADO_DECIMAL}
              />
            </View>

            <View style={estilos.filaCampos}>
              <Campo
                etiqueta="Km subsecuente 1"
                valor={kmSubInt1}
                onCambiar={limpiarError(setKmSubInt1)}
                placeholder="Ej. 6"
              />
              <Campo
                etiqueta="Limite intervalo 1"
                ayuda="Vacio = sin limite"
                valor={limiteInt1}
                onCambiar={limpiarError(setLimiteInt1)}
                placeholder="Ej. 20"
              />
            </View>

            {dosIntervalos && (
              <View style={estilos.filaCampos}>
                <Campo
                  etiqueta="Km subsecuente 2"
                  valor={kmSubInt2}
                  onCambiar={limpiarError(setKmSubInt2)}
                  placeholder="Ej. 5"
                />
                <Campo
                  etiqueta="Limite intervalo 2"
                  ayuda="Vacio = sin limite"
                  valor={limiteInt2}
                  onCambiar={limpiarError(setLimiteInt2)}
                  placeholder="Ej. 40"
                />
              </View>
            )}

            <CajaError mensaje={errMsg} />
          </ScrollView>

          <PieModal
            guardando={guardando}
            onCerrar={onCerrar}
            onGuardar={handleGuardar}
          />
        </View>
      </View>
    </Modal>
  );
}

/**
 * Tarifa de renta por obra. Aplica igual a renta de equipo y a pipas de agua.
 *
 * @param tarifa   Fila de precios_renta_obra a editar, o null para crear
 * @param base     Tarifa por defecto del sindicato, para precargar al crear
 */
export function ModalTarifaRentaObra({
  visible,
  tarifa,
  base,
  sindicatoNombre,
  obraNombre,
  onGuardar,
  onCerrar,
}) {
  const esEdicion = !!tarifa;

  const [costoHr, setCostoHr] = useState("");
  const [costoDia, setCostoDia] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const origen = tarifa ?? base ?? null;
    setCostoHr(aTexto(origen?.costo_hr));
    setCostoDia(aTexto(origen?.costo_dia));
    setErrMsg("");
    setGuardando(false);
  }, [visible, tarifa, base]);

  const limpiarError = (setter) => (valor) => {
    setter(valor);
    setErrMsg("");
  };

  const validar = () => {
    if (costoHr.trim() && !esDecimalValido(costoHr))
      return "El costo por hora debe ser un numero";
    if (costoDia.trim() && !esDecimalValido(costoDia))
      return "El costo por dia debe ser un numero";

    const hr = aNumero(costoHr);
    const dia = aNumero(costoDia);

    // Dejar ambas en 0 facturaria los vales de esta obra en $0
    if (!hr && !dia)
      return "Captura al menos un costo mayor a 0 (por hora o por dia)";

    return null;
  };

  const handleGuardar = async () => {
    const problema = validar();
    if (problema) {
      setErrMsg(problema);
      return;
    }

    setGuardando(true);
    try {
      await onGuardar({
        costo_hr: aNumero(costoHr),
        costo_dia: aNumero(costoDia),
      });
      onCerrar();
    } catch (e) {
      console.error("[ModalTarifaRentaObra] Error al guardar:", e);
      setErrMsg(e.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <View style={estilos.overlay}>
        <View style={estilos.caja}>
          <View style={estilos.modalHeader}>
            <MaterialCommunityIcons
              name="excavator"
              size={21}
              color={colors.primary}
            />
            <View style={estilos.modalHeaderTextos}>
              <Text style={estilos.modalTitulo}>
                {esEdicion ? "Editar tarifa de obra" : "Nueva tarifa de obra"}
              </Text>
              <Text style={estilos.modalSubtitulo}>
                {sindicatoNombre} · {obraNombre}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={estilos.modalCuerpo}>
            {!esEdicion && base && (
              <View style={estilos.avisoDefault}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={15}
                  color={colors.textSecondary}
                />
                <Text style={estilos.avisoDefaultTexto}>
                  Los campos vienen precargados con la tarifa por defecto del
                  sindicato. Ajusta solo lo que cambia en esta obra.
                </Text>
              </View>
            )}

            <View style={estilos.filaCampos}>
              <Campo
                etiqueta="Costo por hora"
                ayuda="Vacio si no aplica"
                valor={costoHr}
                onCambiar={limpiarError(setCostoHr)}
                placeholder="Ej. 850"
              />
              <Campo
                etiqueta="Costo por dia"
                ayuda="Vacio si no aplica"
                valor={costoDia}
                onCambiar={limpiarError(setCostoDia)}
                placeholder="Ej. 6800"
              />
            </View>

            <View style={estilos.avisoDefault}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={15}
                color={colors.textSecondary}
              />
              <Text style={estilos.avisoDefaultTexto}>
                La renta por medio dia se cobra como la mitad del costo por dia.
                Un vale ya creado conserva la tarifa con la que se emitio.
              </Text>
            </View>

            <CajaError mensaje={errMsg} />
          </ScrollView>

          <PieModal
            guardando={guardando}
            onCerrar={onCerrar}
            onGuardar={handleGuardar}
          />
        </View>
      </View>
    </Modal>
  );
}
