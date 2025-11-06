/**
 * services/pdfRentaGenerator.js
 *
 * Servicio para generar PDFs de vales de RENTA con formato específico
 *
 * PROPÓSITO:
 * - Generar PDF de vale de renta con todos los datos
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

/**
 * Genera el HTML del vale de RENTA con el formato especificado
 * @param {object} valeData - Datos completos del vale
 * @param {string} colorCopia - Color de la copia (blanco, roja, verde, etc.)
 * @param {string} qrDataUrl - QR en formato base64 (data:image/png;base64,...)
 * @returns {string} - HTML formateado
 */
const generateValeRentaHTML = (valeData, colorCopia, qrDataUrl) => {
  const { bgColor, destinatario } = getCopiaInfo(colorCopia);

  const fechaFormateada = formatearFecha(valeData.fecha_creacion);
  const horaFormateada = formatearHora(valeData.fecha_creacion);

  // Extraer datos del vale de RENTA
  const detalle = valeData.vale_renta_detalle?.[0] || {};
  const material = detalle.material?.material || "N/A";
  const sindicato = detalle.sindicatos?.sindicato || "N/A";
  const capacidad = detalle.capacidad_m3 || "N/A";
  const numeroViajes = detalle.numero_viajes || 1;

  // Formatear horas
  const horaInicio = detalle.hora_inicio
    ? formatearHora(detalle.hora_inicio)
    : "N/A";

  const horaFin = detalle.hora_fin ? formatearHora(detalle.hora_fin) : "Pendiente";

  const totalHoras = detalle.total_horas || "N/A";
  const totalDias = detalle.total_dias || "N/A";

  // Obtener tarifas
  const precioRenta = detalle.precios_renta || {};
  const tarifaHora = precioRenta.costo_hr
    ? `$${parseFloat(precioRenta.costo_hr).toFixed(2)}`
    : "N/A";
  const tarifaDia = precioRenta.costo_dia
    ? `$${parseFloat(precioRenta.costo_dia).toFixed(2)}`
    : "N/A";

  const costoTotal = detalle.costo_total
    ? `$${parseFloat(detalle.costo_total).toFixed(2)} MXN`
    : "Pendiente";

  // Extraer datos de obra y empresa
  const obra = valeData.obras?.obra || "N/A";
  const empresa = valeData.obras?.empresas?.empresa || "N/A";
  const logoEmpresa = valeData.obras?.empresas?.logo || null;

  // URL de verificación
  const verificationUrl =
    valeData.qr_verification_url ||
    `https://verify.app/vale/${valeData.folio}`;

  // Generar HTML completo del vale de RENTA
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vale de Renta ${valeData.folio}</title>
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
          <h2>VALE DE RENTA - SERVICIO</h2>
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
          <div class="info-row">
            <span class="info-label">Sindicato</span>
            <span class="info-value">${sindicato}</span>
          </div>
        </div>
        
        <!-- SERVICIO DE RENTA -->
        <div class="section-title">SERVICIO DE RENTA</div>
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Material Movido</span>
            <span class="info-value">${material}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Capacidad</span>
            <span class="info-value">${capacidad} m³</span>
          </div>
          <div class="info-row">
            <span class="info-label">Núm. Viajes</span>
            <span class="info-value">${numeroViajes}</span>
          </div>
          <div class="divider"></div>
          <div class="info-row">
            <span class="info-label">Hora Inicio</span>
            <span class="info-value">${horaInicio}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Hora Fin</span>
            <span class="info-value">${horaFin}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Horas</span>
            <span class="info-value">${totalHoras} hrs</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Días</span>
            <span class="info-value">${totalDias}</span>
          </div>
          <div class="divider"></div>
          <div class="info-row">
            <span class="info-label">Tarifa/Hora</span>
            <span class="info-value">${tarifaHora}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tarifa/Día</span>
            <span class="info-value">${tarifaDia}</span>
          </div>
          <div class="info-row">
            <span class="info-label" style="font-size: 12px;">Costo Total</span>
            <span class="info-value" style="font-size: 12px; font-weight: bold;">${costoTotal}</span>
          </div>
        </div>
        
        <!-- DATOS GENERALES -->
        <div class="section-title">DATOS GENERALES</div>
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Operador</span>
            <span class="info-value">${valeData.operador_nombre}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Placas</span>
            <span class="info-value">${valeData.placas_vehiculo}</span>
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
 * Genera y comparte el PDF del vale de RENTA
 * @param {object} valeData - Datos completos del vale desde Supabase
 * @param {string} colorCopia - Color de la copia a generar (blanco, roja, verde, etc.)
 * @param {string} qrDataUrl - Código QR en formato base64
 * @returns {Promise<string>} - URI del archivo PDF generado
 */
export const generateAndSharePDFRenta = async (
  valeData,
  colorCopia = "blanco",
  qrDataUrl
) => {
  try {
    if (!valeData || !valeData.folio) {
      throw new Error("Datos del vale incompletos");
    }

    if (!qrDataUrl) {
      throw new Error("Código QR no generado");
    }

    const html = generateValeRentaHTML(valeData, colorCopia, qrDataUrl);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 226,
      height: 842,
    });

    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      throw new Error(
        "La función de compartir no está disponible en este dispositivo"
      );
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Vale de Renta ${valeData.folio} - Copia ${colorCopia.toUpperCase()}`,
      UTI: "com.adobe.pdf",
    });

    return uri;
  } catch (error) {
    console.error("Error generando/compartiendo PDF de renta:", error);
    throw error;
  }
};

/**
 * Genera solo el PDF de RENTA sin compartir (para preview o guardar)
 * @param {object} valeData - Datos completos del vale
 * @param {string} colorCopia - Color de la copia
 * @param {string} qrDataUrl - Código QR en formato base64
 * @returns {Promise<string>} - URI del archivo PDF generado
 */
export const generatePDFRentaOnly = async (
  valeData,
  colorCopia,
  qrDataUrl
) => {
  try {
    if (!valeData || !valeData.folio) {
      throw new Error("Datos del vale incompletos");
    }

    if (!qrDataUrl) {
      throw new Error("Código QR no generado");
    }

    const html = generateValeRentaHTML(valeData, colorCopia, qrDataUrl);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 226,
      height: 842,
    });

    return uri;
  } catch (error) {
    console.error("Error generando PDF de renta:", error);
    throw error;
  }
};