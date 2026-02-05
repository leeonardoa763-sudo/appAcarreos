// screens/ValesScreen.js
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth";
import { useObras } from "../hooks/useObras";
import { colors } from "../config/colors";
import UserProfile from "../componets/ButtonsGrid/UserProfile";
import ButtonsGrid from "../componets/ButtonsGrid/ButtonsGrid";

const ValesScreen = () => {
  const navigation = useNavigation();
  const {
    userProfile,
    loading: authLoading,
    userName,
    userRole,
    refreshProfile,
  } = useAuth();

  // 🆕 Hook para obtener todas las obras del usuario
  const {
    obras,
    loading: obrasLoading,
    error: obrasError,
  } = useObras(userProfile?.id_persona);

  // 🆕 Estado para pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  const handleCrearVale = () => {
    navigation.navigate("SeleccionarTipoVale");
  };

  const handleVerArchivados = () => {
    navigation.navigate("Archivados");
  };

  // 🆕 Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refrescar perfil del usuario (por si cambió la obra actual)
      await refreshProfile();

      // El hook useObras se actualizará automáticamente cuando cambie userProfile
      // debido a su useEffect interno
    } catch (error) {
      console.error("[ValesScreen] Error al refrescar:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Loading inicial
  if (authLoading) {
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
    {
      onPress: handleVerArchivados,
      iconName: "archive",
      iconSize: 70,
      buttonText: "Archivados",
      backgroundColor: colors.secondary,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
          title="Actualizando obras..."
          titleColor={colors.textSecondary}
        />
      }
    >
      <UserProfile
        userName={userName || "Usuario"}
        userRole={userRole || "Cargando..."}
        userObra={userProfile?.obras?.obra || "Sin obra asignada"} // Fallback
        userEmail={userProfile?.current_email || userProfile?.email}
        obras={obras} // 🆕 Array de obras con CC
        loading={obrasLoading} // 🆕 Loading de obras
      />

      {/* Mostrar error de obras si existe */}
      {obrasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {obrasError}</Text>
        </View>
      )}

      <ButtonsGrid buttons={buttonConfigs} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
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
  errorContainer: {
    backgroundColor: `${colors.error || "#EF4444"}15`,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.error || "#EF4444",
  },
  errorText: {
    fontSize: 14,
    color: colors.error || "#EF4444",
    fontWeight: "500",
  },
});

export default ValesScreen;
