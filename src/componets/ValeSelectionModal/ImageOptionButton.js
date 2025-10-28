import React from "react";
import { TouchableOpacity, Text, View, Image } from "react-native";
import styles from "./styles";

// Componente específico para imágenes
const ImageOptionButton = ({
  imageSource, // ← Prop específico para imagen
  text,
  onPress,
  color = "#704cafff",
  imageStyle = {}, // ← Estilos adicionales para la imagen
}) => {
  return (
    <TouchableOpacity style={styles.botonOpcion} onPress={onPress}>
      <View style={[styles.iconoContainer, { backgroundColor: color }]}>
        <Image source={imageSource} style={[styles.imagenIcono, imageStyle]} />
      </View>
      <Text style={styles.textoOpcion}>{text}</Text>
    </TouchableOpacity>
  );
};

export default ImageOptionButton;
