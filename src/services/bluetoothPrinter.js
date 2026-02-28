// 1. React Native
import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
} from "react-native";

// 2. Third party
import BleManager from "react-native-ble-manager";

// 3. Local - Debug
import { addDebugLog } from "../components/debug/DebugLogger";

const BleManagerModule = NativeModules.BleManager;
const bleEmitter = new NativeEventEmitter(BleManagerModule);

// Comandos ESC/POS
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
  // QR Code ESC/POS
  QR_MODEL: [GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00],
  QR_ERROR: [GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x33],
  QR_PRINT: [GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30],
  CUT: [GS, 0x56, 0x41, 0x10],
};

let bleInitialized = false;

/**
 * Inicializa BleManager (llamar una vez al arrancar)
 */
export const inicializarBluetooth = async () => {
  if (bleInitialized) return;
  await BleManager.start({ showAlert: false });
  bleInitialized = true;
};

/**
 * Solicita permisos Bluetooth en Android
 */
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

/**
 * Verifica si el Bluetooth está habilitado
 */
export const verificarBluetooth = async () => {
  try {
    await inicializarBluetooth();
    const estado = await BleManager.checkState();
    addDebugLog(`Bluetooth checkState: ${estado}`);
    return estado === "on";
  } catch (error) {
    addDebugLog(`Error verificarBluetooth: ${error.message}`, "ERROR");
    throw new Error("No se pudo verificar el estado del Bluetooth");
  }
};

/**
 * Escanea dispositivos Bluetooth disponibles por 5 segundos
 */
export const escanearImpresoras = () => {
  return new Promise(async (resolve, reject) => {
    try {
      await inicializarBluetooth();
      addDebugLog("BLE inicializado");

      const permisosOk = await solicitarPermisos();
      addDebugLog(`Permisos Bluetooth: ${permisosOk}`);
      if (!permisosOk) throw new Error("Permisos Bluetooth denegados");

      const dispositivos = [];

      const suscripcion = bleEmitter.addListener(
        "BleManagerDiscoverPeripheral",
        (device) => {
          addDebugLog(
            `Dispositivo detectado: ${device.name || "sin nombre"} | ${device.id}`,
          );
          const yaExiste = dispositivos.some((d) => d.id === device.id);
          if (!yaExiste) {
            dispositivos.push({
              id: device.id,
              address: device.id,
              name: device.name || "Impresora sin nombre",
            });
          }
        },
      );

      await BleManager.scan([], 5, true);
      addDebugLog("Scan iniciado - esperando 5 segundos...");

      setTimeout(() => {
        suscripcion.remove();
        addDebugLog(
          `Scan terminado. Total: ${dispositivos.length} dispositivos`,
        );
        resolve(dispositivos);
      }, 5500);
    } catch (error) {
      addDebugLog(`Error escaneo: ${error.message}`, "ERROR");
      reject(new Error("No se pudo escanear dispositivos Bluetooth"));
    }
  });
};

/**
 * Conecta a una impresora por ID (dirección MAC en Android)
 */
export const conectarImpresora = async (deviceId) => {
  try {
    addDebugLog(`Conectando a: ${deviceId}`);
    await BleManager.connect(deviceId);
    addDebugLog("Conexion exitosa, obteniendo servicios...");
    await BleManager.retrieveServices(deviceId);
    addDebugLog("Servicios obtenidos correctamente");
    return true;
  } catch (error) {
    addDebugLog(`Error conexion: ${error.message}`, "ERROR");
    throw new Error("No se pudo conectar a la impresora");
  }
};
/**
 * Desconecta el dispositivo
 */
export const desconectarImpresora = async (deviceId) => {
  try {
    await BleManager.disconnect(deviceId);
    return true;
  } catch {
    throw new Error("No se pudo desconectar la impresora");
  }
};

/**
 * Convierte string a bytes
 */
const stringToBytes = (texto) => {
  return Array.from(new TextEncoder().encode(texto));
};

/**
 * Genera bytes ESC/POS para imprimir un QR
 * @param {string} url    - Contenido del QR
 * @param {number} tamano - Tamaño del módulo (1-8), default 4
 */
const qrToBytes = (url, tamano = 4) => {
  const buffer = [];
  const data = stringToBytes(url);
  const len = data.length + 3;
  const lenL = len & 0xff;
  const lenH = (len >> 8) & 0xff;

  // Modelo QR
  buffer.push(...ESCPOS.QR_MODEL);

  // Tamaño del módulo
  buffer.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, tamano);

  // Nivel de corrección de errores (M)
  buffer.push(...ESCPOS.QR_ERROR);

  // Datos del QR
  buffer.push(GS, 0x28, 0x6b, lenL, lenH, 0x31, 0x50, 0x30, ...data);

  // Imprimir QR
  buffer.push(...ESCPOS.QR_PRINT);

  return buffer;
};

/**
 * Formatea texto en columnas para 32 caracteres (48mm)
 */
const formatearColumnas = (textos, anchos) => {
  let fila = "";
  textos.forEach((texto, i) => {
    const ancho = anchos[i] || 10;
    const truncado = String(texto).substring(0, ancho);
    fila += truncado.padEnd(ancho);
  });
  return fila;
};

/**
 * Busca la característica escribible del dispositivo
 */
const obtenerCaracteristicaEscritura = async (deviceId) => {
  const servicios = await BleManager.retrieveServices(deviceId);

  for (const char of servicios.characteristics || []) {
    const propiedades = char.properties || {};
    const esEscribible =
      propiedades.Write === "Write" ||
      propiedades.WriteWithoutResponse === "WriteWithoutResponse" ||
      propiedades.Write === true ||
      propiedades.WriteWithoutResponse === true;

    if (esEscribible) {
      return {
        serviceUUID: char.service,
        characteristicUUID: char.characteristic,
      };
    }
  }

  throw new Error("No se encontró característica de escritura en la impresora");
};

/**
 * Envía bytes a la impresora en chunks de 512
 */
const enviarBytes = async (deviceId, bytes) => {
  const { serviceUUID, characteristicUUID } =
    await obtenerCaracteristicaEscritura(deviceId);

  const CHUNK_SIZE = 512;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + CHUNK_SIZE);
    await BleManager.write(deviceId, serviceUUID, characteristicUUID, chunk);
  }
};

/**
 * Imprime el ticket
 * @param {string} deviceId - ID del dispositivo conectado
 * @param {Array}  lineas   - Array de objetos generados por ticketGenerator
 */
export const imprimirTicket = async (deviceId, lineas) => {
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

    // Avanzar papel y cortar
    buffer.push(...ESCPOS.LINE_FEED);
    buffer.push(...ESCPOS.LINE_FEED);
    buffer.push(...ESCPOS.LINE_FEED);
    buffer.push(...ESCPOS.CUT);

    await enviarBytes(deviceId, buffer);
    return true;
  } catch (error) {
    throw new Error(
      "Error al imprimir. Verifica la conexión con la impresora.",
    );
  }
};
