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
import TarifasModal from "../componets/TarifasModal";

const ValesScreen = () => {
  const navigation = useNavigation();
  const {
    userProfile,
    loading: authLoading,
    userName,
    userRole,
    refreshProfile,
  } = useAuth();

  const {
    obras,
    loading: obrasLoading,
    error: obrasError,
  } = useObras(userProfile?.id_persona);

  const [refreshing, setRefreshing] = useState(false);
  const [tarifasModalVisible, setTarifasModalVisible] = useState(false);

  const handleCrearVale = () => {
    navigation.navigate("SeleccionarTipoVale");
  };

  const handleVerArchivados = () => {
    navigation.navigate("Archivados");
  };

  const handleVerTarifas = () => {
    setTarifasModalVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch (error) {
      console.error("[ValesScreen] Error al refrescar:", error);
    } finally {
      setRefreshing(false);
    }
  };

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
      iconSize: 60,
      buttonText: "Crear Vale",
      backgroundColor: colors.primary,
    },
    {
      onPress: handleVerArchivados,
      iconName: "archive",
      iconSize: 60,
      buttonText: "Archivados",
      backgroundColor: colors.secondary,
    },
    {
      onPress: handleVerTarifas,
      iconName: "file-document-outline",
      iconSize: 60,
      buttonText: "Tarifas",
      backgroundColor: colors.accent,
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
        userObra={userProfile?.obras?.obra || "Sin obra asignada"}
        userEmail={userProfile?.current_email || userProfile?.email}
        obras={obras}
        loading={obrasLoading}
      />

      {obrasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {obrasError}</Text>
        </View>
      )}

      <ButtonsGrid buttons={buttonConfigs} />

      <TarifasModal
        visible={tarifasModalVisible}
        onClose={() => setTarifasModalVisible(false)}
        userObras={obras || []}
      />
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
