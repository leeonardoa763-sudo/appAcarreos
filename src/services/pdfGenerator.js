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

  // Formatear fecha y hora de creación del vale
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

  // Extraer datos específicos del vale de material
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
          font-family: 'Helvetica', 'Arial', sans-serif;
          background-color: ${bgColor};
          padding: 10px;
          color: #2C3E50;
        }
        
        .container {
          max-width: 100%;
          margin: 0 auto;
          background: white;
          border: 4px solid #2C3E50;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        
        .logo-container {
          margin-bottom: 10px;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto;
          border-radius: 50%;
          background: white;
          padding: 5px;
        }
        
        .header h1 {
          font-size: 22px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .header h2 {
          font-size: 16px;
          font-weight: normal;
          opacity: 0.95;
        }
        
        .section {
          padding: 15px 20px;
          border-bottom: 2px solid #E0E0E0;
        }
        
        .section:last-child {
          border-bottom: none;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #004E89;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 2px solid #004E89;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .info-item {
          margin-bottom: 8px;
        }
        
        .info-item-full {
          grid-column: 1 / -1;
        }
        
        .info-label {
          font-size: 11px;
          color: #7F8C8D;
          text-transform: uppercase;
          display: block;
          margin-bottom: 3px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        
        .info-value {
          font-size: 15px;
          font-weight: bold;
          color: #2C3E50;
          word-wrap: break-word;
        }
        
        .qr-container {
          text-align: center;
          padding: 25px;
          background: #F8F9FA;
        }
        
        .qr-title {
          font-size: 14px;
          font-weight: bold;
          color: #004E89;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        
        .qr-image {
          width: 180px;
          height: 180px;
          margin: 0 auto 12px;
          border: 3px solid #2C3E50;
          padding: 8px;
          background: white;
          display: block;
        }
        
        .qr-text {
          font-size: 12px;
          color: #7F8C8D;
          margin-top: 8px;
          line-height: 1.4;
        }
        
        .qr-url {
          font-size: 10px;
          color: #95A5A6;
          margin-top: 5px;
          word-break: break-all;
        }
        
        .footer {
          background: ${bgColor};
          padding: 20px;
          text-align: center;
          border-top: 3px solid #2C3E50;
        }
        
        .copia-badge {
          display: inline-block;
          padding: 10px 25px;
          background: #2C3E50;
          color: white;
          font-size: 16px;
          font-weight: bold;
          border-radius: 6px;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }
        
        .copia-destinatario {
          font-size: 13px;
          color: #555;
          margin-top: 5px;
          font-weight: 600;
        }
        
        .emision-info {
          font-size: 11px;
          color: #7F8C8D;
          margin-top: 8px;
        }
        
        .divider {
          height: 2px;
          background: linear-gradient(to right, transparent, #E0E0E0, transparent);
          margin: 10px 0;
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
          <div class="qr-title">⚡ Código de Verificación ⚡</div>
          <img src="${qrDataUrl}" class="qr-image" alt="Código QR">
          <p class="qr-text"><strong>Escanee para verificar autenticidad</strong></p>
          <div class="divider"></div>
          <p class="qr-url">${verificationUrl}</p>
        </div>
        
        <!-- FOOTER -->
        <div class="footer">
          <div class="copia-badge">COPIA ${colorCopia.toUpperCase()}</div>
          <div class="copia-destinatario">📋 ${destinatario}</div>
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
    });

    return uri;
  } catch (error) {
    console.error("Error generando PDF:", error);
    throw error;
  }
};
