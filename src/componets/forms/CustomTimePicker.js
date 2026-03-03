/**
 * CustomTimePicker.js
 *
 * SELECTOR DE FECHA Y HORA PERSONALIZADO - COMPATIBLE CON TODOS LOS DISPOSITIVOS
 *
 * PROPÓSITO:
 * - Reemplazo del DateTimePicker que da problemas en diferentes dispositivos
 * - Modal con selector de fecha (cuando allowFutureDates=true) + 3 scrolls de hora
 * - Diseño consistente en iOS y Android
 *
 * PROPS:
 * - label: string
 * - value: Date
 * - onChange: function (recibe Date)
 * - enabled / disabled: boolean
 * - error: string
 * - allowFutureDates: boolean - Si true, muestra selector de fecha (hoy en adelante)
 */

import React, { useState, useEffect, useRef } from "react";
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
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

// Genera los próximos N días a partir de hoy
const generarDiasFuturos = (cantidad = 7) => {
  const dias = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (let i = 0; i < cantidad; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    dias.push(fecha);
  }
  return dias;
};

const NOMBRES_DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const NOMBRES_MES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const esMismaFecha = (a, b) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const CustomTimePicker = ({
  label,
  value,
  onChange,
  enabled = true,
  disabled = false,
  error = null,
  allowFutureDates = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const isEnabled = enabled && !disabled;

  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("AM");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  const diasFuturos = generarDiasFuturos(7);
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ["AM", "PM"];

  // Formatea la fecha y hora para mostrar en el botón
  const formatDisplay = (date) => {
    if (!date) return "Seleccionar fecha y hora";

    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    const displayM = m < 10 ? `0${m}` : m;
    const timeStr = `${displayH}:${displayM} ${ampm}`;

    if (!allowFutureDates) return timeStr;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVal = new Date(date);
    fechaVal.setHours(0, 0, 0, 0);
    const diffDias = Math.round((fechaVal - hoy) / (1000 * 60 * 60 * 24));

    let fechaStr;
    if (diffDias === 0) fechaStr = "Hoy";
    else if (diffDias === 1) fechaStr = "Mañana";
    else
      fechaStr = `${NOMBRES_DIA[date.getDay()]} ${date.getDate()} ${NOMBRES_MES[date.getMonth()]}`;

    return `${fechaStr}, ${timeStr}`;
  };

  // Sincronizar estado interno al abrir
  useEffect(() => {
    if (showModal) {
      const base = value ?? new Date();
      const h = base.getHours();
      const m = base.getMinutes();
      const period = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;

      setSelectedHour(hour12);
      setSelectedMinute(m);
      setSelectedPeriod(period);

      if (allowFutureDates) {
        const fechaBase = new Date(base);
        fechaBase.setHours(0, 0, 0, 0);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        // Solo pre-seleccionar si es hoy o futuro
        if (fechaBase >= hoy) {
          setSelectedDate(fechaBase);
        } else {
          setSelectedDate(hoy);
        }
      }

      setTimeout(() => {
        hourListRef.current?.scrollToIndex({
          index: hour12 - 1,
          animated: true,
          viewPosition: 0.5,
        });
        minuteListRef.current?.scrollToIndex({
          index: m,
          animated: true,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, [showModal]);

  const openModal = () => {
    if (isEnabled) setShowModal(true);
  };

  const handleConfirm = () => {
    let hour24 = selectedHour;
    if (selectedPeriod === "PM" && selectedHour !== 12)
      hour24 = selectedHour + 12;
    else if (selectedPeriod === "AM" && selectedHour === 12) hour24 = 0;

    let newDate;
    if (allowFutureDates) {
      // Combinar fecha seleccionada + hora seleccionada
      newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hour24,
        selectedMinute,
        0,
        0,
      );
    } else {
      const hoy = new Date();
      newDate = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate(),
        hour24,
        selectedMinute,
        0,
        0,
      );
    }

    onChange(newDate);
    setShowModal(false);
  };

  const renderHourItem = ({ item }) => {
    const isSelected = item === selectedHour;
    return (
      <TouchableOpacity
        style={[styles.timeItem, isSelected && styles.timeItemSelected]}
        onPress={() => setSelectedHour(item)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.timeItemText,
            isSelected && styles.timeItemTextSelected,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMinuteItem = ({ item }) => {
    const isSelected = item === selectedMinute;
    const displayValue = item < 10 ? `0${item}` : `${item}`;
    return (
      <TouchableOpacity
        style={[styles.timeItem, isSelected && styles.timeItemSelected]}
        onPress={() => setSelectedMinute(item)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.timeItemText,
            isSelected && styles.timeItemTextSelected,
          ]}
        >
          {displayValue}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPeriodItem = ({ item }) => {
    const isSelected = item === selectedPeriod;
    return (
      <TouchableOpacity
        style={[styles.timeItem, isSelected && styles.timeItemSelected]}
        onPress={() => setSelectedPeriod(item)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.timeItemText,
            isSelected && styles.timeItemTextSelected,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  // Preview de la selección actual en el modal
  const getPreviewText = () => {
    const displayM =
      selectedMinute < 10 ? `0${selectedMinute}` : selectedMinute;
    const timeStr = `${selectedHour}:${displayM} ${selectedPeriod}`;

    if (!allowFutureDates) return timeStr;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffDias = Math.round((selectedDate - hoy) / (1000 * 60 * 60 * 24));

    let fechaStr;
    if (diffDias === 0) fechaStr = "Hoy";
    else if (diffDias === 1) fechaStr = "Mañana";
    else
      fechaStr = `${NOMBRES_DIA[selectedDate.getDay()]} ${selectedDate.getDate()}`;

    return `${fechaStr}, ${timeStr}`;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.timeButton,
          !isEnabled && styles.timeButtonDisabled,
          error && styles.timeButtonError,
        ]}
        onPress={openModal}
        activeOpacity={isEnabled ? 0.7 : 1}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={allowFutureDates ? "calendar-clock" : "clock-outline"}
            size={20}
            color={isEnabled ? colors.primary : colors.disabled}
          />
        </View>
        <Text
          style={[
            styles.timeText,
            !value && styles.timeTextPlaceholder,
            !isEnabled && styles.timeTextDisabled,
          ]}
        >
          {formatDisplay(value)}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={24}
          color={isEnabled ? colors.textSecondary : colors.disabled}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.safeArea}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowModal(false)}
          >
            <Pressable style={styles.modalContent} onPress={() => {}}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.modalButtonCancel}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {label || "Seleccionar Hora"}
                </Text>
                <TouchableOpacity
                  onPress={handleConfirm}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.modalButtonDone}>Listo</Text>
                </TouchableOpacity>
              </View>

              {/* SELECTOR DE FECHA — solo si allowFutureDates */}
              {allowFutureDates && (
                <View style={styles.datePickerContainer}>
                  <Text style={styles.dateSectionLabel}>Fecha</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateScrollContent}
                  >
                    {diasFuturos.map((dia, index) => {
                      const isSelected = esMismaFecha(dia, selectedDate);
                      const hoy = new Date();
                      hoy.setHours(0, 0, 0, 0);
                      const diffDias = Math.round(
                        (dia - hoy) / (1000 * 60 * 60 * 24),
                      );

                      let etiqueta;
                      if (diffDias === 0) etiqueta = "Hoy";
                      else if (diffDias === 1) etiqueta = "Mañana";
                      else etiqueta = NOMBRES_DIA[dia.getDay()];

                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.dateChip,
                            isSelected && styles.dateChipSelected,
                          ]}
                          onPress={() => {
                            const hoy = new Date();
                            hoy.setHours(0, 0, 0, 0);
                            const esFuturo =
                              Math.round((dia - hoy) / (1000 * 60 * 60 * 24)) >
                              0;
                            setSelectedDate(dia);
                            if (esFuturo) {
                              setSelectedHour(8);
                              setSelectedMinute(0);
                              setSelectedPeriod("AM");
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dateChipLabel,
                              isSelected && styles.dateChipLabelSelected,
                            ]}
                          >
                            {etiqueta}
                          </Text>
                          <Text
                            style={[
                              styles.dateChipNum,
                              isSelected && styles.dateChipNumSelected,
                            ]}
                          >
                            {dia.getDate()}
                          </Text>
                          <Text
                            style={[
                              styles.dateChipMes,
                              isSelected && styles.dateChipMesSelected,
                            ]}
                          >
                            {NOMBRES_MES[dia.getMonth()]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Divisor */}
              {allowFutureDates && <View style={styles.divider} />}

              {/* SELECTORES DE HORA */}
              <View style={styles.pickersContainer}>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Hora</Text>
                  <FlatList
                    ref={hourListRef}
                    data={hours}
                    renderItem={renderHourItem}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerList}
                    getItemLayout={(data, index) => ({
                      length: 50,
                      offset: 50 * index,
                      index,
                    })}
                  />
                </View>

                <Text style={styles.separator}>:</Text>

                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Minuto</Text>
                  <FlatList
                    ref={minuteListRef}
                    data={minutes}
                    renderItem={renderMinuteItem}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerList}
                    getItemLayout={(data, index) => ({
                      length: 50,
                      offset: 50 * index,
                      index,
                    })}
                  />
                </View>

                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Periodo</Text>
                  <FlatList
                    data={periods}
                    renderItem={renderPeriodItem}
                    keyExtractor={(item) => item}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerList}
                  />
                </View>
              </View>

              {/* Preview */}
              <View style={styles.previewContainer}>
                <MaterialCommunityIcons
                  name="clock-check-outline"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.previewText}>{getPreviewText()}</Text>
              </View>
            </Pressable>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default CustomTimePicker;

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

  timeButton: {
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
  timeButtonDisabled: {
    backgroundColor: colors.input.disabled,
  },
  timeButtonError: {
    borderColor: colors.danger,
  },
  iconContainer: {
    marginRight: 10,
  },
  timeText: {
    flex: 1,
    fontSize: 16,
    color: colors.input.text,
  },
  timeTextPlaceholder: {
    color: colors.input.placeholder,
  },
  timeTextDisabled: {
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
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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

  // Selector de fecha
  datePickerContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  dateSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dateChip: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.input.border,
    backgroundColor: colors.surface,
    minWidth: 60,
  },
  dateChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  dateChipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  dateChipLabelSelected: {
    color: colors.surface,
  },
  dateChipNum: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 28,
  },
  dateChipNumSelected: {
    color: colors.surface,
  },
  dateChipMes: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  dateChipMesSelected: {
    color: `${colors.surface}CC`,
  },

  divider: {
    height: 1,
    backgroundColor: colors.input.border,
    marginHorizontal: 20,
    marginVertical: 8,
  },

  // Selectores de hora
  pickersContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    flex: 1,
  },
  pickerColumn: {
    flex: 1,
    alignItems: "center",
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
  separator: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginHorizontal: 8,
    marginTop: 32,
  },
  timeItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  timeItemSelected: {
    backgroundColor: colors.accent,
  },
  timeItemText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  timeItemTextSelected: {
    color: colors.surface,
    fontWeight: "700",
  },

  // Preview
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
    fontSize: 22,
    fontWeight: "700",
    color: colors.accent,
    marginLeft: 8,
  },
});
