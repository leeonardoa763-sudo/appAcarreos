// componets/ButtonsGrid/UserProfile.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const UserProfile = ({
  userName,
  userRole,
  userObra,
  userEmail,
  obras = [], // 🆕 Array de obras con CC
  loading = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Si hay múltiples obras, mostrar dropdown
  const tieneMultiplesObras = obras && obras.length > 1;
  const obraPrincipal = obras && obras.length > 0 ? obras[0] : null;

  return (
    <View style={styles.container}>
      {/* Header con nombre y rol */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons
            name="account-circle"
            size={60}
            color={colors.primary}
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userRole}>{userRole}</Text>
          {userEmail && <Text style={styles.userEmail}>{userEmail}</Text>}
        </View>
      </View>

      {/* Sección de obras */}
      <View style={styles.obraSection}>
        {loading ? (
          <Text style={styles.loadingText}>Cargando obras...</Text>
        ) : obras && obras.length > 0 ? (
          <>
            {/* Botón dropdown */}
            <TouchableOpacity
              style={styles.obraButton}
              onPress={() => tieneMultiplesObras && setModalVisible(true)}
              disabled={!tieneMultiplesObras}
            >
              <View style={styles.obraButtonContent}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={20}
                  color={colors.primary}
                  style={styles.obraIcon}
                />
                <View style={styles.obraTextContainer}>
                  <Text style={styles.obraLabel}>
                    {tieneMultiplesObras
                      ? `Obras asignadas (${obras.length})`
                      : "Obra asignada"}
                  </Text>
                  <Text style={styles.obraValue} numberOfLines={1}>
                    {obraPrincipal.nombre}
                  </Text>
                  <Text style={styles.obraCCText}>
                    CC: {obraPrincipal.cc || "Sin CC"}
                  </Text>
                </View>
                {tieneMultiplesObras && (
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={24}
                    color={colors.textSecondary}
                  />
                )}
              </View>
            </TouchableOpacity>

            {/* Modal con lista de obras */}
            {tieneMultiplesObras && (
              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
              >
                <Pressable
                  style={styles.modalOverlay}
                  onPress={() => setModalVisible(false)}
                >
                  <Pressable style={styles.modalContent}>
                    {/* Header del modal */}
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        Obras asignadas ({obras.length})
                      </Text>
                      <TouchableOpacity
                        onPress={() => setModalVisible(false)}
                        style={styles.closeButton}
                      >
                        <MaterialCommunityIcons
                          name="close"
                          size={24}
                          color={colors.textPrimary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Lista de obras */}
                    <ScrollView style={styles.obrasList}>
                      {obras.map((obra, index) => (
                        <View
                          key={obra.id || index}
                          style={[
                            styles.obraItem,
                            index === 0 && styles.obraItemPrincipal,
                          ]}
                        >
                          <View style={styles.obraItemContent}>
                            <MaterialCommunityIcons
                              name="office-building"
                              size={24}
                              color={
                                index === 0 ? colors.primary : colors.secondary
                              }
                              style={styles.obraItemIcon}
                            />
                            <View style={styles.obraItemText}>
                              <Text style={styles.obraItemName}>
                                {obra.nombre}
                              </Text>
                              <Text style={styles.obraItemCC}>
                                CC: {obra.cc || "Sin CC"}
                              </Text>
                              {obra.empresa && (
                                <Text style={styles.obraItemEmpresa}>
                                  {obra.empresa}
                                </Text>
                              )}
                            </View>
                            {index === 0 && (
                              <View style={styles.principalBadge}>
                                <Text style={styles.principalBadgeText}>
                                  Principal
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </Pressable>
                </Pressable>
              </Modal>
            )}
          </>
        ) : (
          // Sin obras asignadas (fallback a la prop userObra antigua)
          <View style={styles.obraFallback}>
            <MaterialCommunityIcons
              name="office-building"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.obraFallbackText}>
              {userObra || "Sin obra asignada"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
    marginHorizontal: 15,
    marginTop: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Sección de obras
  obraSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border || "#E5E7EB",
    paddingTop: 15,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 10,
  },

  // Botón de obra (dropdown trigger)
  obraButton: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border || "#E5E7EB",
  },
  obraButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  obraIcon: {
    marginRight: 10,
  },
  obraTextContainer: {
    flex: 1,
  },
  obraLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
    fontWeight: "500",
  },
  obraValue: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },
  obraCCText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "500",
  },

  // Fallback (sin obras en array)
  obraFallback: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  obraFallbackText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 5,
  },

  // Lista de obras en modal
  obrasList: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  obraItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border || "#E5E7EB",
  },
  obraItemPrincipal: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: `${colors.primary}10`, // 10% opacity
  },
  obraItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  obraItemIcon: {
    marginRight: 12,
  },
  obraItemText: {
    flex: 1,
  },
  obraItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  obraItemCC: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "500",
    marginBottom: 2,
  },
  obraItemEmpresa: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  principalBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  principalBadgeText: {
    fontSize: 11,
    color: colors.surface,
    fontWeight: "600",
  },
});

export default UserProfile;
