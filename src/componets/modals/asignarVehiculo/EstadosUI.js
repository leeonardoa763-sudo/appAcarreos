import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import { colors } from "../../../config/colors";
import styles from "./asignarStyles";

export const EstadoIdle = ({ onEscanear }) => (
  <View style={styles.estadoContainer}>
    <View style={styles.idleIconWrapper}>
      <MaterialCommunityIcons
        name="qrcode-scan"
        size={72}
        color={colors.secondary}
      />
    </View>
    <Text style={styles.estadoTitulo}>Escanea el QR del vehículo</Text>
    <Text style={styles.estadoSubtitulo}>
      Apunta la cámara al código QR pegado en el camión para ver sus vales
      disponibles.
    </Text>
    <TouchableOpacity style={styles.botonEscanear} onPress={onEscanear}>
      <MaterialCommunityIcons name="camera" size={22} color={colors.surface} />
      <Text style={styles.botonEscanearTexto}>Abrir cámara</Text>
    </TouchableOpacity>
  </View>
);

export const EstadoCargando = () => (
  <View style={styles.estadoContainer}>
    <ActivityIndicator size="large" color={colors.secondary} />
    <Text style={styles.estadoSubtitulo}>Consultando vehículo...</Text>
  </View>
);

export const EstadoError = ({ mensaje, onReintentar }) => (
  <View style={styles.estadoContainer}>
    <MaterialCommunityIcons
      name="alert-circle-outline"
      size={64}
      color={colors.danger}
    />
    <Text style={styles.estadoTitulo}>No se pudo encontrar el vehículo</Text>
    <Text style={[styles.estadoSubtitulo, styles.errorTexto]}>{mensaje}</Text>
    <TouchableOpacity style={styles.botonEscanear} onPress={onReintentar}>
      <MaterialCommunityIcons name="refresh" size={22} color={colors.surface} />
      <Text style={styles.botonEscanearTexto}>Escanear de nuevo</Text>
    </TouchableOpacity>
  </View>
);

export const BannerLimite = ({ folios }) => (
  <View style={styles.bannerLimite}>
    <MaterialCommunityIcons name="lock" size={32} color={colors.danger} />
    <Text style={styles.bannerLimiteTitulo}>Límite alcanzado</Text>
    <Text style={styles.bannerLimiteTexto}>
      Este vehículo ya tiene 2 vales activos y no puede recibir más hasta que
      complete uno.
    </Text>
    {folios.length > 0 && (
      <View style={styles.foliosActivosRow}>
        {folios.map((folio) => (
          <View
            key={folio}
            style={[styles.folioBadge, styles.folioBadgePeligro]}
          >
            <Text
              style={[styles.folioBadgeTexto, styles.folioBadgeTextoPeligro]}
            >
              {folio}
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
);
