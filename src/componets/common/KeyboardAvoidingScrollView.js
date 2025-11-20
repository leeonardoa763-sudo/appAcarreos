/**
 * KeyboardAvoidingScrollView.js
 *
 * Wrapper que combina KeyboardAvoidingView + ScrollView
 * para evitar que el teclado tape los campos del formulario
 *
 * PROPÓSITO:
 * - Ajusta automáticamente el scroll cuando aparece el teclado
 * - Funciona correctamente en iOS y Android
 * - Permite scroll automático al campo enfocado
 *
 * USADO EN:
 * - ValeRentaScreen
 * - ValeMaterialScreen
 * - Cualquier pantalla con formularios largos
 *
 * PROPS:
 * - children: ReactNode - Contenido a renderizar
 * - contentContainerStyle: object - Estilos del ScrollView content
 * - style: object - Estilos del ScrollView
 * - ...rest: otros props del ScrollView
 */

import React, { useRef } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Keyboard,
} from "react-native";
import { colors } from "../../config/colors";

const KeyboardAvoidingScrollView = ({
  children,
  contentContainerStyle,
  style,
  ...scrollViewProps
}) => {
  const scrollViewRef = useRef(null);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, style]}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default KeyboardAvoidingScrollView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
});
