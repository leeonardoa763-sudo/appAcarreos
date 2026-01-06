/**
 * services/pdfGenerator.js
 *
 * Servicio para generar PDFs de vales de MATERIAL con formato específico
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

const generateValeHTML = (valeData, colorCopia, qrDataUrl) => {
  const { bgColor, destinatario } = getCopiaInfo(colorCopia);

  const fechaFormateada = formatearFecha(valeData.fecha_creacion);
  const horaFormateada = formatearHora(valeData.fecha_creacion);

  const esCopiaBlanca = colorCopia.toLowerCase() === "blanca";

  // Extraer datos del vale
  const detalle = valeData.vale_material_detalles?.[0] || {};
  const material = detalle.material?.material || "N/A";
  const banco = detalle.bancos?.banco || "N/A";
  const capacidad = detalle.capacidad_m3 || "N/A";
  const distancia = detalle.distancia_km || "N/A";
  const cantidadPedida = detalle.cantidad_pedida_m3 || "N/A";

  // Detectar si es tipo 3
  const esTipo3 = detalle.material?.id_tipo_de_material === 3;

  // Datos de copia roja/verde (después de capturar peso)
  const folioBanco = detalle.folio_banco || null;
  const peso = detalle.peso_ton
    ? `${parseFloat(detalle.peso_ton).toFixed(2)}`
    : null;
  const volumenReal = detalle.volumen_real_m3
    ? `${parseFloat(detalle.volumen_real_m3).toFixed(2)}`
    : null;

  // Precios y tarifas
  const tienePrecio = detalle.precio_m3 && detalle.costo_total;
  const tarifaPrimerKm = detalle.tarifa_primer_km
    ? `$${parseFloat(detalle.tarifa_primer_km).toFixed(2)}`
    : null;
  const tarifaSubsecuente = detalle.tarifa_subsecuente
    ? `$${parseFloat(detalle.tarifa_subsecuente).toFixed(2)}/km`
    : null;
  const precioM3 = tienePrecio
    ? `$${parseFloat(detalle.precio_m3).toFixed(2)}`
    : null;
  const costoTotal = tienePrecio
    ? `$${parseFloat(detalle.costo_total).toFixed(2)} MXN`
    : null;

  // Notas adicionales
  const notas = detalle.notas_adicionales?.trim() || null;

  if (tienePrecio) {
    console.log("[pdfGenerator] -----");
  } else {
    console.log("[pdfGenerator] Copia sin precio (preliminar)");
  }

  // Datos de obra y empresa
  const obra = valeData.obras?.obra || "N/A";
  const empresa = valeData.obras?.empresas?.empresa || "N/A";
  const logoEmpresa = valeData.obras?.empresas?.logo || null;

  // Datos de operador
  const operador = valeData.operadores?.nombre_completo || "N/A";
  const placas = valeData.vehiculos?.placas || "N/A";
  const sindicato = valeData.vehiculos?.sindicatos?.sindicato || "N/A";

  const verificationUrl =
    valeData.qr_verification_url || `https://verify.app/vale/${valeData.folio}`;

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
        ${
          logoEmpresa
            ? `
        <div class="logo-container">
          <img src="${logoEmpresa}" class="logo-image" alt="Logo Empresa">
        </div>
        `
            : ""
        }
        
        <div class="header">
          <h1>${empresa}</h1>
          <h2>VALE DE MATERIAL - ACARREO</h2>
        </div>
        
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
          
          ${
            !(esCopiaBlanca && esTipo3)
              ? `
          <!-- CANTIDAD PEDIDA (NO mostrar en copia blanca tipo 3) -->
          <div class="info-row">
            <span class="info-label">Cantidad Pedida</span>
            <span class="info-value">${cantidadPedida} m³</span>
          </div>
          `
              : ""
          }

          ${
            (!esCopiaBlanca || esTipo3) && volumenReal
              ? `
          <!-- 4. VOLUMEN REAL (copias rojas/verdes O copia blanca tipo 3) -->
          <div class="info-row">
            <span class="info-label">${
              esTipo3 ? "Cantidad Final" : "Volumen Real"
            }</span>
            <span class="info-value">${volumenReal} m³</span>
          </div>
          `
              : ""
          }

          ${
            tienePrecio
              ? `
          <div class="divider"></div>
          
          <!-- 5. TARIFA 1ER KM -->
          <div class="info-row">
            <span class="info-label">Tarifa 1er Km</span>
            <span class="info-value">${tarifaPrimerKm}</span>
          </div>
          
          <!-- 6. TARIFA SUBSECUENTE -->
          <div class="info-row">
            <span class="info-label">Tarifa Subsecuente</span>
            <span class="info-value">${tarifaSubsecuente}</span>
          </div>
          
          <!-- 7. PRECIO POR M³ -->
          <div class="info-row">
            <span class="info-label">Precio/m³</span>
            <span class="info-value">${precioM3}</span>
          </div>
          
          <!-- 8. COSTO TOTAL -->
          <div class="info-row">
            <span class="info-label" style="font-size: 12px;">Costo Total</span>
            <span class="info-value" style="font-size: 12px; font-weight: bold;">${costoTotal}</span>
          </div>
          `
              : ""
          }
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
          <div class="divider"></div>
          <div class="info-row">
            <span class="info-label">Emitido por</span>
            <span class="info-value">${valeData.persona?.nombre || ""} ${
    valeData.persona?.primer_apellido || ""
  } ${valeData.persona?.segundo_apellido || ""}</span>
          </div>
        </div>

        ${
          notas
            ? `
        <!-- NOTAS ADICIONALES -->
        <div class="section-title">NOTAS</div>
        <div class="info-section">
          <p style="font-size: 10px; color: #2C3E50; margin: 0; padding: 8px; line-height: 1.4;">
            ${notas}
          </p>
        </div>
        `
            : ""
        }
        
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

export const generateAndSharePDF = async (
  valeData,
  colorCopia = "roja",
  qrDataUrl
) => {
  let newUri = null;

  try {
    console.log("[pdfGenerator] === INICIO generateAndSharePDF ===");
    console.log("[pdfGenerator] colorCopia:", colorCopia);
    console.log("[pdfGenerator] Tiene QR:", !!qrDataUrl);

    if (!valeData || !valeData.folio) {
      throw new Error("Datos del vale incompletos");
    }

    if (!qrDataUrl) {
      throw new Error("Código QR no generado");
    }

    console.log("[pdfGenerator] Generando HTML...");
    const html = generateValeHTML(valeData, colorCopia, qrDataUrl);

    console.log("[pdfGenerator] Convirtiendo a PDF...");
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 226,
      height: 842,
    });
    console.log("[pdfGenerator] PDF generado en:", uri);

    console.log("[pdfGenerator] Renombrando archivo...");
    newUri = await renamePDFWithAutoName(uri, valeData.folio, colorCopia);
    console.log("[pdfGenerator] Archivo renombrado:", newUri);

    console.log("[pdfGenerator] Verificando disponibilidad de compartir...");
    const isAvailable = await Sharing.isAvailableAsync();
    console.log("[pdfGenerator] Sharing disponible:", isAvailable);

    if (!isAvailable) {
      throw new Error("La función de compartir no está disponible");
    }

    console.log("[pdfGenerator] Compartiendo PDF...");

    await Promise.race([
      Sharing.shareAsync(newUri, {
        mimeType: "application/pdf",
        dialogTitle: `Vale ${
          valeData.folio
        } - Copia ${colorCopia.toUpperCase()}`,
        UTI: "com.adobe.pdf",
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout compartiendo")), 15000)
      ),
    ]);

    console.log("[pdfGenerator] ✅ PDF compartido exitosamente");
    return newUri;
  } catch (error) {
    console.error("[pdfGenerator] ❌ ERROR:", error.message);

    if (error.message === "Timeout compartiendo" && newUri) {
      console.log("[pdfGenerator] Timeout pero archivo creado:", newUri);
      // ⚠️ El archivo existe pero sharing falló
      // Retornar success de todos modos
      return newUri;
    }

    throw error;
  }
};

export const generatePDFOnly = async (valeData, colorCopia, qrDataUrl) => {
  console.log("[pdfGenerator] === generateValeHTML llamado ===");
  console.log("[pdfGenerator] Folio:", valeData?.folio);
  console.log("[pdfGenerator] Color:", colorCopia);
  console.log("[pdfGenerator] QR length:", qrDataUrl?.length);
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
      // width: 226,
      // height: 842,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });

    return uri;
  } catch (error) {
    console.error("Error generando PDF:", error);
    throw error;
  }
};
