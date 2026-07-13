# CLAUDE.md — src/services/

Servicios de integración: Bluetooth, PDF, impresión térmica.

---

## bluetoothPrinter.js — Impresión térmica

- Protocolo: ESC/POS para impresoras 58mm
- Biblioteca: `react-native-bluetooth-classic` (no `react-native-ble-manager` — corregido, la librería real no tiene build web)
- Feature flag: `BLUETOOTH_ENABLED` en `src/config/features.js`
- Si el flag está desactivado, no mostrar ningún botón ni UI de impresión
- **Web:** existe `bluetoothPrinter.web.js` (stub no-op) — Metro lo resuelve automáticamente en builds web en vez de este archivo, porque `react-native-bluetooth-classic` no tiene variante `.web.js` y rompería el bundle. Si el API público de `bluetoothPrinter.js` cambia, actualizar también el stub.

Flujo de impresión:
1. Escanear dispositivos BLE
2. Conectar por MAC address
3. Enviar bytes ESC/POS (texto + corte de papel)

---

## PDF — expo-print

```javascript
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
```

Reglas para iOS:
```css
/* Obligatorio para colores de fondo en impresión */
-webkit-print-color-adjust: exact !important;
background-color: #FF6B35 !important;
```

- Usar `@page { size: 50mm auto }` para tickets térmicos
- Pasar altura explícita a `Print.printToFileAsync` — no calcular alturas manualmente

---

## QR — Dos tipos

| Tipo | Contenido del QR | Uso |
|---|---|---|
| QR de vehículo | `VH-{PLACAS}` | Sticker permanente en camión. La app lo escanea para encontrar el vale activo |
| QR de vale | `https://web-acarreos.vercel.app/vale/{folio}` | Se imprime en el ticket físico. Abre la web de verificación |

Los QR de vales se generan via `api.qrserver.com` como imagen en el PDF/ticket.

---

## Feature flags (`src/config/features.js`)

| Flag | Estado | Descripción |
|---|---|---|
| `BLUETOOTH_ENABLED` | Activo | Muestra/oculta UI de impresión Bluetooth |
| `TIPO3_FLUJO_DOS_PASOS` | Activo (pendiente cleanup) | Flujo especial vales tipo 3 con override por viaje |

**Metro bundler:** los imports se resuelven estáticamente. Un `require()` condicional dentro de un `if` NO previene que el módulo se compile. Imports problemáticos deben resolverse en configuración de Metro o eliminarse del bundle.
