// 1. Third party
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

/**
 * pdfOperadoresGenerator.js
 *
 * Genera PDFs de tarjetas QR para operadores.
 *
 * LAYOUT:
 * - Hoja A4 (210mm x 297mm)
 * - 3 columnas x 3 filas = 9 tarjetas por hoja
 * - Cada tarjeta: QR + nombre + sindicato + placas
 * - QR generado via api.qrserver.com (sin librería)
 */

const QR_BASE_URL = "https://api.qrserver.com/v1/create-qr-code/";

const generarUrlQR = (qrUid) =>
  `${QR_BASE_URL}?size=200x200&data=${encodeURIComponent(qrUid)}&format=png&margin=4`;

// ── HTML de una tarjeta individual ───────────────────────────────────────────

const htmlTarjeta = (operador) => {
  const qrUrl = generarUrlQR(operador.qr_uid);
  const placas = operador.placas ?? "Sin vehículo";
  const sindicato = operador.sindicato ?? "";

  return `
    <div class="tarjeta">
      <img class="qr" src="${qrUrl}" />
      <div class="nombre">${operador.nombre_completo}</div>
      <div class="sindicato">${sindicato}</div>
      <div class="placas">
        <span class="placas-icono">&#9651;</span>
        ${placas}
      </div>
    </div>
  `;
};

// ── HTML completo del documento ───────────────────────────────────────────────

