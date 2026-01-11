/**
 * utils/pdfReceiptHelpers.js
 *
 * Utilidades para generación de PDFs estilo RECIBO TÉRMICO
 * Diseñado para impresoras de recibos con rollo de 50mm
 * Mínimo 9cm de largo, máximo ajustable según contenido
 */

export const COLORES_COPIA_RECIBO = {
  blanco: "#FFFFFF",
  roja: "#FFFFFF",
  verde: "#E8F5E8",
  azul: "#E3F2FD",
  amarilla: "#FFFDE7",
  naranja: "#FFF3E0",
};

export const DESTINATARIOS_COPIA_RECIBO = {
  blanco: "ORIGINAL",
  roja: "BANCO DE MATERIAL",
  verde: "RESIDENTE",
  azul: "ADMINISTRADOR 1",
  amarilla: "ADMINISTRADOR 2",
  naranja: "ADMINISTRADOR 3",
};

export const getCopiaInfoRecibo = (colorCopia) => {
  const color = colorCopia.toLowerCase();
  return {
    bgColor: COLORES_COPIA_RECIBO[color] || COLORES_COPIA_RECIBO.blanco,
    destinatario: DESTINATARIOS_COPIA_RECIBO[color] || "ORIGINAL",
  };
};

/**
 * CSS base para recibos térmicos de 50mm (189px @ 96dpi)
 * Fuente monoespaciada para alineación perfecta
 */
export const getReceiptBaseCSS = (bgColor) => {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: 50mm auto;
      margin: 0;
    }
    
    body {
    font-family: 'Courier New', 'Courier', monospace;
    background-color: ${bgColor};
    background-color: ${bgColor} !important;
    width: 50mm;
    min-height: 90mm;
    padding: 0;
    margin: 0 auto;
    color: #000;
    font-size: 7px;
    line-height: 1.2;
    display: flex;
    justify-content: center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    }

    .receipt-container {
    width: 100%;
    max-width: 50mm;
    background: ${bgColor};
    background-color: ${bgColor} !important;
    padding: 2mm;
    margin: 0 auto;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    }
    
    .receipt-header {
      text-align: center;
      border-bottom: 1px dashed #000;
      padding-bottom: 1.5mm;
      margin-bottom: 1.5mm;
    }
    
    .receipt-header h1 {
      font-size: 9px;
      font-weight: bold;
      margin-bottom: 1mm;
      text-transform: uppercase;
    }
    
    .receipt-header h2 {
      font-size: 7px;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    
    .receipt-header .folio {
      font-size: 8px;
      font-weight: bold;
      margin-top: 1mm;
    }
    
    .receipt-section {
      margin-bottom: 1.5mm;
      border-bottom: 1px dashed #000;
      padding-bottom: 1.5mm;
    }
    
    .receipt-section:last-of-type {
      border-bottom: none;
    }
    
    .section-title {
      font-size: 7px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 1mm;
      text-transform: uppercase;
    }
    
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 0.3mm 0;
      font-size: 6px;
    }
    
    .receipt-row-label {
      font-weight: normal;
      color: #333;
    }
    
    .receipt-row-value {
      font-weight: bold;
      text-align: right;
    }
    
    .receipt-full {
      font-size: 6px;
      padding: 0.5mm 0;
      word-wrap: break-word;
    }
    
    .receipt-full-label {
      font-weight: normal;
      color: #333;
    }
    
    .receipt-full-value {
      font-weight: bold;
      display: block;
      margin-top: 0.5mm;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 1mm 0;
      font-size: 8px;
      font-weight: bold;
      margin-top: 1mm;
      border-top: 1px solid #000;
    }
    
    .qr-section {
      text-align: center;
      margin-top: 1.5mm;
      padding-top: 1.5mm;
      border-top: 1px dashed #000;
    }
    
    .qr-section img {
      width: 12mm;
      height: 12mm;
      margin: 0.5mm auto;
      display: block;
    }
    
    .qr-text {
      font-size: 5px;
      margin-top: 0.5mm;
      text-align: center;
    }
    
    .receipt-footer {
      text-align: center;
      margin-top: 1.5mm;
      padding-top: 1.5mm;
      border-top: 1px dashed #000;
      font-size: 6px;
    }
    
    .copia-badge {
      font-size: 7px;
      font-weight: bold;
      padding: 0.5mm;
      background: #000;
      color: #FFF;
      display: inline-block;
      margin-bottom: 0.5mm;
    }
    
    .copia-destinatario {
      font-size: 6px;
      font-weight: bold;
      margin-bottom: 0.5mm;
    }
    
    .fecha-emision {
      font-size: 5px;
      color: #666;
    }
    
    .divider {
      border-top: 1px dashed #000;
      margin: 1mm 0;
    }
    
    .text-center {
      text-align: center;
    }
    
    .text-bold {
      font-weight: bold;
    }
    
    .notas-section {
      font-size: 5px;
      padding: 0.5mm;
      background: #F5F5F5;
      border-radius: 1mm;
      margin-top: 0.5mm;
      word-wrap: break-word;
    }
  `;
};

/**
 * Formatea fecha para recibos
 */
export const formatearFechaRecibo = (fecha) => {
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

/**
 * Formatea hora para recibos
 */
export const formatearHoraRecibo = (fecha) => {
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
