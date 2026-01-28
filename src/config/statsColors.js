// src/config/statsColors.js

/**
 * statsColors.js
 *
 * PALETA DE COLORES EXTENDIDA PARA ESTADÍSTICAS
 * Colores adicionales para gráficos, gradientes y visualizaciones
 */

export const statsColors = {
  // Gradientes modernos para backgrounds
  gradients: {
    primary: ["#FF6B35", "#FF8C42"],
    success: ["#1A936F", "#88D498"],
    info: ["#004E89", "#0077B6"],
    warning: ["#F77F00", "#FCBF49"],
    accent: ["#6A4C93", "#9D84B7"],
  },

  // Paleta para gráficos (8 colores distintos y accesibles)
  chartPalette: [
    "#FF6B35", // Naranja primary
    "#1A936F", // Verde accent
    "#004E89", // Azul secondary
    "#F77F00", // Naranja warning
    "#6A4C93", // Púrpura
    "#00B4D8", // Cyan
    "#E63946", // Rojo
    "#06FFA5", // Mint
  ],

  // Colores específicos por tipo de material
  materials: {
    arena: "#FFB627",
    grava: "#95A3A4",
    tepetate: "#CD6155",
    otros: "#5DADE2",
  },

  // Colores semánticos para tendencias
  trend: {
    positive: "#1A936F",
    negative: "#E63946",
    neutral: "#7F8C8D",
  },

  // Backgrounds con opacidad
  backgrounds: {
    cardLight: "rgba(255,107,53,0.05)",
    cardDark: "rgba(0,78,137,0.05)",
    overlay: "rgba(44,62,80,0.9)",
  },
};