const construirHTML = (operadores) => {
  const paginas = [];
  for (let i = 0; i < operadores.length; i += 9) {
    paginas.push(operadores.slice(i, i + 9));
  }

  const paginasHTML = paginas
    .map((grupo) => {
      const tarjetas = grupo.map(htmlTarjeta).join("");
      return `<div class="grid">${tarjetas}</div>`;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: Arial, sans-serif;
          background: #fff;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 3mm;
          padding: 6mm;
          width: 210mm;
          height: 270mm;
          page-break-after: always;
          break-after: page;
        }

        .tarjeta {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #CCCCCC;
          border-radius: 8px;
          padding: 3mm 4mm;
          background: #FFFFFF;
          overflow: hidden;
        }

        .qr {
          width: 46mm;
          height: 46mm;
          object-fit: contain;
          display: block;
        }

        .nombre {
          font-size: 8pt;
          font-weight: 700;
          color: #2C3E50;
          text-align: center;
          margin-top: 2px;
          line-height: 1.2;
          max-width: 58mm;
          word-wrap: break-word;
        }

        .sindicato {
          font-size: 7pt;
          color: #004E89;
          text-align: center;
          font-weight: 600;
          max-width: 58mm;
          word-wrap: break-word;
        }

        .placas {
          font-size: 7.5pt;
          color: #555555;
          text-align: center;
          margin-top: 1px;
          letter-spacing: 0.5px;
        }

        .placas-icono {
          font-size: 7pt;
          color: #FF6B35;
        }
      </style>
    </head>
    <body>
      ${paginasHTML}
    </body>
    </html>
  `;
};

// ── Tarjeta individual por PLACA (sin operador), una por página ──────────────
// El operador es dinámico (una placa la pueden usar varios operadores), por eso
// esta tarjeta muestra solo el QR + placas + capacidad. Reutiliza el diseño de
// la tarjeta individual de PantallaResultadoOperador. Se pintan varias en un
// mismo PDF, una por hoja, para poder enviarlas todas en un solo archivo.

const ESTILOS_TARJETA_PLACA = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #ffffff; }
  @page { size: A4 portrait; margin: 0; }
  .pagina {
    width: 210mm;
    height: 297mm;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20mm;
    page-break-after: always;
    break-after: page;
  }
  .card {
    width: 100%;
    max-width: 320px;
    border: 2px solid #004E89;
    border-radius: 16px;
    overflow: hidden;
    margin: 0 auto;
  }
  .header {
    background-color: #004E89;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    padding: 16px 20px;
    text-align: center;
  }
  .header-titulo {
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .header-subtitulo { color: rgba(255,255,255,0.75); font-size: 11px; }
  .body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .qr-wrapper {
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    padding: 14px;
    background: #F5F6FA;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .qr-wrapper img { display: block; width: 160px; height: 160px; }
  .info {
    width: 100%;
    border-top: 1px solid #E5E7EB;
    padding-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .fila { display: flex; flex-direction: column; gap: 2px; }
  .fila-label {
    font-size: 10px;
    color: #7F8C8D;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .fila-valor { font-size: 15px; font-weight: 700; color: #2C3E50; }
  .fila-valor-placas {
    font-size: 22px;
    font-weight: 800;
    color: #004E89;
    letter-spacing: 2px;
  }
  .footer {
    background: #F5F6FA;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    padding: 10px 20px;
    text-align: center;
    border-top: 1px solid #E5E7EB;
  }
  .footer-texto { font-size: 10px; color: #7F8C8D; }

  .indice-pagina {
    width: 210mm;
    min-height: 297mm;
    padding: 18mm 16mm;
    page-break-after: always;
    break-after: page;
  }
  .indice-header {
    border-bottom: 2px solid #004E89;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }
  .indice-titulo { font-size: 20pt; font-weight: 800; color: #004E89; }
  .indice-sub { font-size: 10pt; color: #7F8C8D; margin-top: 2px; }
  .indice-lista { column-count: 2; column-gap: 12mm; }
  .indice-fila {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 5px 0;
    border-bottom: 1px dotted #E5E7EB;
    break-inside: avoid;
  }
  .indice-placa {
    font-size: 11pt;
    font-weight: 700;
    color: #2C3E50;
    letter-spacing: 1px;
  }
  .indice-pag { font-size: 9pt; color: #7F8C8D; }
`;

const cuerpoTarjetaPlaca = (vehiculo) => {
  const qrUrl = generarUrlQR(vehiculo.qr_uid);
  const placas = vehiculo.placas ?? "";
  const capacidad = vehiculo.capacidad_m3;

  return `
    <div class="pagina">
      <div class="card">
        <div class="header">
          <div class="header-titulo">Control de Acarreos</div>
          <div class="header-subtitulo">Identificación de Vehículo</div>
        </div>
        <div class="body">
          <div class="qr-wrapper">
            <img src="${qrUrl}" />
          </div>
          <div class="info">
            <div class="fila">
              <span class="fila-label">Placas</span>
              <span class="fila-valor-placas">${placas}</span>
            </div>
            ${
              capacidad
                ? `<div class="fila">
                     <span class="fila-label">Capacidad</span>
                     <span class="fila-valor">${capacidad} m³</span>
                   </div>`
                : ""
            }
          </div>
        </div>
        <div class="footer">
          <span class="footer-texto">Escanea el QR para asignar este vehículo a un vale</span>
        </div>
      </div>
    </div>
  `;
};

// Índice en la primera página: placas en orden alfabético + su página.
// La primera tarjeta va en la página 2 (el índice ocupa la 1).
const htmlIndicePlacas = (vehiculos) => {
  const filas = vehiculos
    .map(
      (v, i) => `
        <div class="indice-fila">
          <span class="indice-placa">${v.placas ?? ""}</span>
          <span class="indice-pag">pág. ${i + 2}</span>
        </div>
      `,
    )
    .join("");

  return `
    <div class="indice-pagina">
      <div class="indice-header">
        <div class="indice-titulo">Índice de placas</div>
        <div class="indice-sub">${vehiculos.length} placas · orden alfabético</div>
      </div>
      <div class="indice-lista">${filas}</div>
    </div>
  `;
};

const construirHTMLPlacas = (vehiculos) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>${ESTILOS_TARJETA_PLACA}</style>
    </head>
    <body>
      ${htmlIndicePlacas(vehiculos)}
      ${vehiculos.map(cuerpoTarjetaPlaca).join("")}
    </body>
  </html>
`;

// ── Función compartida para generar y compartir el PDF ───────────────────────

const generarYCompartir = async (html, nombreArchivo) => {
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // Renombrar el archivo con el nombre deseado
  const dirBase = uri.substring(0, uri.lastIndexOf("/") + 1);
  const uriRenombrado = `${dirBase}${nombreArchivo}`;

  const FileSystem = require("expo-file-system/legacy");
  await FileSystem.moveAsync({ from: uri, to: uriRenombrado });

  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    throw new Error(
      "La función de compartir no está disponible en este dispositivo.",
    );
  }

  await Promise.race([
    Sharing.shareAsync(uriRenombrado, {
      mimeType: "application/pdf",
      dialogTitle: nombreArchivo,
      UTI: "com.adobe.pdf",
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout al compartir")), 30000),
    ),
  ]);

  return uriRenombrado;
};

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Genera y comparte un PDF con la tarjeta QR de un solo operador.
 * Nombre del archivo: QR_NombreOperador_PLACAS.pdf
 *
 * @param {object} operador - { nombre_completo, qr_uid, placas, sindicato }
 */
export const generarPDFOperadorIndividual = async (operador) => {
  const operadorConSindicato = {
    ...operador,
    sindicato: operador.sindicato ?? "",
  };

  const html = construirHTML([operadorConSindicato]);

  const nombreLimpio = operador.nombre_completo.replace(/\s+/g, "_");
  const placasTexto = operador.placas ? `_${operador.placas}` : "";
  const nombre = `QR_${nombreLimpio}${placasTexto}.pdf`;

  return generarYCompartir(html, nombre);
};

/**
 * Genera y comparte un PDF masivo con todos los operadores que tienen qr_uid.
 * Si viene un solo sindicato: QR_CTM.pdf
 * Si vienen varios: QR_Operadores_Todos.pdf
 *
 * @param {array} grupos - [{ sindicato, operadores: [{ ...operador }] }]
 */
export const generarPDFOperadoresMasivo = async (grupos) => {
  const operadores = grupos.flatMap((grupo) =>
    grupo.operadores
      .filter((op) => !!op.qr_uid)
      .map((op) => ({
        ...op,
        sindicato: grupo.sindicato,
      })),
  );

  if (operadores.length === 0) {
    throw new Error("No hay operadores con QR para exportar.");
  }

  const html = construirHTML(operadores);

  const nombreArchivo =
    grupos.length === 1
      ? `QR_${grupos[0].sindicato.replace(/\s+/g, "_")}.pdf`
      : "QR_Operadores_Todos.pdf";

  return generarYCompartir(html, nombreArchivo);
};

/**
 * Genera y comparte UN SOLO PDF con la tarjeta individual (sin operador) de cada
 * placa, una por página. Así se pueden enviar todas juntas en un solo archivo /
 * mensaje, sin compartir uno por uno.
 *
 * @param {array} grupos - [{ sindicato, operadores: [{ ...operador }] }]
 * @returns {number} cantidad de placas exportadas
 */
export const generarPDFPlacasIndividual = async (grupos) => {
  const vistos = new Set();
  const vehiculos = [];

  grupos.forEach((grupo) =>
    grupo.operadores.forEach((op) => {
      if (op.qr_uid && !vistos.has(op.qr_uid)) {
        vistos.add(op.qr_uid);
        vehiculos.push({
          placas: op.placas,
          capacidad_m3: op.capacidad_m3,
          qr_uid: op.qr_uid,
        });
      }
    }),
  );

  if (vehiculos.length === 0) {
    throw new Error("No hay placas con QR para exportar.");
  }

  vehiculos.sort((a, b) =>
    (a.placas ?? "").localeCompare(b.placas ?? "", "es", { numeric: true }),
  );

  const html = construirHTMLPlacas(vehiculos);

  const nombreArchivo =
    grupos.length === 1
      ? `QR_Placas_${grupos[0].sindicato.replace(/\s+/g, "_")}.pdf`
      : "QR_Placas_Todos.pdf";

  return generarYCompartir(html, nombreArchivo);
};
