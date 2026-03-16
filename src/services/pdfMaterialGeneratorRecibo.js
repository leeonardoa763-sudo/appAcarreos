/**
 * services/pdfMaterialGeneratorRecibo.js
 *
 * Generador de PDFs estilo RECIBO TÉRMICO para vales de MATERIAL
 * Diseñado para impresoras de recibos con rollo de 50mm
 * Mantiene la lógica completa:
 * - Tipo 3 (Tepetate): Genera copia BLANCA inmediata con cantidad final
 * - Tipo 1 y 2: Genera copia ROJA preliminar, luego BLANCA con volumen real y peso
 */

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  formatearFechaRecibo,
  formatearHoraRecibo,
  getReceiptBaseCSS,
  getCopiaInfoRecibo,
} from "../utils/pdfReceiptHelpers";
import { renamePDFWithAutoName } from "./pdfFileHandler";

/**
 * Genera HTML del vale de MATERIAL en formato recibo térmico
 */
const generateValeMaterialReciboHTML = (valeData, colorCopia, qrDataUrl) => {
  const { bgColor, destinatario } = getCopiaInfoRecibo(colorCopia);

  const fechaFormateada = formatearFechaRecibo(valeData.fecha_creacion);
  const horaFormateada = formatearHoraRecibo(valeData.fecha_creacion);

  const esCopiaBlanca = colorCopia.toLowerCase() === "blanca";

  // Extraer datos del vale
  const detalle = valeData.vale_material_detalles?.[0];
  const material = detalle.material?.material || "N/A";
  const banco = detalle.bancos?.banco || "N/A";
  const capacidad = detalle.capacidad_m3 || "Pendiente";
  const distancia = detalle.distancia_km || "N/A";
  const cantidadPedida = detalle.cantidad_pedida_m3 || "N/A";
  const requisicion = detalle.requisicion || null;
  const folioValeFisico = detalle.folio_vale_fisico
    ? String(detalle.folio_vale_fisico)
    : null;

  // Detectar si es tipo 3 (Tepetate)
  const esTipo3 = detalle.material?.id_tipo_de_material === 3;

  // En generateValeMaterialReciboHTML, justo después de extraer folioValeFisico
  console.log("[PDF] folioValeFisico:", folioValeFisico);
  console.log("[PDF] esTipo3:", esTipo3);

  // Datos después de completar el vale
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
    ? `$${parseFloat(detalle.costo_total).toFixed(2)}`
    : null;

  // Datos de obra y empresa
  // Datos de obra y empresa
  const cc = valeData.obras?.cc || "";
  const nombreObra = valeData.obras?.obra || "N/A";
  const obra = cc ? `${cc} - ${nombreObra}` : nombreObra;
  const empresa = valeData.obras?.empresas?.empresa || "CONSTRUCCION";
  const operador = valeData.operadores?.nombre_completo || "Pendiente";
  const placas = valeData.vehiculos?.placas || "Pendiente";

  const sindicato =
    detalle?.sindicatos?.sindicato ||
    valeData.vehiculos?.sindicatos?.sindicato ||
    "N/A";

  // Persona que creó el vale
  const creador = valeData.persona
    ? `${valeData.persona.nombre} ${valeData.persona.primer_apellido} ${valeData.persona.segundo_apellido || ""}`.trim()
    : "N/A";

  // Persona que computó (completó) el vale
  const computador = valeData.persona_completador
    ? `${valeData.persona_completador.nombre} ${valeData.persona_completador.primer_apellido} ${valeData.persona_completador.segundo_apellido || ""}`.trim()
    : null; // null si aún no se ha completado

  const notas = detalle.notas_adicionales?.trim() || null;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recibo ${valeData.folio}</title>
      <style>
        ${getReceiptBaseCSS(bgColor)}
      </style>
    </head>
    <body>
      <div class="receipt-container">
        
        <!-- HEADER -->
        <div class="receipt-header">
          <h1>${empresa}</h1>
          <h2>VALE DE MATERIAL</h2>
          <div class="folio">No. ${valeData.folio}</div>
          <div style="font-size: 6px; margin-top: 1mm;">
            ${fechaFormateada} ${horaFormateada}
          </div>
        </div>

        <!-- OBRA Y BANCO -->
        <div class="receipt-section">
          <div class="receipt-full">
            <span class="receipt-full-label">OBRA:</span>
            <span class="receipt-full-value">${obra}</span>
          </div>
          <div class="receipt-full">
            <span class="receipt-full-label">BANCO:</span>
            <span class="receipt-full-value">${banco}</span>
          </div>
        </div>

        <!-- DATOS DEL MATERIAL -->
        <div class="receipt-section">
          <div class="section-title">MATERIAL</div>
          <div class="receipt-row">
            <span class="receipt-row-label">Material:</span>
            <span class="receipt-row-value">${material}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Capacidad:</span>
            <span class="receipt-row-value">${capacidad} m³</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Distancia:</span>
            <span class="receipt-row-value">${distancia} Km</span>
          </div>
        </div>

        <!-- CANTIDADES -->
        <div class="receipt-section">
          <div class="section-title">CANTIDADES</div>
          ${
            requisicion
              ? `
            <div class="receipt-row">
              <span class="receipt-row-label">Requisición:</span>
              <span class="receipt-row-value">${requisicion}</span>
            </div>
            `
              : ""
          }
          ${
            folioValeFisico && esTipo3
              ? `
            <div class="receipt-row">
              <span class="receipt-row-label">Vale Físico:</span>
              <span class="receipt-row-value">${folioValeFisico}</span>
            </div>
            `
              : ""
          }

          
          ${
            !(esCopiaBlanca && esTipo3)
              ? `
          <div class="receipt-row">
            <span class="receipt-row-label">Cant. Pedida:</span>
            <span class="receipt-row-value">${cantidadPedida} m³</span>
          </div>
          `
              : ""
          }

          ${
            volumenReal &&
            (!esCopiaBlanca || esTipo3 || (esCopiaBlanca && !esTipo3))
              ? `
          <div class="receipt-row">
            <span class="receipt-row-label">${
              esTipo3 ? "Cant. Final:" : "Vol. Real:"
            }</span>
            <span class="receipt-row-value">${volumenReal} m³</span>
          </div>
          `
              : ""
          }

          ${
            peso && esCopiaBlanca && !esTipo3
              ? `
          <div class="receipt-row">
            <span class="receipt-row-label">Peso:</span>
            <span class="receipt-row-value">${peso} Ton</span>
          </div>
          `
              : ""
          }

          ${
            folioBanco && esCopiaBlanca && !esTipo3
              ? `
          <div class="receipt-row">
            <span class="receipt-row-label">Folio Banco:</span>
            <span class="receipt-row-value">${folioBanco}</span>
          </div>
          `
              : ""
          }
        </div>

        ${
          tienePrecio
            ? `
        <!-- TARIFAS Y COSTO - COMENTADO PARA PRIVACIDAD -->
        <!--
        <div class="receipt-section">
          <div class="section-title">TARIFAS</div>
          <div class="receipt-row">
            <span class="receipt-row-label">1er Km:</span>
            <span class="receipt-row-value">${tarifaPrimerKm}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Subsecuente:</span>
            <span class="receipt-row-value">${tarifaSubsecuente}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Precio/m³:</span>
            <span class="receipt-row-value">${precioM3}</span>
          </div>
          <div class="total-row">
            <span>TOTAL:</span>
            <span>${costoTotal} MXN</span>
          </div>
        </div>
        -->
        `
            : ""
        }

        <!-- OPERADOR -->
        <div class="receipt-section">
          <div class="section-title">OPERADOR</div>
          <div class="receipt-full">
            <span class="receipt-full-value">${operador}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Placas:</span>
            <span class="receipt-row-value">${placas}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Sindicato:</span>
            <span class="receipt-row-value">${sindicato}</span>
          </div>
        </div>

        <!-- CREÓ Y COMPUTÓ -->
        <div class="receipt-section">
          <div class="receipt-row">
            <span class="receipt-row-label">Creado por:</span>
            <span class="receipt-row-value" style="font-size: 5px;">${creador}</span>
          </div>
          ${
            computador
              ? `
          <div class="receipt-row">
            <span class="receipt-row-label">Completado por:</span>
            <span class="receipt-row-value" style="font-size: 5px;">${computador}</span>
          </div>
          `
              : ""
          }
        </div>

        ${
          notas
            ? `
        <!-- NOTAS -->
        <div class="receipt-section">
          <div class="section-title">NOTAS</div>
          <div class="notas-section">
            ${notas}
          </div>
        </div>
        `
            : ""
        }

        <!-- QR CODE -->
        <div class="qr-section">
          <img src="${qrDataUrl}" alt="QR">
          <div class="qr-text">Escanear para verificar</div>
          <div class="qr-url">${
            valeData.qr_verification_url || `verify.app/${valeData.folio}`
          }</div>
        </div>

        <!-- FOOTER -->
        <div class="receipt-footer">
          <div class="copia-badge">COPIA ${colorCopia.toUpperCase()}</div>
          <div class="copia-destinatario">${destinatario}</div>
          <div class="fecha-emision">
            Emitida: ${fechaFormateada} ${horaFormateada}
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
};

