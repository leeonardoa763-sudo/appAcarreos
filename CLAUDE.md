# CLAUDE.md — Control de Acarreos (appAcarreos)

> Contexto global. Cada subcarpeta tiene su propio CLAUDE.md con detalles específicos.

---

## QUÉ ES ESTE PROYECTO

**Control de Acarreos** — sistema para constructora mexicana que gestiona logística de transporte en obras. El núcleo son los **"vales"**: comprobantes digitales de entrega de material o renta de equipo.

| Plataforma | Stack | Propósito |
|---|---|---|
| **App móvil** (`appAcarreos-1`) | Expo / React Native | Operación en campo — Android |
| **Web de verificación** | `web-acarreos.vercel.app` | Consulta pública de vales por folio/QR, sin login |

La web es solo lectura. Usa RLS `anon` de Supabase. Rutas: `https://web-acarreos.vercel.app/vale/{folio}`

---

## STACK

- **Framework:** React Native + Expo (managed workflow)
- **Navegación:** React Navigation v6 — Stack, Tabs, Drawer
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Storage + Edge Functions) — ref: `zqdnyqvgfymjorfplquf`
- **Bluetooth:** `react-native-ble-manager` — impresoras térmicas 58mm ESC/POS
- **PDF:** `expo-print` + `expo-file-system/legacy` + `expo-sharing`
- **QR:** `api.qrserver.com` en PDFs y tickets
- **Iconos:** `MaterialCommunityIcons` de `@expo/vector-icons` — SIEMPRE estos, NUNCA Ionicons
- **Estilos:** `StyleSheet` de React Native — sin Tailwind, sin styled-components
- **Builds:** EAS local en Mac. APK via Google Drive/WhatsApp (Android). iOS pendiente.
- **Email:** Resend via Edge Function `send-vale-email` → `control.acarreos@grupoesp.mx`

---

## PALETA DE COLORES — OBLIGATORIA

Siempre importar desde `src/config/colors.js`. NUNCA colores hardcodeados.

```javascript
import { colors } from "../config/colors";
```

| Token | Hex | Uso |
|---|---|---|
| `colors.primary` | `#FF6B35` | Naranja — acciones principales |
| `colors.secondary` | `#004E89` | Azul — headers, énfasis |
| `colors.accent` | `#1A936F` | Verde — estados positivos |
| `colors.surface` | `#FFFFFF` | Fondos de tarjetas |
| `colors.background` | `#F5F6FA` | Fondo general de pantallas |
| `colors.textPrimary` | `#2C3E50` | Texto principal |
| `colors.textSecondary` | `#7F8C8D` | Texto secundario |

---

## ARQUITECTURA

```
src/
├── config/         colors.js, features.js, supabase.js
├── hooks/          Un hook = una responsabilidad. Ver hooks/CLAUDE.md
│   └── queries/    VALE_SELECT_COMPLETO centralizado aquí
├── screens/        Pantallas lean — solo orquestación. Ver screens/CLAUDE.md
├── componets/      (typo intencional en carpeta). Ver componets/CLAUDE.md
│   ├── rentaHelpers/
│   └── helpersMaterial/
├── services/       Bluetooth, PDF, QR. Ver services/CLAUDE.md
└── utils/          formatters.js
```

**Reglas:**
- Screens orquestan. La lógica va en hooks. La UI en componentes helper.
- Un hook = una responsabilidad. No crear hooks dios.
- Archivos < 600 líneas. Si crece más, dividir.

---

## OBRAS

| ID | Estado | Regla |
|---|---|---|
| `146` | **PRODUCCIÓN** | Obra real activa — no tocar para pruebas |
| `888` | **TEST** | Excluir de toda lógica, reporte o estadística de producción |

Siempre filtrar `id_obra != 888` en reportes y estadísticas.

---

## CONVENCIONES DE NOMBRES

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase | `ValeFormCompletarNormal.js` |
| Hooks | camelCase + `use` | `useValeDetalle.js` |
| Constantes | UPPER_SNAKE_CASE | `VALE_SELECT_COMPLETO` |
| Carpetas | camelCase | `rentaHelpers/` |
| Variables negocio | camelCase español | `totalViajes`, `fechaCompletado` |

---

## WORKFLOW DE DESARROLLO

- **Paso a paso:** Un mensaje = una funcionalidad. Confirmar antes de avanzar.
- **Antes de escribir código:** Verificar columnas en `information_schema.columns` si hay duda.
- **Cambios a BD:** Siempre aditivos/no destructivos. No modificar columnas de obra 146 en producción.
- **Debugging:** `console.log` para confirmar diagnóstico → luego fix. No adivinar.

---

## NUNCA HACER

- Colores hardcodeados — siempre `colors.*`
- Usar Ionicons — siempre `MaterialCommunityIcons`
- Emojis en el código fuente (ni comentarios, ni strings de UI)
- `console.log` innecesarios en código final
- Archivos > 600 líneas
- `new Date("YYYY-MM-DD")` para fechas locales (UTC bug — ver hooks/CLAUDE.md)
- INSERT de `nombre_completo` en `operadores` (columna generada en PostgreSQL)
- INSERT de `apellido_paterno`/`apellido_materno` — usar `primer_apellido`/`segundo_apellido`
- Queries a `vale_*` sin usar `VALE_SELECT_COMPLETO` (ver hooks/CLAUDE.md)
- Obra 888 en lógica de producción
- Dos `<Modal>` apilados en Android sin patrón ref+timeout (ver componets/CLAUDE.md)
