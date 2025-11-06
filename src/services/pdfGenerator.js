/**
 * services/pdfGenerator.js
 *
 * Servicio para generar PDFs de vales con formato específico
 *
 * PROPÓSITO:
 * - Generar PDF de vale de material con todos los datos
 * - Incluir código QR de verificación
 * - Aplicar formato según tipo de copia (color de fondo)
 * - Compartir PDF generado
 *
 * TECNOLOGÍAS:
 * - expo-print: Generación de PDF desde HTML
 * - expo-sharing: Compartir archivo PDF
 */

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

/**
 * Genera el HTML del vale con el formato especificado
 * @param {object} valeData - Datos completos del vale
 * @param {string} colorCopia - Color de la copia (blanco, roja, verde, etc.)
 * @param {string} qrDataUrl - QR en formato base64 (data:image/png;base64,...)
 * @returns {string} - HTML formateado
 */
const generateValeHTML = (valeData, colorCopia, qrDataUrl) => {
  // Mapeo de colores de fondo según tipo de copia
  const coloresBackground = {
    blanco: "#FFFFFF",
    roja: "#FFEBEE",
    verde: "#E8F5E9",
    azul: "#E3F2FD",
    amarilla: "#FFFDE7",
    naranja: "#FFF3E0",
  };

  // Mapeo de destinatarios según color de copia
  const destinatarios = {
    blanco: "OPERADOR",
    roja: "BANCO DE MATERIAL",
    verde: "RESIDENTE",
    azul: "ADMINISTRADOR 1",
    amarilla: "ADMINISTRADOR 2",
    naranja: "ADMINISTRADOR 3",
  };

  const bgColor = coloresBackground[colorCopia] || "#FFFFFF";
  const destinatario = destinatarios[colorCopia] || "OPERADOR";

  // Formatear fecha y hora
  const fechaCreacion = new Date(valeData.fecha_creacion);
  const fechaFormateada = fechaCreacion.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaFormateada = fechaCreacion.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Extraer datos del vale
  const detalle = valeData.vale_material_detalles?.[0] || {};
  const material = detalle.material?.material || "N/A";
  const banco = detalle.bancos?.banco || "N/A";
  const capacidad = detalle.capacidad_m3 || "N/A";
  const distancia = detalle.distancia_km || "N/A";
  const cantidadPedida = detalle.cantidad_pedida_m3 || "N/A";
  const peso = detalle.peso_ton || "Pendiente";

  // Extraer datos de obra y empresa
  const obra = valeData.obras?.obra || "N/A";
  const empresa = valeData.obras?.empresas?.empresa || "N/A";
  const logoEmpresa = valeData.obras?.empresas?.logo || null;

  // URL de verificación
  const verificationUrl =
    valeData.qr_verification_url || `https://verify.app/vale/${valeData.folio}`;

  // Generar HTML completo del vale
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vale ${valeData.folio}</title>
      <style>
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
          height: 100vh;
        }
        
        .container {
          width: 80mm;
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
        
        .section {
          padding: 6px;
          border-bottom: 1px dashed #000;
          flex-shrink: 0;
        }
        
        .section:last-child {
          border-bottom: none;
        }
        
        .section-title {
          font-size: 10px;
          font-weight: bold;
          color: #000;
          margin-bottom: 4px;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
          padding-bottom: 1px;
        }
        
        .info-grid {
          width: 100%;
        }
        
        .info-item {
          margin-bottom: 3px;
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dotted #666;
          padding-bottom: 1px;
        }
        
        .info-item-full {
          display: block;
        }
        
        .info-label {
          font-size: 8px;
          color: #000;
          text-transform: uppercase;
          font-weight: bold;
          display: inline-block;
          min-width: 45%;
        }
        
        .info-value {
          font-size: 9px;
          font-weight: bold;
          color: #000;
          text-align: right;
          display: inline-block;
        }
        
        .qr-container {
          text-align: center;
          padding: 8px 6px;
          background: #FFF;
          border-top: 2px dashed #000;
          border-bottom: 2px dashed #000;
          flex-shrink: 0;
        }
        
        .qr-title {
          font-size: 9px;
          font-weight: bold;
          color: #000;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        
        .qr-image {
          width: 100px;
          height: 100px;
          margin: 0 auto 4px;
          border: 1px solid #000;
          padding: 2px;
          background: white;
          display: block;
        }
        
        .qr-text {
          font-size: 8px;
          color: #000;
          margin-top: 3px;
          line-height: 1.2;
        }
        
        .qr-url {
          font-size: 6px;
          color: #666;
          margin-top: 2px;
          word-break: break-all;
        }
        
        .footer {
          background: #000;
          color: #FFF;
          padding: 6px;
          text-align: center;
          border-top: 2px solid #000;
          margin-top: auto;
          flex-shrink: 0;
        }
        
        .copia-badge {
          display: block;
          padding: 4px 8px;
          background: #FFF;
          color: #000;
          font-size: 10px;
          font-weight: bold;
          border: 1px solid #000;
          text-transform: uppercase;
          margin: 0 auto 4px;
          max-width: 120px;
        }
        
        .copia-destinatario {
          font-size: 9px;
          color: #FFF;
          margin-top: 2px;
          font-weight: bold;
        }
        
        .emision-info {
          font-size: 7px;
          color: #FFF;
          margin-top: 4px;
          border-top: 1px solid #FFF;
          padding-top: 2px;
        }
        
        .divider {
          height: 1px;
          background: #000;
          margin: 4px 0;
        }
        
        .logo-container {
          margin-bottom: 4px;
        }
        
        .logo {
          max-width: 40px;
          max-height: 30px;
        }

        /* Estilos específicos para impresión */
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
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          ${
            logoEmpresa
              ? `
          <div class="logo-container">
            <img src="${logoEmpresa}" class="logo" alt="Logo Empresa">
          </div>
          `
              : ""
          }
          <h1>${empresa}</h1>
          <h2>VALE DE MATERIAL - ACARREO</h2>
        </div>
        
        <!-- DATOS PRINCIPALES -->
        <div class="section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Folio</span>
              <span class="info-value">${valeData.folio}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Fecha</span>
              <span class="info-value">${fechaFormateada}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Obra</span>
              <span class="info-value">${obra}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Hora</span>
              <span class="info-value">${horaFormateada}</span>
            </div>
            <div class="info-item info-item-full">
              <span class="info-label">Banco de Material</span>
              <span class="info-value">${banco}</span>
            </div>
          </div>
        </div>
        
        <!-- DATOS DE VALE -->
        <div class="section">
          <div class="section-title">Datos de Vale</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Material</span>
              <span class="info-value">${material}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Capacidad</span>
              <span class="info-value">${capacidad} m³</span>
            </div>
            <div class="info-item">
              <span class="info-label">Distancia</span>
              <span class="info-value">${distancia} Km</span>
            </div>
            <div class="info-item">
              <span class="info-label">Peso</span>
              <span class="info-value">${peso} Ton</span>
            </div>
            <div class="info-item info-item-full">
              <span class="info-label">Cantidad Solicitada</span>
              <span class="info-value">${cantidadPedida} m³</span>
            </div>
          </div>
        </div>
        
        <!-- DATOS DEL OPERADOR -->
        <div class="section">
          <div class="section-title">Datos del Operador</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Operador</span>
              <span class="info-value">${valeData.operador_nombre}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Placas</span>
              <span class="info-value">${valeData.placas_vehiculo}</span>
            </div>
          </div>
        </div>
        
        <!-- CÓDIGO QR -->
        <div class="qr-container">
          <div class="qr-title">Codigo de Verificacion</div>
          <img src="${qrDataUrl}" class="qr-image" alt="Codigo QR">
          <p class="qr-text"><strong>Escanee para verificar autenticidad</strong></p>
          <div class="divider"></div>
          <p class="qr-url">${verificationUrl}</p>
        </div>
        
        <!-- FOOTER -->
        <div class="footer">
          <div class="copia-badge">COPIA ${colorCopia.toUpperCase()}</div>
          <div class="copia-destinatario">${destinatario}</div>
          <div class="emision-info">
            Emitida: ${fechaFormateada} ${horaFormateada}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
/**
 * Genera y comparte el PDF del vale
 * @param {object} valeData - Datos completos del vale desde Supabase
 * @param {string} colorCopia - Color de la copia a generar (blanco, roja, verde, etc.)
 * @param {string} qrDataUrl - Código QR en formato base64
 * @returns {Promise<string>} - URI del archivo PDF generado
 */
export const generateAndSharePDF = async (
  valeData,
  colorCopia = "roja",
  qrDataUrl
) => {
  try {
    // Validar que tengamos todos los datos necesarios
    if (!valeData || !valeData.folio) {
      throw new Error("Datos del vale incompletos");
    }

    if (!qrDataUrl) {
      throw new Error("Código QR no generado");
    }

    // Generar HTML del vale
    const html = generateValeHTML(valeData, colorCopia, qrDataUrl);

    // Generar PDF desde HTML
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 226, // 80mm en puntos (ticket térmico estándar)
      height: 842, // Altura variable (A4 para desarrollo)
    });

    // Verificar si el dispositivo puede compartir archivos
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      throw new Error(
        "La función de compartir no está disponible en este dispositivo"
      );
    }

    // Compartir el PDF
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Vale ${valeData.folio} - Copia ${colorCopia.toUpperCase()}`,
      UTI: "com.adobe.pdf",
    });

    return uri;
  } catch (error) {
    console.error("Error generando/compartiendo PDF:", error);
    throw error;
  }
};

/**
 * Genera solo el PDF sin compartir (para preview o guardar)
 * @param {object} valeData - Datos completos del vale
 * @param {string} colorCopia - Color de la copia
 * @param {string} qrDataUrl - Código QR en formato base64
 * @returns {Promise<string>} - URI del archivo PDF generado
 */
export const generatePDFOnly = async (valeData, colorCopia, qrDataUrl) => {
  try {
    if (!valeData || !valeData.folio) {
      throw new Error("Datos del vale incompletos");
    }

    if (!qrDataUrl) {
      throw new Error("Código QR no generado");
    }

    const html = generateValeHTML(valeData, colorCopia, qrDataUrl);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 226, // 80mm en puntos
      height: 842, // Altura variable
    });

    return uri;
  } catch (error) {
    console.error("Error generando PDF:", error);
    throw error;
  }
};
