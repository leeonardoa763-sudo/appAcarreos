import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  // Contenedor principal del modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  // Contenido del modal (cuadro blanco)
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  // Título
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  // Botón de opción (Renta/Material)
  botonOpcion: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8ac",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: "100%",
  },
  // Círculo del icono
  iconoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  // Texto de las opciones
  textoOpcion: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#333",
  },
  // Botón cancelar
  botonCerrar: {
    marginTop: 20,
    padding: 10,
  },
  // Texto cancelar
  textoCerrar: {
    fontSize: 16,
    color: "#e50202ff",
    fontWeight: "bold",
  },
});

export default styles;
