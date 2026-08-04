/**
 * CustomDatePicker.js
 *
 * SELECTOR DE FECHA - MODAL CON COLUMNAS DIA / MES / AÑO
 *
 * PROPOSITO:
 * - Elegir una fecha concreta (filtros de periodo del historial de vales)
 *
 * Mismo criterio que CustomTimePicker: NO se usa @react-native-community/datetimepicker.
 * Al no depender de un modulo nativo, se comporta igual en Android, iOS y en el
 * build web, sin necesidad de una variante .web.js.
 *
 * Las fechas se construyen siempre con el constructor local new Date(a, m, d) —
 * nunca new Date("YYYY-MM-DD"), que se parsea como UTC y en Mexico cae un dia antes.
 *
 * USADO EN:
 * - FiltrosHistorial (periodo por rango de fechas)
 *
 * PROPS:
 * - label: string
 * - value: Date | null
 * - onChange: function (recibe Date)
 * - placeholder: string
 * - enabled: boolean
 * - error: string
 * - minimumDate / maximumDate: Date | null - acotan el rango de años ofrecido
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  Platform,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Dias reales del mes. El dia 0 del mes siguiente es el ultimo del actual. */
const diasDelMes = (anio, mes) => new Date(anio, mes + 1, 0).getDate();

const CustomDatePicker = ({
  label,
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  enabled = true,
  error = null,
  minimumDate = null,
  maximumDate = null,
}) => {
  const [showModal, setShowModal] = useState(false);

  const hoy = new Date();
  const [dia, setDia] = useState(hoy.getDate());
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const anioMin = minimumDate ? minimumDate.getFullYear() : hoy.getFullYear() - 5;
  const anioMax = maximumDate ? maximumDate.getFullYear() : hoy.getFullYear();
  const anios = Array.from(
    { length: Math.max(1, anioMax - anioMin + 1) },
    (_, i) => anioMax - i,
  );

  // Sincronizar las columnas con el valor actual al abrir
  useEffect(() => {
    if (!showModal) return;
    const base = value ?? new Date();
    setDia(base.getDate());
    setMes(base.getMonth());
    setAnio(base.getFullYear());
  }, [showModal]);

  // Si el mes o el año cambian a uno mas corto, recortar el dia (31 -> 30/28)
  useEffect(() => {
    const maximo = diasDelMes(anio, mes);
    if (dia > maximo) setDia(maximo);
  }, [mes, anio]);

  const dias = Array.from({ length: diasDelMes(anio, mes) }, (_, i) => i + 1);

  const formatDisplay = (fecha) => {
    if (!fecha) return placeholder;
    return `${String(fecha.getDate()).padStart(2, "0")} / ${
      MESES[fecha.getMonth()]
    } / ${fecha.getFullYear()}`;
  };

  const handleConfirm = () => {
    onChange(new Date(anio, mes, dia));
    setShowModal(false);
  };

  const renderColumnaItem = (item, etiqueta, seleccionado, onPress) => (
    <TouchableOpacity
      style={[styles.item, seleccionado && styles.itemSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.itemText, seleccionado && styles.itemTextSelected]}>
        {etiqueta}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.button,
          !enabled && styles.buttonDisabled,
          error && styles.buttonError,
        ]}
        onPress={() => enabled && setShowModal(true)}
        activeOpacity={enabled ? 0.7 : 1}
      >
        <MaterialCommunityIcons
          name="calendar"
          size={20}
          color={enabled ? colors.primary : colors.disabled}
          style={styles.icon}
        />
        <Text
          style={[
            styles.buttonText,
            !value && styles.buttonTextPlaceholder,
            !enabled && styles.buttonTextDisabled,
          ]}
        >
          {formatDisplay(value)}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={24}
          color={enabled ? colors.textSecondary : colors.disabled}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.safeArea}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowModal(false)}
          >
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.modalButtonCancel}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {label || "Seleccionar Fecha"}
                </Text>
                <TouchableOpacity
                  onPress={handleConfirm}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.modalButtonDone}>Listo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickersContainer}>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Dia</Text>
                  <FlatList
                    data={dias}
                    keyExtractor={(item) => `d-${item}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerList}
                    renderItem={({ item }) =>
                      renderColumnaItem(item, String(item), item === dia, () =>
                        setDia(item),
                      )
                    }
                  />
                </View>

                <View style={[styles.pickerColumn, styles.pickerColumnMes]}>
                  <Text style={styles.pickerLabel}>Mes</Text>
                  <FlatList
                    data={MESES}
                    keyExtractor={(item) => `m-${item}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerList}
                    renderItem={({ item, index }) =>
                      renderColumnaItem(index, item, index === mes, () =>
                        setMes(index),
                      )
                    }
                  />
                </View>

                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Año</Text>
                  <FlatList
                    data={anios}
                    keyExtractor={(item) => `a-${item}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerList}
                    renderItem={({ item }) =>
                      renderColumnaItem(item, String(item), item === anio, () =>
                        setAnio(item),
                      )
                    }
                  />
                </View>
              </View>

              <View style={styles.previewContainer}>
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.previewText}>
                  {formatDisplay(new Date(anio, mes, dia))}
                </Text>
              </View>
            </Pressable>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default CustomDatePicker;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 6,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 50,
  },
  buttonDisabled: {
    backgroundColor: colors.input.disabled,
  },
  buttonError: {
    borderColor: colors.danger,
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    color: colors.input.text,
  },
  buttonTextPlaceholder: {
    color: colors.input.placeholder,
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Platform.OS === "ios" ? "75%" : "80%",
    paddingBottom: Platform.OS === "ios" ? 0 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.input.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  modalButtonCancel: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: "500",
  },
  modalButtonDone: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },

  pickersContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    flex: 1,
  },
  pickerColumn: {
    flex: 1,
    alignItems: "center",
  },
  pickerColumnMes: {
    flex: 1.4,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 12,
  },
  pickerList: {
    paddingVertical: 8,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
    minWidth: 56,
    alignItems: "center",
  },
  itemSelected: {
    backgroundColor: colors.accent,
  },
  itemText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  itemTextSelected: {
    color: colors.surface,
    fontWeight: "700",
  },

  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: `${colors.accent}15`,
    borderTopWidth: 1,
    borderTopColor: colors.input.border,
    marginTop: 12,
  },
  previewText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
    marginLeft: 8,
  },
});
