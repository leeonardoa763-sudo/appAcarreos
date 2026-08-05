// 1. React y hooks
import React, { useEffect, useState } from "react";

// 2. React Native
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Config
import { colors } from "../../config/colors";

// 5. Hooks y utilidades
import {
  CODIGO_MOTIVO_OTRO,
  MOTIVO_TEXTO_MIN,
  motivoEsValido,
} from "../../utils/tiempoEntreViajes";

/**
 * FormularioMotivo / ModalMotivo
 *
 * Captura del motivo de una excepcion: registrar un viaje antes del tiempo
 * minimo, o completar sin foto de evidencia. Chips con los casos comunes mas
 * texto libre, que solo es obligatorio al elegir "Otro" — en campo, exigir
 * texto siempre se traduce en motivos como "x".
 *
 * Se exportan dos piezas a proposito:
 * - FormularioMotivo: solo el contenido, para incrustarlo DENTRO de un Modal
 *   que ya esta abierto (Android no apila dos <Modal> de forma confiable —
 *   ver componets/CLAUDE.md). Lo usa ModalEvidenciaViaje.
 * - ModalMotivo (default): el mismo contenido con su propio <Modal>, para
 *   cuando no hay ninguno abierto.
 */
export const FormularioMotivo = ({
  titulo,
  mensaje,
  icono = "alert-circle-outline",
  motivos = [],
  textoConfirmar = "Continuar",
  textoCancelar = "Cancelar",
  confirmando = false,
  onConfirmar,
  onCancelar,
}) => {
  const [codigo, setCodigo] = useState(null);
  const [texto, setTexto] = useState("");

  const motivo = { codigo, texto };
  const valido = motivoEsValido(motivo);
  const exigeTexto = codigo === CODIGO_MOTIVO_OTRO;
  const faltanCaracteres = MOTIVO_TEXTO_MIN - texto.trim().length;

  return (
    <View style={styles.contenido}>
      <View style={styles.header}>
        <MaterialCommunityIcons name={icono} size={22} color={colors.primary} />
        <Text style={styles.titulo}>{titulo}</Text>
      </View>

      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

      <ScrollView
        style={styles.listaMotivos}
        keyboardShouldPersistTaps="handled"
      >
        {motivos.map((opcion) => {
          const seleccionado = codigo === opcion.codigo;
          return (
            <TouchableOpacity
              key={opcion.codigo}
              style={[styles.chip, seleccionado && styles.chipSeleccionado]}
              onPress={() => setCodigo(opcion.codigo)}
              disabled={confirmando}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={
                  seleccionado
                    ? "radiobox-marked"
                    : "radiobox-blank"
                }
                size={18}
                color={seleccionado ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.chipTexto,
                  seleccionado && styles.chipTextoSeleccionado,
                ]}
              >
                {opcion.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.labelTexto}>
        {exigeTexto ? "Describe el motivo (obligatorio)" : "Comentario (opcional)"}
      </Text>
      <TextInput
        style={styles.input}
        value={texto}
        onChangeText={setTexto}
        placeholder={
          exigeTexto ? "Explica por que se hace esta excepcion" : ""
        }
        placeholderTextColor={colors.input.placeholder}
        multiline
        maxLength={300}
        editable={!confirmando}
      />

      {exigeTexto && faltanCaracteres > 0 && (
        <Text style={styles.ayudaTexto}>
          Faltan {faltanCaracteres} caracteres
        </Text>
      )}

      <View style={styles.botones}>
        <TouchableOpacity
          style={styles.botonCancelar}
          onPress={onCancelar}
          disabled={confirmando}
          activeOpacity={0.7}
        >
          <Text style={styles.botonCancelarTexto}>{textoCancelar}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botonConfirmar,
            (!valido || confirmando) && styles.botonDeshabilitado,
          ]}
          onPress={() => onConfirmar({ codigo, texto: texto.trim() })}
          disabled={!valido || confirmando}
          activeOpacity={0.8}
        >
          {confirmando ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text
              style={[
                styles.botonConfirmarTexto,
                !valido && styles.botonConfirmarTextoDeshabilitado,
              ]}
            >
              {textoConfirmar}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ModalMotivo = ({ visible, onCancelar, ...props }) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent
    onRequestClose={onCancelar}
  >
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <ModalMotivoCuerpo
          visible={visible}
          onCancelar={onCancelar}
          {...props}
        />
      </View>
    </View>
  </Modal>
);

/**
 * Remonta el formulario cada vez que el modal se abre, para que no arrastre el
 * motivo elegido la vez anterior.
 */
const ModalMotivoCuerpo = ({ visible, ...props }) => {
  const [llave, setLlave] = useState(0);
  useEffect(() => {
    if (visible) setLlave((n) => n + 1);
  }, [visible]);
  return <FormularioMotivo key={llave} {...props} />;
};

export default ModalMotivo;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  contenido: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titulo: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  mensaje: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  listaMotivos: {
    maxHeight: 220,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  chipSeleccionado: {
    borderColor: colors.primary,
    backgroundColor: "#FFF3EE",
  },
  chipTexto: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipTextoSeleccionado: {
    fontWeight: "600",
  },
  labelTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 10,
    backgroundColor: colors.input.background,
    color: colors.input.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 70,
    fontSize: 14,
    textAlignVertical: "top",
  },
  ayudaTexto: {
    fontSize: 12,
    color: colors.danger,
  },
  botones: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  botonCancelar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  botonCancelarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  botonConfirmar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  botonDeshabilitado: {
    backgroundColor: "#C8CDD6",
  },
  botonConfirmarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
  botonConfirmarTextoDeshabilitado: {
    color: colors.textSecondary,
  },
});
