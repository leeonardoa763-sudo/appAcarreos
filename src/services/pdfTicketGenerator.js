/**
 * services/pdfTicketGenerator.js
 *
 * Generador de PDF estilo ticket termico para compartir por WhatsApp
 * Mismo contenido que el ticket fisico pero sin QR y sin color de fondo
 * Ancho reducido similar a rollo de 58mm
 *
 * CAMBIOS:
 * - Material: quitar cantidad pedida, agregar tabla compacta de viajes
 *   con columnas: remision | ton | m3 | hora
 * - Totales al final de la tabla (viajes, ton total, m3 total)
 * - Persona que completo el vale
 * - Renta: sin cambios
 */

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { renamePDFWithAutoName } from "./pdfFileHandler";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const traducirEstado = (estado) => {
  const estados = {
    en_proceso: "EN PROCESO",
    emitido: "EMITIDO",
    verificado: "VERIFICADO",
    conciliado: "CONCILIADO",
    archivado: "ARCHIVADO",
    cancelado: "CANCELADO",
  };
  return estados[estado] || estado?.toUpperCase() || "N/A";
};

const formatearFecha = (fecha) => {
  if (!fecha) return "N/A";
  const date = new Date(fecha);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

const formatearHora = (fecha) => {
  if (!fecha) return "";
  const date = new Date(fecha);
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// ─── CSS base compartido ──────────────────────────────────────────────────────

const CSS_BASE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 58mm auto; margin: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    width: 58mm;
    margin: 0 auto;
    padding: 3mm;
    background: #FFFFFF;
    color: #000000;
    font-size: 8px;
    line-height: 1.4;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .empresa { font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 1mm; }
  .titulo { font-size: 9px; font-weight: bold; text-align: center; margin-bottom: 1mm; }
  .folio { font-size: 10px; font-weight: bold; text-align: center; margin-bottom: 1mm; }
  .fecha { font-size: 7px; text-align: center; margin-bottom: 1mm; }
  .estado-badge {
    text-align: center; font-size: 8px; font-weight: bold;
    border: 1px solid #000; padding: 1mm 2mm;
    display: inline-block; margin: 1mm auto;
  }
  .estado-container { text-align: center; margin-bottom: 2mm; }
  .separador { border-top: 1px dashed #000; margin: 2mm 0; }
  .label { font-size: 7px; color: #555; margin-bottom: 0.5mm; }
  .valor { font-size: 8px; font-weight: bold; margin-bottom: 1.5mm; word-break: break-word; }
  .fila { display: flex; justify-content: space-between; margin-bottom: 1mm; }
  .fila-label { font-size: 7px; color: #555; }
  .fila-valor { font-size: 7px; font-weight: bold; text-align: right; }
  .footer {
    text-align: center; margin-top: 2mm; padding-top: 2mm;
    border-top: 1px dashed #000; font-size: 6px; color: #555;
  }
  /* Tabla compacta de viajes */
  .viajes-titulo {
    font-size: 7px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 1mm;
    text-transform: uppercase;
  }
  .viajes-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 6px;
    margin-bottom: 1.5mm;
  }
  .viajes-table th {
    font-weight: bold;
    text-align: center;
    border-bottom: 1px solid #000;
    padding: 0.4mm 0.2mm;
    font-size: 6px;
  }
  .viajes-table th:first-child { text-align: left; }
  .viajes-table td {
    text-align: center;
    padding: 0.3mm 0.2mm;
    border-bottom: 0.3px solid #ccc;
    font-size: 6px;
    word-break: break-all;
  }
  .viajes-table td:first-child { text-align: left; }
  .viajes-table tr:last-child td { border-bottom: none; }
  .viajes-totales {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #000;
    padding-top: 1mm;
    margin-top: 0.5mm;
  }
  .viajes-totales-item { text-align: center; }
  .viajes-totales-label { font-size: 5px; color: #555; display: block; }
  .viajes-totales-valor { font-size: 7px; font-weight: bold; display: block; }
`;

// ─── Tabla de viajes para material ───────────────────────────────────────────

const generarTablaViajes = (viajes, esTipo3) => {
  if (!viajes || viajes.length === 0) {
    return `<div style="font-size:6px;color:#888;text-align:center;margin:1mm 0;">Sin viajes registrados</div>`;
  }

  const filas = viajes
    .map((v) => {
      const remision = v.folio_vale_fisico || "--";
      const ton =
        !esTipo3 && v.peso_ton ? parseFloat(v.peso_ton).toFixed(1) : "--";
      const m3 = v.volumen_m3 ? parseFloat(v.volumen_m3).toFixed(2) : "--";
      const hora = formatearHora(v.hora_registro);
      return `
        <tr>
          <td>${remision}</td>
          <td>${ton}</td>
          <td>${m3}</td>
          <td>${hora}</td>
        </tr>`;
    })
    .join("");

  // Totales
  const totalViajes = viajes.length;
  const totalM3 = viajes.reduce(
    (acc, v) => acc + parseFloat(v.volumen_m3 || 0),
    0,
  );
  const totalTon = !esTipo3
    ? viajes.reduce((acc, v) => acc + parseFloat(v.peso_ton || 0), 0)
    : null;

  const totalesHTML = `
    <div class="viajes-totales">
      <div class="viajes-totales-item">
        <span class="viajes-totales-label">Viajes</span>
        <span class="viajes-totales-valor">${totalViajes}</span>
      </div>
      ${
        totalTon !== null
          ? `
      <div class="viajes-totales-item">
        <span class="viajes-totales-label">Total Ton</span>
        <span class="viajes-totales-valor">${totalTon.toFixed(2)}</span>
      </div>`
          : ""
      }
      <div class="viajes-totales-item">
        <span class="viajes-totales-label">Total m3</span>
        <span class="viajes-totales-valor">${totalM3.toFixed(2)}</span>
      </div>
    </div>`;

  return `
    <table class="viajes-table">
      <thead>
        <tr>
          <th>Remision</th>
          <th>${esTipo3 ? "--" : "Ton"}</th>
          <th>m3</th>
          <th>Hora</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    ${totalesHTML}`;
};

// ─── HTML ticket MATERIAL ─────────────────────────────────────────────────────

const generarHTMLTicket = (valeData) => {
  const detalle = valeData?.vale_material_detalles?.[0] || {};
  const cc = valeData.obras?.cc || "";
  const nombreObra = valeData.obras?.obra || "N/A";
  const obra = cc ? `${cc} - ${nombreObra}` : nombreObra;
  const empresa = valeData.obras?.empresas?.empresa || "CONSTRUCCION";
  const operador = valeData.operadores?.nombre_completo || "N/A";
  const placas = valeData.vehiculos?.placas || "N/A";
  const sindicato =
    detalle?.sindicatos?.sindicato ||
    valeData.vehiculos?.sindicatos?.sindicato ||
    "N/A";
  const material = detalle.material?.material || "N/A";
  const banco = detalle.bancos?.banco || "N/A";
  const capacidad =
    (valeData.vehiculos?.capacidad_m3 ?? detalle.capacidad_m3)
      ? `${valeData.vehiculos?.capacidad_m3 ?? detalle.capacidad_m3} m3`
      : "N/A";
  const distancia = detalle.distancia_km ? `${detalle.distancia_km} km` : "N/A";
  const requisicion = detalle.requisicion || null;
  const notas = detalle.notas_adicionales || null;

  const esTipo3 = detalle.material?.id_tipo_de_material === 3;
  const viajes = detalle.vale_material_viajes || [];

  const fecha = formatearFecha(valeData.fecha_creacion);
  const hora = formatearHora(valeData.fecha_creacion);
  const fechaEmision = formatearFecha(new Date());
  const horaEmision = formatearHora(new Date());
  const estado = traducirEstado(valeData.estado);
  const folio = valeData.folio || "N/A";

  // Persona que completo
  const completador = valeData.persona_completador
    ? `${valeData.persona_completador.nombre} ${valeData.persona_completador.primer_apellido}`.trim()
    : null;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${CSS_BASE}</style>
    </head>
    <body>
      <div class="empresa">${empresa}</div>
      <div class="titulo">VALE DE MATERIAL</div>
      <div class="folio">${folio}</div>
      <div class="fecha">Creacion: ${fecha} ${hora}</div>
      <div class="fecha">Emision: ${fechaEmision} ${horaEmision}</div>
      <div class="estado-container">
        <span class="estado-badge">${estado}</span>
      </div>

      <div class="separador"></div>

      <div class="label">OBRA:</div>
      <div class="valor">${obra}</div>
      <div class="fila">
        <span class="fila-label">BANCO:</span>
        <span class="fila-valor">${banco}</span>
      </div>

      <div class="separador"></div>

      <div class="fila">
        <span class="fila-label">MATERIAL:</span>
        <span class="fila-valor">${material}</span>
      </div>
      <div class="fila">
        <span class="fila-label">CAPACIDAD:</span>
        <span class="fila-valor">${capacidad}</span>
      </div>
      <div class="fila">
        <span class="fila-label">DISTANCIA:</span>
        <span class="fila-valor">${distancia}</span>
      </div>
      ${
        requisicion
          ? `
      <div class="fila">
        <span class="fila-label">REQUISICION:</span>
        <span class="fila-valor">${requisicion}</span>
      </div>`
          : ""
      }

      <div class="separador"></div>

      <div class="label">OPERADOR:</div>
      <div class="valor">${operador}</div>
      <div class="fila">
        <span class="fila-label">PLACAS:</span>
        <span class="fila-valor">${placas}</span>
      </div>
      <div class="fila">
        <span class="fila-label">SINDICATO:</span>
        <span class="fila-valor">${sindicato}</span>
      </div>

      <div class="separador"></div>

      <div class="viajes-titulo">VIAJES REGISTRADOS</div>
      ${generarTablaViajes(viajes, esTipo3)}

      ${
        completador
          ? `
      <div class="separador"></div>
      <div class="fila">
        <span class="fila-label">COMPLETO POR:</span>
        <span class="fila-valor">${completador}</span>
      </div>`
          : ""
      }

      ${
        notas
          ? `
      <div class="separador"></div>
      <div class="label">NOTAS:</div>
      <div class="valor">${notas}</div>`
          : ""
      }

      <div class="footer">
        Generado: ${fechaEmision} ${horaEmision}
      </div>
    </body>
    </html>
  `;
};

// ─── HTML ticket RENTA (sin cambios de estructura) ────────────────────────────

const generarHTMLTicketRenta = (valeData) => {
  const detalle = valeData?.vale_renta_detalle?.[0] || {};
  const cc = valeData.obras?.cc || "";
  const nombreObra = valeData.obras?.obra || "N/A";
  const obra = cc ? `${cc} - ${nombreObra}` : nombreObra;
  const empresa = valeData.obras?.empresas?.empresa || "CONSTRUCCION";
  const operador = valeData.operadores?.nombre_completo || "N/A";
  const placas = valeData.vehiculos?.placas || "N/A";
  const sindicato = valeData.vehiculos?.sindicatos?.sindicato || "N/A";
  const material = detalle.material?.material || "N/A";
  const capacidad = detalle.capacidad_m3 ? `${detalle.capacidad_m3} m3` : "N/A";
  const notas = detalle.notas_adicionales || null;

  const esRentaPorDia = detalle.es_renta_por_dia === true;
  const esRentaPorMedioDia = detalle.total_dias === 0.5;

  const horaInicio = detalle.hora_inicio
    ? formatearHora(detalle.hora_inicio)
    : "N/A";
  const horaFin = esRentaPorDia
    ? "Dia completo"
    : esRentaPorMedioDia
      ? "Medio dia"
      : detalle.hora_fin
        ? formatearHora(detalle.hora_fin)
        : "Pendiente";

  const totalHoras =
    esRentaPorDia || esRentaPorMedioDia
      ? null
      : detalle.total_horas
        ? `${detalle.total_horas} hrs`
        : null;

  const totalDias = esRentaPorDia
    ? "1 dia"
    : esRentaPorMedioDia
      ? "0.5 dias"
      : null;

  const fecha = formatearFecha(valeData.fecha_creacion);
  const hora = formatearHora(valeData.fecha_creacion);
  const estado = traducirEstado(valeData.estado);
  const folio = valeData.folio || "N/A";

  // Persona que completo
  const completador = valeData.persona_completador
    ? `${valeData.persona_completador.nombre} ${valeData.persona_completador.primer_apellido}`.trim()
    : null;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${CSS_BASE}</style>
    </head>
    <body>
      <div class="empresa">${empresa}</div>
      <div class="titulo">VALE DE RENTA</div>
      <div class="folio">${folio}</div>
      <div class="fecha">${fecha} ${hora}</div>
      <div class="estado-container">
        <span class="estado-badge">${estado}</span>
      </div>

      <div class="separador"></div>

      <div class="label">OBRA:</div>
      <div class="valor">${obra}</div>

      <div class="separador"></div>

      <div class="fila">
        <span class="fila-label">MATERIAL:</span>
        <span class="fila-valor">${material}</span>
      </div>
      <div class="fila">
        <span class="fila-label">CAPACIDAD:</span>
        <span class="fila-valor">${capacidad}</span>
      </div>
      <div class="fila">
        <span class="fila-label">SINDICATO:</span>
        <span class="fila-valor">${sindicato}</span>
      </div>

      <div class="separador"></div>

      <div class="fila">
        <span class="fila-label">HORA INICIO:</span>
        <span class="fila-valor">${horaInicio}</span>
      </div>
      <div class="fila">
        <span class="fila-label">HORA FIN:</span>
        <span class="fila-valor">${horaFin}</span>
      </div>
      ${
        totalHoras
          ? `
      <div class="fila">
        <span class="fila-label">TOTAL HORAS:</span>
        <span class="fila-valor">${totalHoras}</span>
      </div>`
          : ""
      }
      ${
        totalDias
          ? `
      <div class="fila">
        <span class="fila-label">TOTAL DIAS:</span>
        <span class="fila-valor">${totalDias}</span>
      </div>`
          : ""
      }

      <div class="separador"></div>

      <div class="label">OPERADOR:</div>
      <div class="valor">${operador}</div>
      <div class="fila">
        <span class="fila-label">PLACAS:</span>
        <span class="fila-valor">${placas}</span>
      </div>

      ${
        completador
          ? `
      <div class="fila">
        <span class="fila-label">COMPLETO POR:</span>
        <span class="fila-valor">${completador}</span>
      </div>`
          : ""
      }

      ${
        notas
          ? `
      <div class="separador"></div>
      <div class="label">NOTAS:</div>
      <div class="valor">${notas}</div>`
          : ""
      }

      <div class="footer">Generado: ${formatearFecha(new Date())} ${formatearHora(new Date())}</div>
    </body>
    </html>
  `;
};

// ─── Exportaciones ────────────────────────────────────────────────────────────

/**
 * Genera y comparte PDF del ticket de MATERIAL por WhatsApp
 */
export const generarYCompartirPDFTicket = async (valeData) => {
  try {
    const html = generarHTMLTicket(valeData);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 219,
      // Sin height fijo: se ajusta al contenido segun viajes
    });

    const nuevoUri = await renamePDFWithAutoName(uri, valeData.folio, "ticket");

    const disponible = await Sharing.isAvailableAsync();
    if (!disponible)
      throw new Error("Compartir no disponible en este dispositivo");

    await Sharing.shareAsync(nuevoUri, {
      mimeType: "application/pdf",
      dialogTitle: `Ticket ${valeData.folio}`,
      UTI: "com.adobe.pdf",
    });

    return nuevoUri;
  } catch (error) {
    throw new Error("No se pudo generar el PDF del ticket");
  }
};

/**
 * Genera y comparte PDF del ticket de RENTA por WhatsApp
 */
export const generarYCompartirPDFTicketRenta = async (valeData) => {
  try {
    const html = generarHTMLTicketRenta(valeData);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 219,
      height: 500,
    });

    const nuevoUri = await renamePDFWithAutoName(
      uri,
      valeData.folio,
      "ticket-renta",
    );

    const disponible = await Sharing.isAvailableAsync();
    if (!disponible)
      throw new Error("Compartir no disponible en este dispositivo");

    await Sharing.shareAsync(nuevoUri, {
      mimeType: "application/pdf",
      dialogTitle: `Ticket ${valeData.folio}`,
      UTI: "com.adobe.pdf",
    });

    return nuevoUri;
  } catch (error) {
    throw new Error("No se pudo generar el PDF del ticket de renta");
  }
};
