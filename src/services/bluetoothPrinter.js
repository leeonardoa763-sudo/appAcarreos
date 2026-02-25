// 1. Third party
import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from "@vardrz/react-native-bluetooth-escpos-printer";

/**
 * bluetoothPrinter.js
 *
 * Servicio para manejar conexión y comunicación con impresora Bluetooth ESC/POS
 *
 * PROPÓSITO:
 * - Verificar disponibilidad de Bluetooth
 * - Escanear impresoras disponibles
 * - Conectar a impresora
 * - Enviar comandos de impresión
 */

/**
 * Verifica si el Bluetooth está habilitado
 */
export const verificarBluetooth = async () => {
  try {
    const habilitado = await BluetoothManager.isBluetoothEnabled();
    return habilitado;
  } catch (error) {
    throw new Error("No se pudo verificar el estado del Bluetooth");
  }
};

/**
 * Escanea dispositivos Bluetooth disponibles
 * Retorna lista de impresoras encontradas
 */
export const escanearImpresoras = async () => {
  try {
    const dispositivos = await BluetoothManager.scanDevices();
    const parsed = JSON.parse(dispositivos);
    const encontrados = parsed.found || [];
    const pareados = parsed.paired || [];
    return [...pareados, ...encontrados];
  } catch (error) {
    throw new Error("No se pudo escanear dispositivos Bluetooth");
  }
};

/**
 * Conecta a una impresora por dirección MAC
 * @param {string} direccionMAC - Dirección MAC de la impresora
 */
export const conectarImpresora = async (direccionMAC) => {
  try {
    await BluetoothManager.connect(direccionMAC);
    return true;
  } catch (error) {
    throw new Error("No se pudo conectar a la impresora");
  }
};

/**
 * Desconecta la impresora actual
 */
export const desconectarImpresora = async () => {
  try {
    await BluetoothManager.disconnect();
    return true;
  } catch (error) {
    throw new Error("No se pudo desconectar la impresora");
  }
};

/**
 * Imprime el ticket con el contenido dado
 * @param {Array} lineas - Array de objetos con contenido a imprimir
 */
export const imprimirTicket = async (lineas) => {
  try {
    await BluetoothEscposPrinter.printerInit();

    for (const linea of lineas) {
      if (linea.tipo === "texto") {
        await BluetoothEscposPrinter.printText(
          linea.contenido,
          linea.opciones || {},
        );
      } else if (linea.tipo === "columnas") {
        await BluetoothEscposPrinter.printColumn(
          linea.anchos,
          linea.alineaciones,
          linea.textos,
          linea.opciones || {},
        );
      } else if (linea.tipo === "qr") {
        await BluetoothEscposPrinter.printQRCode(
          linea.contenido,
          linea.tamano || 150,
          BluetoothEscposPrinter.ERROR_CORRECTION.H,
        );
      }
    }

    // Avanzar papel al final
    await BluetoothEscposPrinter.printText("\n\n\n", {});
    return true;
  } catch (error) {
    throw new Error(
      "Error al imprimir. Verifica la conexión con la impresora.",
    );
  }
};
