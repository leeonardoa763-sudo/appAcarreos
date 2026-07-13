// Stub web de bluetoothPrinter.js — la impresión térmica Bluetooth no aplica
// en la versión web. Metro resuelve este archivo automáticamente en builds
// web en vez de bluetoothPrinter.js, evitando cargar react-native-bluetooth-classic
// (sin soporte web) y sus efectos de módulo.

export const ESCPOS = {};

export const solicitarPermisos = async () => true;

export const verificarBluetooth = async () => {
  throw new Error("Impresión Bluetooth no disponible en la versión web");
};

export const escanearImpresoras = async () => [];

export const conectarImpresora = async () => {
  throw new Error("Impresión Bluetooth no disponible en la versión web");
};

export const imprimirTicket = async () => {
  throw new Error("Impresión Bluetooth no disponible en la versión web");
};
