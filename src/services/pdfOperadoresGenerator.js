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
  // Partir en páginas de 9
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

// ── Función compartida para generar y compartir el PDF ───────────────────────

const generarYCompartir = async (html, nombreArchivo) => {
  console.log("[PDF] HTML generado:", html);
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    throw new Error(
      "La función de compartir no está disponible en este dispositivo.",
    );
  }

  await Promise.race([
    Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: nombreArchivo,
      UTI: "com.adobe.pdf",
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout al compartir")), 30000),
    ),
  ]);

  return uri;
};

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Genera y comparte un PDF con la tarjeta QR de un solo operador.
 *
 * @param {object} operador - { nombre_completo, qr_uid, placas, sindicato }
 */
export const generarPDFOperadorIndividual = async (operador) => {
  const operadorConSindicato = {
    ...operador,
    sindicato: operador.sindicato ?? "",
  };

  const html = construirHTML([operadorConSindicato]);
  const nombre = `QR_${operador.nombre_completo.replace(/\s+/g, "_")}.pdf`;
  return generarYCompartir(html, nombre);
};

/**
 * Genera y comparte un PDF masivo con todos los operadores que tienen qr_uid.
 * Agrupa por sindicato tal como llegan los grupos del hook.
 *
 * @param {array} grupos - [{ sindicato, operadores: [{ ...operador }] }]
 */
export const generarPDFOperadoresMasivo = async (grupos) => {
  // Aplanar todos los operadores con qr_uid, inyectando nombre de sindicato
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
  return generarYCompartir(html, "QR_Operadores_Todos.pdf");
};
