/**
 * utils/pdfHelpers.js
 *
 * Utilidades compartidas para generación de PDFs de vales
 */

export const COLORES_COPIA = {
  blanco: "#FFFFFF",
  roja: "#de4040ff",
  verde: "#E8F5E8",
  azul: "#E3F2FD",
  amarilla: "#FFFDE7",
  naranja: "#FFF3E0",
};

export const DESTINATARIOS_COPIA = {
  blanco: "OPERADOR",
  roja: "BANCO DE MATERIAL",
  verde: "RESIDENTE",
  azul: "ADMINISTRADOR 1",
  amarilla: "ADMINISTRADOR 2",
  naranja: "ADMINISTRADOR 3",
};

export const formatearFecha = (fecha) => {
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatearHora = (fecha) => {
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

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
      background-color: ${bgColor} !important;  
      padding: 0;
      margin: 0;
      color: #000;
      font-size: 11px;
      min-height: 100vh;
      -webkit-print-color-adjust: exact;        
      print-color-adjust: exact;                
    }
    
    .container {
      width: 100%;
      min-height: 100vh;
      margin: 0;
      padding: 0;
      background: ${bgColor};
      background-color: ${bgColor} !important;  
      border: 2px solid #000;
      display: flex;
      flex-direction: column;
      -webkit-print-color-adjust: exact;       
      print-color-adjust: exact;  
      box-sizing: border-box;              
    }
    
    .header {
      background: #000;
      background-color: #000 !important;  
      color: #FFF;
      padding: 8px 6px;
      text-align: center;
      border-bottom: 2px solid #000;
      -webkit-print-color-adjust: exact;  
      print-color-adjust: exact;          
    }
    
    .header h1 {
      font-size: 12px;
      margin-bottom: 2px;
      text-transform: uppercase;
      font-weight: bold;
      color: #FFF !important;
    }
    
    .header h2 {
      font-size: 10px;
      font-weight: normal;
      color: #FFF !important;
    }
    
    .info-section {
      padding: 6px;
      border-bottom: 1px solid #000;
    }
    
    .section-title {
      background: #000;
      color: #FFF !important;
      padding: 4px 6px;
      text-align: center;
      font-weight: bold;
      font-size: 11px;
      margin: 0;
      text-transform: uppercase;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
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
      color: #000 !important;
    }
    
    .info-value {
      font-size: 10px;
      text-align: right;
      max-width: 50%;
      word-break: break-word;
      color: #000 !important;
    }
    
    .info-full {
      padding: 3px 6px;
      border-bottom: 0.5px dashed #666;
    }
    
    .info-full .info-label,
    .info-full .info-value {
      color: #000 !important;
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
      color: #000 !important;
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
      color: #000 !important;
    }
    
    .qr-url {
      font-size: 5px;
      word-break: break-all;
      margin-top: 0.5mm;
      color: #666;
      text-align: center;
    }
    
    .footer {
      background: #000;
      background-color: #000 !important;
      color: #FFF;
      padding: 8px 6px;
      text-align: center;
      margin-top: auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .copia-badge {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 4px;
      text-transform: uppercase;
      color: #FFF !important;
    }
    
    .copia-destinatario {
      font-size: 10px;
      margin-bottom: 6px;
      color: #FFF !important;
    }
    
    .emision-info {
      font-size: 9px;
      font-style: italic;
      color: #FFF !important;
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

    .fotos-pagina {
      page-break-before: always;
      break-before: page;
      width: 100%;
      border: 2px solid #000;
      background-color: ${bgColor};
      background-color: ${bgColor} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .fotos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 6px;
    }

    .foto-item {
      text-align: center;
    }

    .foto-viaje {
      width: 100%;
      height: 90px;
      object-fit: cover;
      border: 1px solid #000;
      display: block;
    }

    .foto-caption {
      font-size: 8px;
      margin-top: 2px;
      color: #000 !important;
      font-weight: bold;
    }

    html {
      height: 100%;
      background-color: ${bgColor} !important;
    }
  `;
};

export const getCopiaInfo = (colorCopia) => {
  return {
    bgColor: COLORES_COPIA[colorCopia] || COLORES_COPIA.blanco,
    destinatario: DESTINATARIOS_COPIA[colorCopia] || DESTINATARIOS_COPIA.blanco,
  };
};
