/**
 * services/pdfMaterialGeneratorRecibo.js
 *
 * Generador de PDFs estilo RECIBO TERMICO para vales de MATERIAL
 * Disenado para impresoras de recibos con rollo de 50mm
 *
 * LOGICA DE COPIAS:
 * - Copia ROJA (preliminar): se genera al crear el vale (tipo 1 y 2)
 * - Copia BLANCA (definitiva): se genera al completar el vale
 * - Tipo 3 (Tepetate): solo genera copia BLANCA con cantidad final
 *
 * NUEVO DISENO:
 * - Sin campo "Cantidad Pedida"
 * - Tabla compacta de viajes: remision | tonelaje | m3 | hora
 * - Peso volumetrico total
 * - Persona que completo el vale
 * - Fecha de creacion y fecha de emision del vale
 * - Todo en una sola pagina
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

// ─── Helpers locales ──────────────────────────────────────────────────────────

const formatHora = (isoString) => {
  if (!isoString) return "--";
  return new Date(isoString).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatFechaCorta = (isoString) => {
  if (!isoString) return "--";
  return new Date(isoString).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

// ─── CSS adicional para tabla de viajes ───────────────────────────────────────

const getTablaViajesCSS = () => `
  .viajes-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 5px;
    margin-top: 0.5mm;
  }
  .viajes-table th {
    background-color: #000 !important;
    color: #FFF !important;
    font-weight: bold;
    text-align: center;
    padding: 0.5mm 0.3mm;
    font-size: 4.5px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .viajes-table td {
    text-align: center;
    padding: 0.4mm 0.3mm;
    border-bottom: 0.3px solid #ccc;
    font-size: 4.5px;
    word-break: break-all;
  }
  .viajes-table tr:last-child td {
    border-bottom: none;
  }
  .viajes-table .td-remision {
    text-align: left;
    max-width: 18mm;
    word-break: break-all;
  }
  .viajes-totales {
    display: flex;
    justify-content: space-between;
    margin-top: 0.8mm;
    padding-top: 0.8mm;
    border-top: 0.5px solid #000;
    font-size: 5px;
  }
  .viajes-totales-item {
    text-align: center;
  }
  .viajes-totales-label {
    font-size: 4px;
    color: #555;
    display: block;
  }
  .viajes-totales-valor {
    font-weight: bold;
    font-size: 5.5px;
    display: block;
  }
  .peso-volumetrico-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5mm;
    padding: 0.5mm;
    background-color: #f0f0f0 !important;
    border: 0.3px solid #999;
    font-size: 5px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sin-viajes {
    text-align: center;
    font-size: 5px;
    color: #888;
    padding: 1mm 0;
    font-style: italic;
  }
`;

// ─── Generador de filas de viajes ─────────────────────────────────────────────

const generarFilasViajes = (viajes, esTipo3) => {
  if (!viajes || viajes.length === 0) {
    return `<tr><td colspan="4" class="sin-viajes">Sin viajes registrados</td></tr>`;
  }

  return viajes
    .map((v) => {
      const remision = v.folio_vale_fisico || "--";
      const tonelaje = v.peso_ton ? parseFloat(v.peso_ton).toFixed(2) : "--";
      const m3 = v.volumen_m3 ? parseFloat(v.volumen_m3).toFixed(2) : "--";
      const hora = formatHora(v.hora_registro);

      return `
      <tr>
        <td class="td-remision">${remision}</td>
        <td>${esTipo3 ? "--" : tonelaje}</td>
        <td>${m3}</td>
        <td>${hora}</td>
      </tr>
    `;
    })
    .join("");
};

// ─── Generador de totales de viajes ──────────────────────────────────────────

const generarTotalesViajes = (viajes, esTipo3, volumenRealTotal, pesoTotal) => {
  const totalViajes = viajes?.length || 0;
  const totalM3 = volumenRealTotal
    ? `${parseFloat(volumenRealTotal).toFixed(2)} m³`
    : "--";
  const totalTon =
    !esTipo3 && pesoTotal ? `${parseFloat(pesoTotal).toFixed(2)} Ton` : "--";

  return `
    <div class="viajes-totales">
      <div class="viajes-totales-item">
        <span class="viajes-totales-label">Viajes</span>
        <span class="viajes-totales-valor">${totalViajes}</span>
      </div>
      ${
        !esTipo3
          ? `
      <div class="viajes-totales-item">
        <span class="viajes-totales-label">Total Ton</span>
        <span class="viajes-totales-valor">${totalTon}</span>
      </div>
      `
          : ""
      }
      <div class="viajes-totales-item">
        <span class="viajes-totales-label">Total m³</span>
        <span class="viajes-totales-valor">${totalM3}</span>
      </div>
    </div>
  `;
};

// ─── HTML principal ───────────────────────────────────────────────────────────

const generateValeMaterialReciboHTML = (valeData, colorCopia, qrDataUrl) => {
  const { bgColor, destinatario } = getCopiaInfoRecibo(colorCopia);

  // Fechas
  const fechaCreacionFormateada = formatFechaCorta(valeData.fecha_creacion);
  const horaCreacionFormateada = formatHora(valeData.fecha_creacion);
  const fechaEmisionFormateada = formatearFechaRecibo(new Date());
  const horaEmisionFormateada = formatearHoraRecibo(new Date());

  const esCopiaBlanca = colorCopia.toLowerCase() === "blanca";

  // Datos base del detalle
  const detalle = valeData.vale_material_detalles?.[0] || {};
  const material = detalle.material?.material || "N/A";
  const banco = detalle.bancos?.banco || "N/A";
  const capacidad =
    valeData.vehiculos?.capacidad_m3 ?? detalle.capacidad_m3 ?? "N/A";
  const distancia = detalle.distancia_km || "N/A";
  const requisicion = detalle.requisicion || null;
  const folioValeFisico = detalle.folio_vale_fisico
    ? String(detalle.folio_vale_fisico)
    : null;

  const esTipo3 = detalle.material?.id_tipo_de_material === 3;

  // Datos post-completado

  const pesoTotal = detalle.peso_ton || null;
  const volumenReal = detalle.volumen_real_m3 || null;

  // Factor peso volumetrico: peso_ton / volumen_real_m3 redondeado a 2 decimales
  const factorPesoVolumetrico =
    pesoTotal && volumenReal && parseFloat(volumenReal) > 0
      ? (parseFloat(pesoTotal) / parseFloat(volumenReal)).toFixed(2)
      : null;

  // Viajes registrados (vienen en vale_material_detalles[0].vale_material_viajes)
  const viajes = detalle.vale_material_viajes || [];

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

  // Personas
  const creador = valeData.persona
    ? `${valeData.persona.nombre} ${valeData.persona.primer_apellido}${
        valeData.persona.segundo_apellido
          ? " " + valeData.persona.segundo_apellido
          : ""
      }`.trim()
    : "N/A";

  const completador = valeData.persona_completador
    ? `${valeData.persona_completador.nombre} ${valeData.persona_completador.primer_apellido}${
        valeData.persona_completador.segundo_apellido
          ? " " + valeData.persona_completador.segundo_apellido
          : ""
      }`.trim()
    : null;

  const notas = detalle.notas_adicionales?.trim() || null;

  // ─── LOGS DE DIAGNÓSTICO ──────────────────────────────────────────────────
  viajes.forEach((v, i) => {
  });
  // ─────────────────────────────────────────────────────────────────────────

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recibo ${valeData.folio}</title>
      <style>
        ${getReceiptBaseCSS(bgColor)}
        ${getTablaViajesCSS()}
      </style>
    </head>
    <body>
      <div class="receipt-container">

        <!-- HEADER -->
        <div class="receipt-header">
          <h1>${empresa}</h1>
          <h2>VALE DE MATERIAL</h2>
          <div class="folio">No. ${valeData.folio}</div>
        </div>

        <!-- FECHAS: CREACION Y EMISION -->
        <div class="receipt-section">
          <div class="receipt-row">
            <span class="receipt-row-label">Fecha creacion:</span>
            <span class="receipt-row-value">${fechaCreacionFormateada} ${horaCreacionFormateada}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-label">Fecha emision:</span>
            <span class="receipt-row-value">${fechaEmisionFormateada} ${horaEmisionFormateada}</span>
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
          ${
            requisicion
              ? `
          <div class="receipt-row">
            <span class="receipt-row-label">Requisicion:</span>
            <span class="receipt-row-value">${requisicion}</span>
          </div>
          `
              : ""
          }
          ${
            folioValeFisico && esTipo3
              ? `
          <div class="receipt-row">
            <span class="receipt-row-label">Vale Fisico:</span>
            <span class="receipt-row-value">${folioValeFisico}</span>
          </div>
          `
              : ""
          }
          
         ${
           factorPesoVolumetrico && esCopiaBlanca && !esTipo3
             ? `
          <div class="receipt-row">
            <span class="receipt-row-label">Factor vol.:</span>
            <span class="receipt-row-value">${factorPesoVolumetrico}</span>
          </div>
          `
             : ""
         }
        </div>

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

        <!-- TABLA DE VIAJES — solo en copia blanca cuando hay viajes -->
        ${
          esCopiaBlanca
            ? `
        <div class="receipt-section">
          <div class="section-title">VIAJES REGISTRADOS</div>
          <table class="viajes-table">
            <thead>
              <tr>
                <th style="text-align:left;">Remision</th>
                <th>${esTipo3 ? "--" : "Ton"}</th>
                <th>m³</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              ${generarFilasViajes(viajes, esTipo3)}
            </tbody>
          </table>
          ${generarTotalesViajes(viajes, esTipo3, volumenReal, pesoTotal)}
        </div>
        `
            : ""
        }

        <!-- PERSONAS -->
        <div class="receipt-section">
          <div class="receipt-row">
            <span class="receipt-row-label">Creado por:</span>
            <span class="receipt-row-value" style="font-size:5px;">${creador}</span>
          </div>
          ${
            completador
              ? `
          <div class="receipt-row">
            <span class="receipt-row-label">Completo por:</span>
            <span class="receipt-row-value" style="font-size:5px;">${completador}</span>
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
          <div class="notas-section">${notas}</div>
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
            Emitida: ${fechaEmisionFormateada} ${horaEmisionFormateada}
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
};

// ─── Exportación principal ────────────────────────────────────────────────────

/**
 * Genera y comparte PDF de vale de MATERIAL en formato recibo
 */
export const generateAndShareMaterialRecibo = async (
  valeData,
  colorCopia,
  qrDataUrl,
) => {
  try {
    const html = generateValeMaterialReciboHTML(
      valeData,
      colorCopia,
      qrDataUrl,
    );

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 189,
      // Sin height fijo: se ajusta al contenido automaticamente
    });

    const renamedUri = await renamePDFWithAutoName(
      uri,
      valeData.folio,
      colorCopia,
    );

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(renamedUri, {
        mimeType: "application/pdf",
        dialogTitle: `Vale de Material ${valeData.folio}`,
        UTI: "com.adobe.pdf",
      });
    }

    return renamedUri;
  } catch (error) {
    console.error("[pdfMaterialGeneratorRecibo] Error generando PDF:", error);
    throw error;
  }
};
