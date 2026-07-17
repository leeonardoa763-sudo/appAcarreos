/**
 * CustomTimePicker.js
 *
 * SELECTOR DE HORA PERSONALIZADO - COMPATIBLE CON TODOS LOS DISPOSITIVOS
 *
 * PROPÓSITO:
 * - Reemplazo del DateTimePicker que da problemas en diferentes dispositivos
 * - Modal con 3 scrolls de hora (hora / minuto / periodo)
 * - Diseño consistente en iOS y Android
 *
 * La fecha siempre es el día actual: los vales se crean al momento. El valor
 * emitido combina la fecha de hoy con la hora seleccionada.
 *
 * PROPS:
 * - label: string
 * - value: Date
 * - onChange: function (recibe Date)
 * - enabled / disabled: boolean
 * - error: string
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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const CustomTimePicker = ({
  label,
  value,
  onChange,
  enabled = true,
  disabled = false,
  error = null,
}) => {
  const [showModal, setShowModal] = useState(false);
  const isEnabled = enabled && !disabled;

  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ["AM", "PM"];

  // Formatea la hora para mostrar en el botón
  const formatDisplay = (date) => {
    if (!date) return "Seleccionar hora";

    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    const displayM = m < 10 ? `0${m}` : m;

    return `${displayH}:${displayM} ${ampm}`;
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

    const hoy = new Date();
    const newDate = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
      hour24,
      selectedMinute,
      0,
      0,
    );

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

    return `${selectedHour}:${displayM} ${selectedPeriod}`;
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
            name="clock-outline"
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
