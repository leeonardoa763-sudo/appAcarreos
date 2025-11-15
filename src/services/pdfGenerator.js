/**
 * services/pdfGenerator.js
 *
 * Servicio para generar PDFs de vales de MATERIAL con formato específico
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
import {
  formatearFecha,
  formatearHora,
  getValeBaseCSS,
  getCopiaInfo,
} from "../utils/pdfHelpers";

import { renamePDFWithAutoName } from "./pdfFileHandler";

/**
 * Genera el HTML del vale de MATERIAL con el formato especificado
 * @param {object} valeData - Datos completos del vale
 * @param {string} colorCopia - Color de la copia (blanco, roja, verde, etc.)
 * @param {string} qrDataUrl - QR en formato base64 (data:image/png;base64,...)
 * @returns {string} - HTML formateado
 */
const generateValeHTML = (valeData, colorCopia, qrDataUrl) => {
  const { bgColor, destinatario } = getCopiaInfo(colorCopia);

  const fechaFormateada = formatearFecha(valeData.fecha_creacion);
  const horaFormateada = formatearHora(valeData.fecha_creacion);

  // Extraer datos del vale de MATERIAL
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

  // Extraer datos de operador, vehículo y sindicato
  const operador = valeData.operadores?.nombre_completo || "N/A";
  const placas = valeData.vehiculos?.placas || "N/A";
  const sindicato = valeData.vehiculos?.sindicatos?.sindicato || "N/A";

  // URL de verificación
  const verificationUrl =
    valeData.qr_verification_url || `https://verify.app/vale/${valeData.folio}`;

  // Generar HTML completo del vale de MATERIAL
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vale ${valeData.folio}</title>
      <style>
        ${getValeBaseCSS(bgColor)}
      </style>
    </head>
    <body>
      <div class="container">
        <!-- LOGO (si existe) -->
        ${
          logoEmpresa
            ? `
        <div class="logo-container">
          <img src="${logoEmpresa}" class="logo-image" alt="Logo Empresa">
        </div>
        `
            : ""
        }
        
        <!-- HEADER -->
        <div class="header">
          <h1>${empresa}</h1>
          <h2>VALE DE MATERIAL - ACARREO</h2>
        </div>
        
        <!-- DATOS PRINCIPALES -->
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Folio</span>
            <span class="info-value">${valeData.folio}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Fecha</span>
            <span class="info-value">${fechaFormateada}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Hora</span>
            <span class="info-value">${horaFormateada}</span>
          </div>
          <div class="info-full">
            <span class="info-label">Obra: </span>
            <span class="info-value">${obra}</span>
          </div>
          <div class="info-full">
            <span class="info-label">Banco: </span>
            <span class="info-value">${banco}</span>
          </div>
        </div>
        
        <!-- DATOS DE VALE -->
        <div class="section-title">DATOS DE VALE</div>
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Material</span>
            <span class="info-value">${material}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Capacidad</span>
            <span class="info-value">${capacidad} m³</span>
          </div>
          <div class="info-row">
            <span class="info-label">Distancia</span>
            <span class="info-value">${distancia} Km</span>
          </div>
          <div class="divider"></div>
          <div class="info-row">
            <span class="info-label">Cantidad Pedida</span>
            <span class="info-value">${cantidadPedida} m³</span>
          </div>
          <div class="info-row">
            <span class="info-label" style="font-size: 12px;">Peso</span>
            <span class="info-value" style="font-size: 12px; font-weight: bold;">${peso} Ton</span>
          </div>
        </div>
        
        <!-- DATOS GENERALES -->
        <div class="section-title">DATOS GENERALES</div>
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Operador</span>
            <span class="info-value">${operador}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Placas</span>
            <span class="info-value">${placas}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Sindicato</span>
            <span class="info-value">${sindicato}</span>
          </div>
        </div>
        
        <!-- CÓDIGO QR -->
        <div class="qr-container">
          <div class="qr-title">Código de Verificación</div>
          <img src="${qrDataUrl}" class="qr-image" alt="Código QR">
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
 * Genera y comparte el PDF del vale de MATERIAL
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
      width: 226,
      height: 842,
    });
    const newUri = await renamePDFWithAutoName(uri, valeData.folio, colorCopia);

    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      throw new Error(
        "La función de compartir no está disponible en este dispositivo"
      );
    }

    await Sharing.shareAsync(newUri, {
      mimeType: "application/pdf",
      dialogTitle: `Vale ${valeData.folio} - Copia ${colorCopia.toUpperCase()}`,
      UTI: "com.adobe.pdf",
    });

    return newUri;
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
      width: 226,
      height: 842,
    });

    return uri;
  } catch (error) {
    console.error("Error generando PDF:", error);
    throw error;
  }
};
