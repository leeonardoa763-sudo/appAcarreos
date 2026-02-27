/**
 * CustomTimePicker.js
 *
 * SELECTOR DE HORA PERSONALIZADO - COMPATIBLE CON TODOS LOS DISPOSITIVOS
 *
 * PROPÓSITO:
 * - Reemplazo del DateTimePicker que da problemas en diferentes dispositivos
 * - Modal con 3 scrolls: Hora (1-12) | Minuto (00-59) | AM/PM
 * - Diseño consistente en iOS y Android
 * - Sin dependencias de componentes nativos problemáticos
 *
 * USADO EN:
 * - ValeRentaScreen (Hora Inicio)
 * - ValeDetalleRenta (Hora Fin)
 *
 * PROPS:
 * - label: string - Texto del label
 * - value: Date - Hora seleccionada
 * - onChange: function - Callback al cambiar hora (recibe Date)
 * - enabled: boolean - Si está habilitado o no
 * - disabled: boolean - Alias de enabled
 * - error: string - Mensaje de error (opcional)
 * - minimumDate: Date - Hora mínima permitida (opcional, no implementado aún)
 * - maximumDate: Date - Hora máxima permitida (opcional, no implementado aún)
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
  minimumDate = null,
  maximumDate = null,
}) => {
  const [showModal, setShowModal] = useState(false);
  const isEnabled = enabled && !disabled;

  // Estados internos para los 3 selectores
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  // Referencias para los FlatLists
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  // Datos para las listas
  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const minutes = Array.from({ length: 60 }, (_, i) => i); // 0-59
  const periods = ["AM", "PM"];

  // Formatear hora para mostrar (ej: "08:30 AM")
  const formatTime = (date) => {
    if (!date) return "Seleccionar hora";
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Sincronizar estado interno con value externo al abrir modal
  useEffect(() => {
    if (showModal) {
      // Si hay value usa ese, si no usa hora actual
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
  }, [showModal, value]);

  // Abrir modal
  const openModal = () => {
    if (isEnabled) {
      setShowModal(true);
    }
  };

  // Confirmar selección
  const handleConfirm = () => {
    // Convertir hora 12h a 24h
    let hour24 = selectedHour;
    if (selectedPeriod === "PM" && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === "AM" && selectedHour === 12) {
      hour24 = 0;
    }

    // Crear Date usando fecha de HOY con la hora local explícita
    // NO usar new Date(value) para evitar problemas de zona horaria
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

  // Renderizar item de hora
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

  // Renderizar item de minuto
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

  // Renderizar item de periodo (AM/PM)
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

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Botón selector */}
      <TouchableOpacity
        style={[
          styles.timeButton,
          !isEnabled && styles.timeButtonDisabled,
          error && styles.timeButtonError,
        ]}
        onPress={openModal}
        disabled={!isEnabled}
        activeOpacity={0.7}
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
          {formatTime(value)}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={24}
          color={isEnabled ? colors.textSecondary : colors.disabled}
        />
      </TouchableOpacity>

      {/* Mensaje de error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Modal con selectores de hora */}
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
              {/* Header del modal */}
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

              {/* Contenedor de los 3 selectores */}
              <View style={styles.pickersContainer}>
                {/* Selector de Hora (1-12) */}
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

                {/* Separador */}
                <Text style={styles.separator}>:</Text>

                {/* Selector de Minuto (00-59) */}
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

                {/* Selector de AM/PM */}
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

              {/* Vista previa de hora seleccionada */}
              <View style={styles.previewContainer}>
                <MaterialCommunityIcons
                  name="clock-check-outline"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.previewText}>
                  {`${selectedHour}:${
                    selectedMinute < 10 ? `0${selectedMinute}` : selectedMinute
                  } ${selectedPeriod}`}
                </Text>
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

  // Botón selector
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

  // Error
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },

  // SafeArea para iOS
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Platform.OS === "ios" ? "65%" : "70%",
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

  // Contenedor de los 3 selectores
  pickersContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
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

  // Items de las listas
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

  // Vista previa
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
    fontSize: 24,
    fontWeight: "700",
    color: colors.accent,
    marginLeft: 8,
  },
});
