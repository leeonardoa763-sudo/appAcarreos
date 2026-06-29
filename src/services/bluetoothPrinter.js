// 1. React Native
import { Platform, PermissionsAndroid } from "react-native";

// 2. Third party
import RNBluetoothClassic from "react-native-bluetooth-classic";

const ESC = 0x1b;
const GS = 0x1d;

export const ESCPOS = {
  INIT: [ESC, 0x40],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_ON: [GS, 0x21, 0x11],
  DOUBLE_OFF: [GS, 0x21, 0x00],
  LINE_FEED: [0x0a],
  QR_MODEL: [GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00],
  QR_ERROR: [GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x33],
  QR_PRINT: [GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30],
  CUT: [GS, 0x56, 0x00],
};

export const solicitarPermisos = async () => {
  if (Platform.OS !== "android") return true;

  if (Platform.Version >= 31) {
    const resultado = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(resultado).every(
      (v) => v === PermissionsAndroid.RESULTS.GRANTED,
    );
  } else {
    const resultado = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return resultado === PermissionsAndroid.RESULTS.GRANTED;
  }
};

export const verificarBluetooth = async () => {
  try {
    const habilitado = await withTimeout(
      RNBluetoothClassic.isBluetoothEnabled(),
      5000,
      "Timeout verificando Bluetooth",
    );
    return habilitado;
  } catch (error) {
    throw new Error("No se pudo verificar el estado del Bluetooth");
  }
};

// ─── Utilidad: timeout para operaciones Bluetooth ─────────────────────────────

const withTimeout = (
  promesa,
  ms = 15000,
  mensajeError = "La operacion tardo demasiado",
) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(mensajeError)), ms),
  );
  return Promise.race([promesa, timeout]);
};

export const escanearImpresoras = async () => {
  try {
    const dispositivos = await withTimeout(
      RNBluetoothClassic.getBondedDevices(),
      8000,
      "Timeout obteniendo dispositivos vinculados",
    );
    return dispositivos.map((d) => ({
      id: d.address,
      address: d.address,
      name: d.name || "Impresora sin nombre",
    }));
  } catch (error) {
    throw new Error("No se pudieron obtener los dispositivos vinculados");
  }
};

export const conectarImpresora = async (address) => {
  try {
    const dispositivo = await withTimeout(
      RNBluetoothClassic.connectToDevice(address),
      12000,
      "La impresora no respondio. Verifica que este encendida y en rango.",
    );
    return dispositivo;
  } catch (error) {
    throw new Error(error.message || "No se pudo conectar a la impresora");
  }
};

const stringToBytes = (texto) => {
  return Array.from(new TextEncoder().encode(texto));
};

const qrToBytes = (url, tamano = 4) => {
  const buffer = [];
  const data = stringToBytes(url);
  const len = data.length + 3;
  const lenL = len & 0xff;
  const lenH = (len >> 8) & 0xff;

  buffer.push(...ESCPOS.QR_MODEL);
  buffer.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, tamano);
  buffer.push(...ESCPOS.QR_ERROR);
  buffer.push(GS, 0x28, 0x6b, lenL, lenH, 0x31, 0x50, 0x30, ...data);
  buffer.push(...ESCPOS.QR_PRINT);

  return buffer;
};

const formatearColumnas = (textos, anchos) => {
  let fila = "";
  textos.forEach((texto, i) => {
    const ancho = anchos[i] || 10;
    const truncado = String(texto).substring(0, ancho);
    fila += truncado.padEnd(ancho);
  });
  return fila;
};

export const imprimirTicket = async (dispositivo, lineas) => {
  try {
    const buffer = [];

    buffer.push(...ESCPOS.INIT);

    for (const linea of lineas) {
      if (linea.tipo === "texto") {
        if (linea.opciones?.align === "center")
          buffer.push(...ESCPOS.ALIGN_CENTER);
        else if (linea.opciones?.align === "right")
          buffer.push(...ESCPOS.ALIGN_RIGHT);
        else buffer.push(...ESCPOS.ALIGN_LEFT);

        if (linea.opciones?.bold) buffer.push(...ESCPOS.BOLD_ON);
        if (linea.opciones?.double) buffer.push(...ESCPOS.DOUBLE_ON);

        buffer.push(...stringToBytes(linea.contenido));

        if (linea.opciones?.bold) buffer.push(...ESCPOS.BOLD_OFF);
        if (linea.opciones?.double) buffer.push(...ESCPOS.DOUBLE_OFF);
      } else if (linea.tipo === "separador") {
        buffer.push(...ESCPOS.ALIGN_LEFT);
        buffer.push(...stringToBytes(`${"-".repeat(32)}\n`));
      } else if (linea.tipo === "columnas") {
        buffer.push(...ESCPOS.ALIGN_LEFT);
        const fila = formatearColumnas(linea.textos, linea.anchos);
        buffer.push(...stringToBytes(fila + "\n"));
      } else if (linea.tipo === "qr") {
        buffer.push(...ESCPOS.ALIGN_CENTER);
        buffer.push(...ESCPOS.LINE_FEED);
        buffer.push(...qrToBytes(linea.contenido, 4));
        buffer.push(...ESCPOS.LINE_FEED);
      }
    }

    buffer.push(...ESCPOS.LINE_FEED);
    buffer.push(...ESCPOS.LINE_FEED);
    buffer.push(...ESCPOS.LINE_FEED);
    buffer.push(...ESCPOS.CUT);

    const base64 = btoa(String.fromCharCode(...buffer));
    await withTimeout(
      dispositivo.write(base64, "base64"),
      10000,
      "La impresora no respondio al enviar datos. Verifica que tenga papel y este lista.",
    );

    return true;
  } catch (error) {
    throw new Error(
      "Error al imprimir. Verifica la conexion con la impresora.",
    );
  }
};
