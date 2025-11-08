/**
 * utils/pdfHelpers.js
 *
 * Utilidades compartidas para generación de PDFs de vales
 *
 * PROPÓSITO:
 * - Centralizar constantes de colores y destinatarios
 * - Funciones de formateo reutilizables
 * - CSS base compartido entre PDFs de Material y Renta
 */

/**
 * CONSTANTES: Colores de fondo según tipo de copia
 */
export const COLORES_COPIA = {
  blanco: "#FFFFFF", //  Blanco puro
  roja: "#FFEBEE", // Rojo muy claro (como papel rosa)
  verde: "#E8F5E8", // Verde muy suave
  azul: "#E3F2FD", // Azul claro (como papel celeste)
  amarilla: "#FFFDE7", // Amarillo pastel
  naranja: "#FFF3E0", // Naranja muy suave
};

/**
 * CONSTANTES: Destinatarios según color de copia
 */
export const DESTINATARIOS_COPIA = {
  blanco: "OPERADOR",
  roja: "BANCO DE MATERIAL",
  verde: "RESIDENTE",
  azul: "ADMINISTRADOR 1",
  amarilla: "ADMINISTRADOR 2",
  naranja: "ADMINISTRADOR 3",
};

/**
 * Formatea fecha en formato mexicano
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada (dd/mm/yyyy)
 */
export const formatearFecha = (fecha) => {
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formatea hora en formato 24h
 * @param {Date|string} fecha - Fecha/hora a formatear
 * @returns {string} - Hora formateada (HH:mm)
 */
export const formatearHora = (fecha) => {
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Genera CSS base compartido para todos los PDFs de vales
 * @param {string} bgColor - Color de fondo según tipo de copia
 * @returns {string} - Estilos CSS completos
 */
export const getValeBaseCSS = (bgColor) => {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', 'Courier', monospace;
      background-color: ${bgColor};
      padding: 0;
      color: #000;
      font-size: 11px;
      height: 105mm;
    }
    
    .container {
      width: 67.5mm;
      min-height: 100vh;
      margin: 0 auto;
      background: ${bgColor};
      border: 2px solid #000;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: #000;
      color: #FFF;
      padding: 8px 6px;
      text-align: center;
      border-bottom: 2px solid #000;
    }
    
    .header h1 {
      font-size: 12px;
      margin-bottom: 2px;
      text-transform: uppercase;
      font-weight: bold;
    }
    
    .header h2 {
      font-size: 10px;
      font-weight: normal;
    }
    
    .info-section {
      padding: 6px;
      border-bottom: 1px solid #000;
    }
    
    .section-title {
      background: #000;
      color: #FFF;
      padding: 4px 6px;
      text-align: center;
      font-weight: bold;
      font-size: 11px;
      margin: 0;
      text-transform: uppercase;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 6px;
      border-bottom: 0.5px dashed #666;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: bold;
      font-size: 10px;
      text-transform: uppercase;
    }
    
    .info-value {
      font-size: 10px;
      text-align: right;
      max-width: 50%;
      word-break: break-word;
    }
    
    .info-full {
      padding: 3px 6px;
      border-bottom: 0.5px dashed #666;
    }
    
    .divider {
      border-top: 1px solid #000;
      margin: 6px 0;
    }
    
    .qr-container {
      padding: 6px 6px;
      text-align: center;
      border-bottom: 2px solid #000;
    }
    
    .qr-title {
      font-weight: bold;
      font-size: 11px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    
    .qr-image {
      width: 120px;
      height: 120px;
      margin: 4px auto;
      display: block;
    }
    
    .qr-text {
      font-size: 9px;
      margin: 4px 0;
      font-weight: bold;
    }
    
    .qr-url {
      font-size: 8px;
      word-break: break-all;
      margin-top: 4px;
      color: #333;
    }
    
    .footer {
      background: #000;
      color: #FFF;
      padding: 8px 6px;
      text-align: center;
      margin-top: 0;
    }
    
    .copia-badge {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    
    .copia-destinatario {
      font-size: 10px;
      margin-bottom: 6px;
    }
    
    .emision-info {
      font-size: 9px;
      font-style: italic;
    }
    
    .logo-container {
      text-align: center;
      padding: 6px;
      border-bottom: 1px solid #000;
    }
    
    .logo-image {
      max-width: 100px;
      height: auto;
    }

    @media print {
      body {
        padding: 0;
        margin: 0;
        height: auto;
      }
      .container {
        border: none;
        height: auto;
        page-break-after: always;
      }
    }
  `;
};

/**
 * Obtiene color y destinatario según tipo de copia
 * @param {string} colorCopia - Tipo de copia (blanco, roja, verde, etc.)
 * @returns {object} - { bgColor, destinatario }
 */
export const getCopiaInfo = (colorCopia) => {
  return {
    bgColor: COLORES_COPIA[colorCopia] || COLORES_COPIA.blanco,
    destinatario: DESTINATARIOS_COPIA[colorCopia] || DESTINATARIOS_COPIA.blanco,
  };
};