/**
 * Genera y comparte PDF de vale de MATERIAL en formato recibo
 */
export const generateAndShareMaterialRecibo = async (
  valeData,
  colorCopia,
  qrDataUrl,
) => {
  try {
    console.log("[pdfMaterialGeneratorRecibo] Generando PDF recibo:", {
      folio: valeData.folio,
      colorCopia,
    });

    const html = generateValeMaterialReciboHTML(
      valeData,
      colorCopia,
      qrDataUrl,
    );

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 189,
      height: 1134, // 300mm @ 96dpi — una sola página garantizada
    });
    const renamedUri = await renamePDFWithAutoName(
      uri,
      valeData.folio,
      colorCopia,
    );

    console.log(
      "[pdfMaterialGeneratorRecibo] PDF generado exitosamente:",
      renamedUri,
    );

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(renamedUri, {
        mimeType: "application/pdf",
        dialogTitle: `Vale de Material ${valeData.folio}`,
        UTI: "com.adobe.pdf",
      });
    } else {
      console.warn("[pdfMaterialGeneratorRecibo] Sharing no disponible");
    }

    return renamedUri;
  } catch (error) {
    console.error(
      "[pdfMaterialGeneratorRecibo] Error generando PDF recibo:",
      error,
    );
    throw error;
  }
};
