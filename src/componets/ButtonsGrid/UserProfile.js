// components/UserProfile.js
import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const UserProfile = ({
  userName = "Usuario",
  userRole,
  userObra,
  userEmail,
}) => {
  const { width } = useWindowDimensions();
  const containerWidth = width * 0.9;

  return (
    <View style={[styles.residenteContainer, { width: containerWidth }]}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="account-circle"
          size={60}
          color={colors.primary}
        />
      </View>

      <View style={styles.textWrapper}>
        <Text
          style={styles.residenteText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {userName}
        </Text>

        {userRole && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="shield-account"
              size={16}
              color={colors.accent}
            />
            <Text style={styles.roleText}>{userRole}</Text>
          </View>
        )}

        {userObra && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="office-building"
              size={16}
              color={colors.secondary}
            />
            <Text style={styles.obraText}>{userObra}</Text>
          </View>
        )}

        {userEmail && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="email"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.emailText}>{userEmail}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  residenteContainer: {
    backgroundColor: colors.surface,
    marginVertical: 17,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    minHeight: 80,
    maxWidth: "100%",
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  textWrapper: {
    flex: 1,
    minWidth: 0,
  },
  residenteText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  roleText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: "600",
    marginLeft: 5,
  },
  obraText: {
    fontSize: 14,
    color: colors.secondary,
    marginLeft: 5,
  },
  emailText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 5,
  },
});

export default UserProfile;
