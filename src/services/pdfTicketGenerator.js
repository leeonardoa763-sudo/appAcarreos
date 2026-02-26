/**
 * services/pdfTicketGenerator.js
 *
 * Generador de PDF estilo ticket térmico para compartir por WhatsApp
 * Mismo contenido que el ticket físico pero sin QR y sin color de fondo
 * Ancho reducido similar a rollo de 48mm
 */

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { renamePDFWithAutoName } from "./pdfFileHandler";

const traducirEstado = (estado) => {
  const estados = {
    en_proceso: "EN PROCESO",
    emitido: "EMITIDO",
    verificado: "VERIFICADO",
    conciliado: "CONCILIADO",
    archivado: "ARCHIVADO",
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

const generarHTMLTicket = (valeData) => {
  const detalle = valeData?.vale_material_detalles?.[0] || {};
  const cc = valeData.obras?.cc || "";
  const nombreObra = valeData.obras?.obra || "N/A";
  const obra = cc ? `${cc} - ${nombreObra}` : nombreObra;
  const empresa = valeData.obras?.empresas?.empresa || "CONSTRUCCION";
  const operador = valeData.operadores?.nombre_completo || "N/A";
  const placas = valeData.vehiculos?.placas || "N/A";
  const material = detalle.material?.material || "N/A";
  const banco = detalle.bancos?.banco || "N/A";
  const capacidad = detalle.capacidad_m3 ? `${detalle.capacidad_m3} m³` : "N/A";
  const cantidad = detalle.cantidad_pedida_m3
    ? `${detalle.cantidad_pedida_m3} m³`
    : "N/A";
  const distancia = detalle.distancia_km ? `${detalle.distancia_km} km` : "N/A";
  const fecha = formatearFecha(valeData.fecha_creacion);
  const hora = formatearHora(valeData.fecha_creacion);
  const estado = traducirEstado(valeData.estado);
  const folio = valeData.folio || "N/A";
  const requisicion = detalle.requisicion || null;
  const notas = detalle.notas_adicionales || null;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @page {
          size: 58mm auto;
          margin: 0;
        }

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
        .left { text-align: left; }
        .bold { font-weight: bold; }

        .empresa {
          font-size: 11px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 1mm;
        }

        .titulo {
          font-size: 9px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 1mm;
        }

        .folio {
          font-size: 10px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 1mm;
        }

        .fecha {
          font-size: 7px;
          text-align: center;
          margin-bottom: 1mm;
        }

        .estado-badge {
          text-align: center;
          font-size: 8px;
          font-weight: bold;
          border: 1px solid #000;
          padding: 1mm 2mm;
          display: inline-block;
          margin: 1mm auto;
        }

        .estado-container {
          text-align: center;
          margin-bottom: 2mm;
        }

        .separador {
          border-top: 1px dashed #000;
          margin: 2mm 0;
        }

        .label {
          font-size: 7px;
          color: #555;
          margin-bottom: 0.5mm;
        }

        .valor {
          font-size: 8px;
          font-weight: bold;
          margin-bottom: 1.5mm;
        }

        .fila {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
        }

        .fila-label {
          font-size: 7px;
          color: #555;
        }

        .fila-valor {
          font-size: 7px;
          font-weight: bold;
          text-align: right;
        }

        .footer {
          text-align: center;
          margin-top: 2mm;
          padding-top: 2mm;
          border-top: 1px dashed #000;
          font-size: 6px;
          color: #555;
        }
      </style>
    </head>
    <body>

      <!-- ENCABEZADO -->
      <div class="empresa">${empresa}</div>
      <div class="titulo">VALE DE MATERIAL</div>
      <div class="folio">${folio}</div>
      <div class="fecha">${fecha} ${hora}</div>

      <div class="estado-container">
        <span class="estado-badge">${estado}</span>
      </div>

      <div class="separador"></div>

      <!-- OBRA Y BANCO -->
      <div class="label">OBRA:</div>
      <div class="valor">${obra}</div>
      <div class="fila">
        <span class="fila-label">BANCO:</span>
        <span class="fila-valor">${banco}</span>
      </div>

      <div class="separador"></div>

      <!-- MATERIAL -->
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
      <div class="fila">
        <span class="fila-label">CANTIDAD:</span>
        <span class="fila-valor">${cantidad}</span>
      </div>

      <div class="separador"></div>

      ${
        requisicion
          ? `
<div class="fila">
  <span class="fila-label">REQUISICION:</span>
  <span class="fila-valor">${requisicion}</span>
</div>
`
          : ""
      }

${
  notas
    ? `
<div class="separador"></div>
<div class="label">NOTAS:</div>
<div class="valor">${notas}</div>
`
    : ""
}

      <!-- OPERADOR -->
      <div class="label">OPERADOR:</div>
      <div class="valor">${operador}</div>
      <div class="fila">
        <span class="fila-label">PLACAS:</span>
        <span class="fila-valor">${placas}</span>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        Generado: ${fecha} ${hora}
      </div>

    </body>
    </html>
  `;
};

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
  const capacidad = detalle.capacidad_m3 ? `${detalle.capacidad_m3} m³` : "N/A";
  const notas = detalle.notas_adicionales || null;

  const esRentaPorDia = detalle.es_renta_por_dia === true;
  const esRentaPorMedioDia = detalle.total_dias === 0.5;

  const horaInicio = detalle.hora_inicio
    ? formatearHora(detalle.hora_inicio)
    : "N/A";
  const horaFin = esRentaPorDia
    ? "Día completo"
    : esRentaPorMedioDia
      ? "Medio día"
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
    ? "1 día"
    : esRentaPorMedioDia
      ? "0.5 días"
      : null;

  const fecha = formatearFecha(valeData.fecha_creacion);
  const hora = formatearHora(valeData.fecha_creacion);
  const estado = traducirEstado(valeData.estado);
  const folio = valeData.folio || "N/A";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
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
        .valor { font-size: 8px; font-weight: bold; margin-bottom: 1.5mm; }
        .fila { display: flex; justify-content: space-between; margin-bottom: 1mm; }
        .fila-label { font-size: 7px; color: #555; }
        .fila-valor { font-size: 7px; font-weight: bold; text-align: right; }
        .footer {
          text-align: center; margin-top: 2mm; padding-top: 2mm;
          border-top: 1px dashed #000; font-size: 6px; color: #555;
        }
      </style>
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
        notas
          ? `
      <div class="separador"></div>
      <div class="label">NOTAS:</div>
      <div class="valor">${notas}</div>
      `
          : ""
      }

      <div class="footer">Generado: ${fecha} ${hora}</div>
    </body>
    </html>
  `;
};

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

/**
 * Genera y comparte PDF del ticket de material
 * @param {object} valeData - Datos completos del vale
 */
export const generarYCompartirPDFTicket = async (valeData) => {
  try {
    const html = generarHTMLTicket(valeData);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 219, // 58mm @ 96dpi
      height: 500, // Altura generosa, se recorta automáticamente
    });

    const nuevoUri = await renamePDFWithAutoName(uri, valeData.folio, "ticket");

    const disponible = await Sharing.isAvailableAsync();
    if (!disponible) {
      throw new Error("Compartir no disponible en este dispositivo");
    }

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
