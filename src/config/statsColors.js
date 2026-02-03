// src/config/statsColors.js

/**
 * statsColors.js
 *
 * PALETA DE COLORES EXTENDIDA PARA ESTADÍSTICAS
 * Colores adicionales para gráficos, gradientes y visualizaciones
 * NO modifica colors.js principal para no afectar otras partes de la app
 */

export const statsColors = {
  // ====================================
  // GRADIENTES MODERNOS PARA MÓDULOS
  // ====================================
  gradients: {
    // Resumen General - Naranja coral suave
    summary: ["#FF6B6B", "#FF8E53"],

    // Impacto Digital - Verde esmeralda (el que ya te gustó)
    digital: ["#1A936F", "#88D498"],

    // Comparativa de Costos - Morado lavanda profesional
    financial: ["#6C5CE7", "#A29BFE"],

    // Material/M³ - Azul cielo vibrante
    material: ["#0984E3", "#74B9FF"],

    // Renta/Horas - Turquesa tropical
    rental: ["#00B894", "#55EFC4"],

    // Viajes - Amarillo cálido
    trips: ["#FDCB6E", "#FFA502"],

    // Distancia - Rosa coral
    distance: ["#FD79A8", "#FDCB6E"],

    // Análisis - Índigo profundo
    analysis: ["#5F27CD", "#341F97"],
  },

  // ====================================
  // PALETA PARA GRÁFICOS MEJORADA
  // ====================================
  chartPalette: [
    "#FF6B6B", // Coral
    "#4ECDC4", // Turquesa
    "#45B7D1", // Azul cielo
    "#FFA07A", // Salmón
    "#98D8C8", // Menta
    "#6C5CE7", // Morado
    "#FDCB6E", // Amarillo
    "#FF7675", // Rosa
    "#74B9FF", // Azul claro
    "#55EFC4", // Verde agua
  ],

  // ====================================
  // GRADIENTES PARA GRÁFICAS
  // ====================================
  chartGradients: {
    // Para gráficas de barras - Material
    materialBar: ["#0984E3", "#74B9FF"],

    // Para gráficas de barras - Renta
    rentalBar: ["#00B894", "#55EFC4"],

    // Para gráficas de pastel - caliente
    pieWarm: ["#FF6B6B", "#FFA502"],

    // Para gráficas de pastel - frío
    pieCool: ["#0984E3", "#00B894"],
  },

  // ====================================
  // COLORES ESPECÍFICOS POR TIPO DE MATERIAL
  // ====================================
  materials: {
    arena: "#FFD93D", // Amarillo arena
    grava: "#95A3A4", // Gris grava
    tepetate: "#D63031", // Rojo tierra
    otros: "#74B9FF", // Azul otros
  },

  // ====================================
  // COLORES SEMÁNTICOS PARA TENDENCIAS
  // ====================================
  trend: {
    positive: "#00B894", // Verde turquesa
    negative: "#FF7675", // Rosa coral
    neutral: "#B2BEC3", // Gris neutro
  },

  // ====================================
  // BACKGROUNDS CON OPACIDAD
  // ====================================
  backgrounds: {
    screen: "#F8F9FA", // Fondo de pantalla (gris muy claro)
    cardLight: "rgba(255,255,255,0.95)", // Fondo de tarjetas
    overlay: "rgba(44,62,80,0.85)", // Overlay oscuro
    gradientOverlay: "rgba(255,255,255,0.1)", // Overlay sobre gradientes
  },

  // ====================================
  // COLORES PARA ICONOS EN GRADIENTES
  // ====================================
  iconColors: {
    onLight: "#2D3436", // Icono sobre fondo claro
    onDark: "#FFFFFF", // Icono sobre fondo oscuro
    onGradient: "#FFFFFF", // Icono sobre gradiente
  },
};
