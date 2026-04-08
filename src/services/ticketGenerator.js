/**
 * services/ticketGenerator.js
 *
 * Genera el contenido del ticket en formato ESC/POS
 * para impresoras térmicas de 48mm
 */

const ALINEACION = {
  IZQUIERDA: "left",
  CENTRO: "center",
  DERECHA: "right",
};

const SEPARADOR = "--------------------------------";

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

/**
 * Genera líneas del ticket de vale de MATERIAL
 */
export const generarTicketMaterial = (vale) => {
  const detalle = vale?.vale_material_detalles?.[0] || {};
  const cc = vale.obras?.cc || "";
  const nombreObra = vale.obras?.obra || "N/A";
  const obra = cc ? `${cc}-${nombreObra}` : nombreObra;
  const empresa = vale.obras?.empresas?.empresa || "CONSTRUCCION";
  const placas = vale.vehiculos?.placas || "N/A";
  const operador = vale.operadores?.nombre_completo || "N/A";
  const material = detalle.material?.material || "N/A";
  const banco = detalle.bancos?.banco || "N/A";
  const capacidadRaw = vale.vehiculos?.capacidad_m3 ?? detalle.capacidad_m3;
  const capacidad = capacidadRaw ? `${capacidadRaw} m3` : "N/A";
  const distancia = detalle.distancia_km ? `${detalle.distancia_km} km` : "N/A";
  const requisicion = detalle.requisicion || null;
  const fecha = formatearFecha(vale.fecha_creacion);
  const hora = formatearHora(vale.fecha_creacion);
  const estado = traducirEstado(vale.estado);
  const folio = vale.folio || "N/A";
  const esTipo3 = detalle.material?.id_tipo_de_material === 3;
  const qrUrl =
    vale.qr_verification_url || `https://web-acarreos.vercel.app/vale/${folio}`;

  const lineas = [
    {
      tipo: "texto",
      contenido: `${empresa}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: "VALE DE MATERIAL\n",
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: `${folio}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: `${fecha} ${hora}\n`,
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "texto",
      contenido: `ESTADO: ${estado}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "OBRA:\n",
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `${obra}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `BANCO: ${banco}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    { tipo: "separador" },
  ];

  // Requisicion solo si existe
  if (requisicion) {
    lineas.push({
      tipo: "texto",
      contenido: `REQUISICION: ${requisicion}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    });
  }

  lineas.push(
    {
      tipo: "texto",
      contenido: `MATERIAL: ${material}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `CAPACIDAD: ${capacidad}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `DISTANCIA: ${distancia}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: `OPERADOR:\n${operador}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `PLACAS: ${placas}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    { tipo: "separador" },
  );

  // Desglose de viajes
  const viajes = detalle.vale_material_viajes || [];
  if (viajes.length > 0) {
    lineas.push(
      {
        tipo: "texto",
        contenido: "VIAJES REALIZADOS\n",
        opciones: { align: ALINEACION.CENTRO, bold: true },
      },
      { tipo: "separador" },
      {
        tipo: "texto",
        contenido: esTipo3
          ? "#   VOL    BANCO          HORA\n"
          : "#   VOL    TON   FOLIO      HORA\n",
        opciones: { align: ALINEACION.IZQUIERDA },
      },
      { tipo: "separador" },
    );

    viajes.forEach((viaje) => {
      const num = String(viaje.numero_viaje ?? "?").padEnd(3);
      const vol =
        viaje.volumen_m3 != null
          ? String(parseFloat(viaje.volumen_m3).toFixed(2)).padEnd(6)
          : "N/A   ";
      const hora = viaje.hora_registro
        ? formatearHora(viaje.hora_registro)
        : "--:--";

      if (esTipo3) {
        const bancoNombre =
          viaje.banco_override?.banco ?? detalle.bancos?.banco ?? "--";
        const distanciaKm =
          viaje.distancia_km_override ?? detalle.distancia_km ?? "--";
        const bancoCorto =
          `${bancoNombre.substring(0, 8).padEnd(8)} ${distanciaKm}km`.padEnd(
            14,
          );

        lineas.push({
          tipo: "texto",
          contenido: `${num} ${vol} ${bancoCorto} ${hora}\n`,
          opciones: { align: ALINEACION.IZQUIERDA },
        });
      } else {
        const ton =
          viaje.peso_ton != null
            ? String(parseFloat(viaje.peso_ton).toFixed(2)).padEnd(6)
            : "-     ";
        const folioBanco = viaje.folio_vale_fisico
          ? String(viaje.folio_vale_fisico).substring(0, 7).padEnd(8)
          : "-       ";

        lineas.push({
          tipo: "texto",
          contenido: `${num} ${vol} ${ton} ${folioBanco} ${hora}\n`,
          opciones: { align: ALINEACION.IZQUIERDA },
        });
      }
    });

    const totalVol = viajes.reduce(
      (acc, v) => acc + parseFloat(v.volumen_m3 || 0),
      0,
    );
    const totalTon =
      !esTipo3 && viajes.some((v) => v.peso_ton != null)
        ? viajes.reduce((acc, v) => acc + parseFloat(v.peso_ton || 0), 0)
        : null;

    lineas.push(
      { tipo: "separador" },
      {
        tipo: "texto",
        contenido: `TOTAL VIAJES: ${viajes.length}\n`,
        opciones: { align: ALINEACION.IZQUIERDA, bold: true },
      },
      {
        tipo: "texto",
        contenido: `TOTAL VOLUMEN: ${totalVol.toFixed(2)} m3\n`,
        opciones: { align: ALINEACION.IZQUIERDA, bold: true },
      },
      ...(totalTon != null
        ? [
            {
              tipo: "texto",
              contenido: `TOTAL TON: ${totalTon.toFixed(2)} ton\n`,
              opciones: { align: ALINEACION.IZQUIERDA, bold: true },
            },
          ]
        : []),
    );
  }

  lineas.push(
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "Escanear para verificar\n",
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "texto",
      contenido: `IMPRESO: ${formatearFecha(new Date())} ${formatearHora(new Date())}\n`,
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "texto",
      contenido: `${folio}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "qr",
      contenido: qrUrl,
      tamano: 120,
    },
  );

  return lineas;
};

