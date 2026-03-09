/**
 * services/pdfRentaGeneratorRecibo.js
 *
 * Generador de PDFs estilo RECIBO TÉRMICO para vales de RENTA
 * Diseñado para impresoras de recibos con rollo de 50mm
 * Mantiene la misma lógica de copias rojas/blancas que el sistema actual
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
 * Genera HTML del vale de RENTA en formato recibo térmico
 */
const generateValeRentaReciboHTML = (valeData, colorCopia, qrDataUrl) => {
  const { bgColor, destinatario } = getCopiaInfoRecibo(colorCopia);

  const fechaFormateada = formatearFechaRecibo(
    valeData.fecha_completado || valeData.fecha_creacion,
  );
  const horaFormateada = formatearHoraRecibo(
    valeData.fecha_completado || valeData.fecha_creacion,
  );

  // Extraer datos del vale de RENTA
  const detalle = valeData.vale_renta_detalle?.[0] || {};
  const material = detalle.material?.material || "N/A";
  const capacidad = detalle.capacidad_m3 || "N/A";
  const numeroViajes = detalle.numero_viajes || 1;

  // Detectar si es renta por día
  const esRentaPorDia = detalle.es_renta_por_dia === true;
  const esRentaPorMedioDia = detalle.total_dias === 0.5;

  // Formatear horas
  const horaInicio = detalle.hora_inicio
    ? formatearHoraRecibo(detalle.hora_inicio)
    : "N/A";

  const horaFin = esRentaPorDia
    ? "Día completo"
    : esRentaPorMedioDia
      ? "Medio día"
      : detalle.hora_fin
        ? formatearHoraRecibo(detalle.hora_fin)
        : "Pendiente";

  // Formatear totales
  const totalHoras =
    esRentaPorDia || esRentaPorMedioDia
      ? "N/A"
      : detalle.total_horas
        ? `${detalle.total_horas} hrs`
        : "N/A";

  const totalDias = esRentaPorDia
    ? "1 día"
    : esRentaPorMedioDia
      ? "0.5 días"
      : "N/A";

  // Obtener tarifas
  const precioRenta = detalle.precios_renta || {};
  const tarifaHora = precioRenta.costo_hr
    ? `$${parseFloat(precioRenta.costo_hr).toFixed(2)}`
    : "N/A";
  const tarifaDia = precioRenta.costo_dia
    ? `$${parseFloat(precioRenta.costo_dia).toFixed(2)}`
    : "N/A";

  // Calcular costo total
  let costoTotal;
  if (esRentaPorDia && precioRenta.costo_dia) {
    costoTotal = `$${parseFloat(precioRenta.costo_dia).toFixed(2)} MXN`;
    console.log("[pdfRentaGenerator] Costo calculado por día:", costoTotal);
  } else if (esRentaPorMedioDia && precioRenta.costo_dia) {
    const costo = parseFloat(precioRenta.costo_dia) / 2;
    costoTotal = `$${costo.toFixed(2)} MXN`;
    console.log(
      "[pdfRentaGenerator] Costo calculado por medio día:",
      costoTotal,
    );
  } else if (
    !esRentaPorDia &&
    !esRentaPorMedioDia &&
    precioRenta.costo_hr &&
    detalle.total_horas
  ) {
    const costo =
      parseFloat(precioRenta.costo_hr) * parseFloat(detalle.total_horas);
    costoTotal = `$${costo.toFixed(2)}`;
  } else if (detalle.costo_total) {
    costoTotal = `$${parseFloat(detalle.costo_total).toFixed(2)}`;
  } else {
    costoTotal = "Pendiente";
  }

  // Datos de obra y empresa
  // Datos de obra y empresa
  const cc = valeData.obras?.cc || "";
  const nombreObra = valeData.obras?.obra || "N/A";
  const obra = cc ? `${cc} - ${nombreObra}` : nombreObra;
  const empresa = valeData.obras?.empresas?.empresa || "CONSTRUCCION";
  const operador = valeData.operadores?.nombre_completo || "Pendiente";
  const placas = valeData.vehiculos?.placas || "Pendiente";
  const sindicato = detalle.sindicatos?.sindicato || "Pendiente";

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
          <h2>VALE DE RENTA</h2>
          <div class="folio">No. ${valeData.folio}</div>
          <div style="font-size: 6px; margin-top: 1mm;">
            ${fechaFormateada} ${horaFormateada}
          </div>
        </div>

        <!-- OBRA -->
        <div class="receipt-section">
          <div class="receipt-full">
            <span class="receipt-full-label">OBRA:</span>
            <span class="receipt-full-value">${obra}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Sindicato:</span>
            <span class="receipt-row-value">${sindicato}</span>
          </div>
        </div>

        <!-- SERVICIO DE RENTA -->
        <div class="receipt-section">
          <div class="section-title">SERVICIO</div>
          <div class="receipt-row">
            <span class="receipt-row-label">Material:</span>
            <span class="receipt-row-value">${material}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Capacidad:</span>
            <span class="receipt-row-value">${capacidad} m³</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Viajes:</span>
            <span class="receipt-row-value">${numeroViajes}</span>
          </div>
        </div>

        <!-- TIEMPOS -->
        <div class="receipt-section">
          <div class="section-title">TIEMPOS</div>
          <div class="receipt-row">
            <span class="receipt-row-label">Inicio:</span>
            <span class="receipt-row-value">${horaInicio}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Fin:</span>
            <span class="receipt-row-value">${horaFin}</span>
          </div>
          <div class="divider"></div>
          <div class="receipt-row">
            <span class="receipt-row-label">Total Horas:</span>
            <span class="receipt-row-value">${totalHoras}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Total Dias:</span>
            <span class="receipt-row-value">${totalDias}</span>
          </div>
        </div>

        <!-- TARIFAS Y COSTO - COMENTADO PARA PRIVACIDAD -->
        <!--
        <div class="receipt-section">
          <div class="section-title">TARIFAS</div>
          <div class="receipt-row">
            <span class="receipt-row-label">Tarifa/Hora:</span>
            <span class="receipt-row-value">${tarifaHora}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Tarifa/Dia:</span>
            <span class="receipt-row-value">${tarifaDia}</span>
          </div>
          <div class="total-row">
            <span>TOTAL:</span>
            <span>${costoTotal} MXN</span>
          </div>
        </div>
        -->

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
            <span class="receipt-row-label">Completo por:</span>
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
 * Genera y comparte PDF de vale de RENTA en formato recibo
 */
export const generateAndShareRentaRecibo = async (
  valeData,
  colorCopia,
  qrDataUrl,
) => {
  try {
    const html = generateValeRentaReciboHTML(valeData, colorCopia, qrDataUrl);

    // LOG TEMPORAL - medir altura real del contenido
    console.log("[pdfRentaGeneratorRecibo] HTML length:", html.length);
    console.log(
      "[pdfRentaGeneratorRecibo] Tiene notas:",
      !!valeData.vale_renta_detalle?.[0]?.notas_adicionales?.trim(),
    );
    console.log(
      "[pdfRentaGeneratorRecibo] Es renta por día:",
      valeData.vale_renta_detalle?.[0]?.es_renta_por_dia,
    );
    console.log(
      "[pdfRentaGeneratorRecibo] Computador presente:",
      !!valeData.persona_completador,
    );

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 189,
    });

    console.log("[pdfRentaGeneratorRecibo] URI generado:", uri);
    const renamedUri = await renamePDFWithAutoName(
      uri,
      valeData.folio,
      colorCopia,
    );

    console.log(
      "[pdfRentaGeneratorRecibo] PDF generado exitosamente:",
      renamedUri,
    );

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(renamedUri, {
        mimeType: "application/pdf",
        dialogTitle: `Vale de Renta ${valeData.folio}`,
        UTI: "com.adobe.pdf",
      });
    } else {
      console.warn("[pdfRentaGeneratorRecibo] Sharing no disponible");
    }

    return renamedUri;
  } catch (error) {
    console.error(
      "[pdfRentaGeneratorRecibo] Error generando PDF recibo:",
      error,
    );
    throw error;
  }
};
