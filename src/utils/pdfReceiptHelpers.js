/**
 * utils/pdfReceiptHelpers.js
 *
 * Utilidades para generación de PDFs estilo RECIBO TÉRMICO
 * Diseñado para impresoras de recibos con rollo de 50mm
 * Mínimo 9cm de largo, máximo ajustable según contenido
 */

export const COLORES_COPIA_RECIBO = {
  blanco: "#FFFFFF",
  roja: "#f7a5b2ff",
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
      background-color: ${bgColor} !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    @page {
      size: 50mm 250mm;
      margin: 0;
      background-color: ${bgColor} !important;
    }
    
    html, body {
      background-color: ${bgColor} !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: 'Courier New', 'Courier', monospace;
      background-color: ${bgColor} !important;
      width: 50mm;
      padding: 0;
      margin: 0 auto;
      color: #000;
      font-size: 7px;
      line-height: 1.2;
      display: block;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .receipt-container {
      width: 100%;
      max-width: 50mm;
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
      background-color: ${bgColor} !important;
      page-break-inside: avoid;
    }
    
    .receipt-header h1 {
      font-size: 9px;
      font-weight: bold;
      margin-bottom: 1mm;
      text-transform: uppercase;
      background-color: transparent !important;
    }
    
    .receipt-header h2 {
      font-size: 7px;
      font-weight: bold;
      margin-bottom: 1mm;
      background-color: transparent !important;
    }
    
    .receipt-header .folio {
      font-size: 8px;
      font-weight: bold;
      margin-top: 1mm;
      background-color: transparent !important;
    }
    
    .receipt-section {
      margin-bottom: 1.5mm;
      border-bottom: 1px dashed #000;
      padding-bottom: 1.5mm;
      background-color: ${bgColor} !important;
      page-break-inside: avoid;
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
      background-color: transparent !important;
    }
    
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 0.3mm 0;
      font-size: 6px;
      background-color: transparent !important;
    }
    
    .receipt-row-label {
      font-weight: normal;
      color: #333;
      background-color: transparent !important;
    }
    
    .receipt-row-value {
      font-weight: bold;
      text-align: right;
      background-color: transparent !important;
    }
    
    .receipt-full {
      font-size: 6px;
      padding: 0.5mm 0;
      word-wrap: break-word;
      background-color: transparent !important;
    }
    
    .receipt-full-label {
      font-weight: normal;
      color: #333;
      background-color: transparent !important;
    }
    
    .receipt-full-value {
      font-weight: bold;
      display: block;
      margin-top: 0.5mm;
      background-color: transparent !important;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 1mm 0;
      font-size: 8px;
      font-weight: bold;
      margin-top: 1mm;
      border-top: 1px solid #000;
      background-color: transparent !important;
    }
    
    .qr-section {
      text-align: center;
      margin-top: 1.5mm;
      padding-top: 1.5mm;
      border-top: 1px dashed #000;
      background-color: ${bgColor} !important;
      page-break-inside: avoid;
    }
    
    .qr-section img {
      width: 12mm;
      height: 12mm;
      margin: 0.5mm auto;
      display: block;
      background-color: #FFFFFF !important;
    }
    
    .qr-text {
      font-size: 5px;
      margin-top: 0.5mm;
      text-align: center;
      background-color: transparent !important;
    }
    
    .qr-url {
      font-size: 5px;
      background-color: transparent !important;
    }
    
    .receipt-footer {
      text-align: center;
      margin-top: 1.5mm;
      padding-top: 1.5mm;
      border-top: 1px dashed #000;
      font-size: 6px;
      background-color: ${bgColor} !important;
      page-break-inside: avoid;
    }
    
    .copia-badge {
      font-size: 7px;
      font-weight: bold;
      padding: 0.5mm;
      background-color: #000 !important;
      color: #FFF;
      display: inline-block;
      margin-bottom: 0.5mm;
    }
    
    .copia-destinatario {
      font-size: 6px;
      font-weight: bold;
      margin-bottom: 0.5mm;
      background-color: transparent !important;
    }
    
    .fecha-emision {
      font-size: 5px;
      color: #666;
      background-color: transparent !important;
    }
    
    .divider {
      border-top: 1px dashed #000;
      margin: 1mm 0;
      background-color: transparent !important;
    }
    
    .text-center {
      text-align: center;
      background-color: transparent !important;
    }
    
    .text-bold {
      font-weight: bold;
      background-color: transparent !important;
    }
    
    .notas-section {
      font-size: 6px;
      padding: 1mm;
      background-color: transparent !important;
      border: none;
      margin-top: 0.5mm;
      word-wrap: break-word;
      line-height: 1.3;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
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
