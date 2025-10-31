//  screens/ValesScreen.js

import React from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth";
import { colors } from "../config/colors";
import UserProfile from "../componets/ButtonsGrid/UserProfile";
import ButtonsGrid from "../componets/ButtonsGrid/ButtonsGrid";

const ValesScreen = () => {
  const navigation = useNavigation();
  const { userProfile, loading, userName, currentObra, userRole } = useAuth();

  const handleCrearVale = () => {
    navigation.navigate("SeleccionarTipoVale");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  const buttonConfigs = [
    {
      onPress: handleCrearVale,
      iconName: "file-document-plus",
      iconSize: 70,
      buttonText: "Crear Vale",
      backgroundColor: colors.primary,
    },
  ];

  return (
    <View style={styles.container}>
      <UserProfile
        userName={userName || "Usuario"}
        userRole={userRole || "Cargando..."}
        userObra={currentObra || "Sin obra asignada"}
        userEmail={userProfile?.current_email || userProfile?.email}
      />

      <ButtonsGrid buttons={buttonConfigs} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default ValesScreen;
