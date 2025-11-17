// src/config/colors.js
export const colors = {
  // Colores principales
  primary: "#FF6B35", // Naranja construcción
  secondary: "#004E89", // Azul oscuro profesional
  accent: "#1A936F", // Verde aprobación/verificado

  // Estados
  success: "#2ECC71", // Verde éxito
  warning: "#F39C12", // Amarillo advertencia
  danger: "#E74C3C", // Rojo error/cancelado
  info: "#3498DB", // Azul información

  // Copias de vales (según tu documento de especificaciones)
  valeColors: {
    blanco: "#FFFFFF", // Copia 0 - Operador
    roja: "#E74C3C", // Copia 1 - Banco de material
    verde: "#27AE60", // Copia 2 - Residente
    azul: "#3498DB", // Copia 3 - Administrador 1
    amarilla: "#F1C40F", // Copia 4 - Administrador 2
    naranja: "#E67E22", // Copia 5 - Administrador 3
  },

  // UI General
  background: "#F5F6FA", // Fondo de la app
  surface: "#FFFFFF", // Tarjetas y superficies
  textPrimary: "#2C3E50", // Texto principal
  textSecondary: "#7F8C8D", // Texto secundario
  border: "#BDC3C7", // Bordes
  disabled: "#95A5A6", // Elementos deshabilitados

  // Navegación
  tabActive: "#FF6B35", // Tab activo
  tabInactive: "#7F8C8D", // Tab inactivo

  // Sombras (opcional pero útil)
  shadow: {
    color: "#000",
    light: "rgba(0, 0, 0, 0.1)",
    medium: "rgba(0, 0, 0, 0.25)",
    dark: "rgba(0, 0, 0, 0.4)",
  },
  // Estados de vales
  valeStates: {
    borrador: "#95A5A6", // Gris - En edición
    enProceso: "#F39C12", // Naranja - Trabajando
    emitido: "#3498DB", // Azul - Completado
    verificado: "#27AE60", // Verde - Verificado
    pagado: "#1A936F", // Verde oscuro - Pagado
    cancelado: "#E74C3C", // Rojo - Cancelado
  },

  // Inputs
  input: {
    background: "#FFFFFF",
    border: "#BDC3C7",
    borderFocused: "#004E89",
    placeholder: "#95A5A6",
    text: "#2C3E50",
    disabled: "#ECEFF1",
  },
};