/**
 * Genera líneas del ticket de vale de RENTA
 */
export const generarTicketRenta = (vale) => {
  const detalle = vale?.vale_renta_detalle?.[0] || {};
  const cc = vale.obras?.cc || "";
  const nombreObra = vale.obras?.obra || "N/A";
  const obra = cc ? `${cc}-${nombreObra}` : nombreObra;
  const empresa = vale.obras?.empresas?.empresa || "CONSTRUCCION";
  const operador = vale.operadores?.nombre_completo || "N/A";
  const placas = vale.vehiculos?.placas || "N/A";
  const sindicato = vale.vehiculos?.sindicatos?.sindicato || "N/A";
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

  const fecha = formatearFecha(vale.fecha_creacion);
  const hora = formatearHora(vale.fecha_creacion);
  const estado = traducirEstado(vale.estado);
  const folio = vale.folio || "N/A";
  const qrUrl =
    vale.qr_verification_url || `https://web-acarreos.vercel.app/vale/${folio}`;

  const lineas = [
    {
      tipo: "texto",
      contenido: `${empresa}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: "VALE DE RENTA\n",
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: `${folio}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: `${fecha} ${hora}\n`,
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "texto",
      contenido: `ESTADO: ${estado}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "OBRA:\n",
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `${obra}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: `MATERIAL: ${material}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `CAPACIDAD: ${capacidad}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `SINDICATO: ${sindicato}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: `HORA INICIO: ${horaInicio}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `HORA FIN: ${horaFin}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
  ];

  if (totalHoras) {
    lineas.push({
      tipo: "texto",
      contenido: `TOTAL HORAS: ${totalHoras}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    });
  }

  if (totalDias) {
    lineas.push({
      tipo: "texto",
      contenido: `TOTAL DIAS: ${totalDias}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    });
  }

  lineas.push({
    tipo: "texto",
    contenido: `VIAJES: ${detalle.numero_viajes ?? "N/A"}\n`,
    opciones: { align: ALINEACION.IZQUIERDA, bold: true },
  });

  lineas.push(
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: `OPERADOR:\n${operador}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `PLACAS: ${placas}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
  );

  if (notas) {
    lineas.push(
      { tipo: "separador" },
      {
        tipo: "texto",
        contenido: `NOTAS:\n${notas}\n`,
        opciones: { align: ALINEACION.IZQUIERDA },
      },
    );
  }

  lineas.push(
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "Escanear para verificar\n",
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "qr",
      contenido: qrUrl,
      tamano: 120,
    },
    {
      tipo: "texto",
      contenido: `${folio}\n`,
      opciones: { align: ALINEACION.CENTRO },
    },
  );

  return lineas;
};

/**
 * Genera líneas del ticket por VIAJE de vale de MATERIAL
 * Se imprime después de registrar cada viaje individual
 */
export const generarTicketMaterialViaje = (vale, detalle, viaje) => {
  const cc = vale.obras?.cc || "";
  const nombreObra = vale.obras?.obra || "N/A";
  const obra = cc ? `${cc}-${nombreObra}` : nombreObra;
  const empresa = vale.obras?.empresas?.empresa || "CONSTRUCCION";
  const operador = vale.operadores?.nombre_completo || "N/A";
  const placas = vale.vehiculos?.placas || "N/A";
  const material = detalle.material?.material || "N/A";
  const banco = detalle.bancos?.banco || "N/A";
  const distancia = detalle.distancia_km ? `${detalle.distancia_km} km` : "N/A";
  const capacidadRaw = vale.vehiculos?.capacidad_m3 ?? detalle?.capacidad_m3;
  const capacidad = capacidadRaw ? `${capacidadRaw} m3` : "N/A";
  const requisicion = detalle.requisicion ? String(detalle.requisicion) : null;
  const folio = vale.folio || "N/A";
  const numeroViaje = viaje.numero_viaje || "N/A";
  const horaViaje = formatearHora(viaje.hora_registro);
  const fechaViaje = formatearFecha(viaje.hora_registro);
  const qrUrl =
    vale.qr_verification_url || `https://web-acarreos.vercel.app/vale/${folio}`;

  return [
    {
      tipo: "texto",
      contenido: `${empresa}\n`,
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: "TICKET DE SALIDA\n",
      opciones: { align: ALINEACION.CENTRO, bold: true },
    },
    {
      tipo: "texto",
      contenido: "VALE DE MATERIAL\n",
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "texto",
      contenido: `${fechaViaje} ${horaViaje}\n`,
      opciones: { align: ALINEACION.CENTRO },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: `FOLIO VALE: ${folio}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `VIAJE #: ${numeroViaje}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "OBRA:\n",
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `${obra}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `MATERIAL: ${material}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `BANCO: ${banco}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    {
      tipo: "texto",
      contenido: `DISTANCIA: ${distancia}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: `CAPACIDAD: ${capacidad}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    ...(requisicion
      ? [
          {
            tipo: "texto",
            contenido: `REQUISICION: ${requisicion}\n`,
            opciones: { align: ALINEACION.IZQUIERDA, bold: true },
          },
        ]
      : []),
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: `OPERADOR:\n${operador}\n`,
      opciones: { align: ALINEACION.IZQUIERDA, bold: true },
    },
    {
      tipo: "texto",
      contenido: `PLACAS: ${placas}\n`,
      opciones: { align: ALINEACION.IZQUIERDA },
    },
    { tipo: "separador" },
    {
      tipo: "texto",
      contenido: "Escanear para verificar vale\n",
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "texto",
      contenido: `IMPRESO: ${formatearFecha(new Date())} ${formatearHora(new Date())}\n`,
      opciones: { align: ALINEACION.CENTRO },
    },
    {
      tipo: "qr",
      contenido: qrUrl,
      tamano: 120,
    },
  ];
};
