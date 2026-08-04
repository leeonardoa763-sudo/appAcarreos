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

## Feature flags — dos archivos distintos, no confundirlos

### `src/config/features.js` — flags de plataforma (constantes en código)

| Flag | Valor actual | Descripción |
|---|---|---|
| `BLUETOOTH_ENABLED` | `true` | Muestra/oculta UI de impresión Bluetooth |
| `IS_WEB` | `Platform.OS === "web"` | Detección pura de plataforma. Usar para **fixes de correctitud** que siempre deben aplicar en web (ej. el skip de versión en `AuthGuard`) |
| `HIDE_ON_WEB` | `IS_WEB && !MOSTRAR_TODO_EN_WEB` | Lo que realmente oculta las funciones fuera de alcance en web. **TEMPORAL:** `MOSTRAR_TODO_EN_WEB = true` desde 2026-07-09 para probar la app completa desde iPhone, así que hoy `HIDE_ON_WEB` es siempre `false` y **no oculta nada** |

Elegir entre `IS_WEB` y `HIDE_ON_WEB` es deliberado: `HIDE_ON_WEB` para UI fuera de alcance de la v1 web (impresión, PDF, registrar viaje), `IS_WEB` para correctitud que no debe depender del flag temporal de pruebas.

### `src/config/featureFlags.js` — flags por usuario (columna `feature_flags` de `persona`)

| Flag | Default | Descripción |
|---|---|---|
| `TIPO2_GENERAR_PDF_ROJO` | `false` | `true` genera PDF rojo al crear vale tipo 2; `false` lo deja en `en_proceso` para completar después |

Es el **único** flag por usuario que existe. Se leen con `useFeatureFlags()`. Para cambiarlo a un usuario se edita en Supabase, no en el archivo:

```sql
UPDATE persona SET feature_flags = feature_flags || '{"TIPO2_GENERAR_PDF_ROJO": true}'::jsonb WHERE id_persona = X;
```

> `TIPO3_FLUJO_DOS_PASOS` **no existe** — aparecía en versiones viejas de esta doc y en un comentario de ejemplo de `useFeatureFlags.js`. El flujo de tipo 3 con override por viaje es comportamiento fijo, sin flag.

---

## Servicios vivos

`bluetoothPrinter.js` (+ `.web.js`), `ticketGenerator.js`, `pdfGenerator.js`, `pdfTicketGenerator.js`, `pdfMaterialGeneratorRecibo.js`, `pdfRentaGenerator.js`, `pdfRentaGeneratorRecibo.js`, `pdfOperadoresGenerator.js`, `pdfFileHandler.js`, `presupuestoService.js`.

Los recibos se llaman **directo desde `componets/vale/GenerarPDFButton.js`**. Los hooks intermedios `useValeMaterialPDF` / `useValeRentaPDF` se borraron el 2026-07-29 por no tener usuarios — no recrearlos.

**Metro bundler:** los imports se resuelven estáticamente. Un `require()` condicional dentro de un `if` NO previene que el módulo se compile. Imports problemáticos deben resolverse en configuración de Metro o eliminarse del bundle.
