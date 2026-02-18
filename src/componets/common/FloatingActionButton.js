import React from "react";
import { TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";

const FloatingActionButton = ({ onPress, icon = "plus", size = 60 }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <MaterialCommunityIcons
            name={icon}
            size={size * 0.5}
            color="#FFFFFF"
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    right: 24,
    zIndex: 999,
  },
  fab: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default FloatingActionButton;
