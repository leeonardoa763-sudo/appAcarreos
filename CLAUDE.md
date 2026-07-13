# CLAUDE.md — Control de Acarreos (appAcarreos)

> Contexto global. Cada subcarpeta tiene su propio CLAUDE.md con detalles específicos.

---

## QUÉ ES ESTE PROYECTO

**Control de Acarreos** — sistema para constructora mexicana que gestiona logística de transporte en obras. El núcleo son los **"vales"**: comprobantes digitales de entrega de material o renta de equipo.

| Plataforma | Stack | Propósito |
|---|---|---|
| **App móvil** (`appAcarreos-1`) | Expo / React Native | Operación en campo — Android |
| **Web de verificación** | `web-acarreos.vercel.app` | Consulta pública de vales por folio/QR, sin login |
| **Web operativa (v1, en progreso)** | Este mismo repo, build `react-native-web` | Crear vales, cancelar vale, eliminar viaje, crear operadores — ver sección "SOPORTE WEB" |

La web de verificación es solo lectura. Usa RLS `anon` de Supabase. Rutas: `https://web-acarreos.vercel.app/vale/{folio}`

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

## SOPORTE WEB (v1 — react-native-web)

La misma app corre también como build web (`react-native-web`, ya instalado) para uso operativo real (no solo demo), con alcance **intencionalmente acotado**:

| Función | En web v1 |
|---|---|
| Crear vales (material, renta, asfáltico) | Sí |
| Cancelar vale / Eliminar viaje | Sí |
| Crear operadores | Sí |
| Estadísticas | Sí |
| Registrar viaje / Completar vale | **No** — solo nativo por ahora |
| Asignar vehículo a un vale ya creado (post-creación, vía QR) | **No** — solo nativo por ahora |
| Imprimir ticket (Bluetooth) / Generar / compartir PDF | **No** — oculto sin reemplazo |

No expandir este alcance (agregar registrar/completar viaje, asignar vehículo, impresión) sin que el usuario lo pida explícitamente.

**Flag de plataforma:** `IS_WEB` en `src/config/features.js` (`Platform.OS === "web"`). Patrón para ocultar UI fuera de alcance:

```javascript
import { IS_WEB } from "../../config/features";

{!IS_WEB && <BotonRegistrarViaje ... />}
```

**Gotchas de plataforma ya resueltos — tenerlos en cuenta en cambios futuros:**

1. **`Alert.alert` es un no-op en `react-native-web`** (no muestra nada, no ejecuta ningún `onPress`). Cualquier confirmación o alerta cuyo botón dispare una acción (eliminar, cancelar, etc.) debe usar `src/utils/crossAlert.js` en vez de `Alert.alert` directo. Los `Alert.alert` de solo-notificación de error (un botón, sin `onPress` relevante) se dejaron tal cual — degradan a "sin feedback visual" en web, no bloquean nada.
2. **`expo-secure-store` no tiene implementación funcional en web** (su `.web.js` es `export default {}`). Ver `src/utils/rememberAccount.js` — todas sus funciones retornan temprano si `Platform.OS === "web"`.
3. **`react-native-bluetooth-classic` no tiene build web.** Se resuelve con `src/services/bluetoothPrinter.web.js` (stub no-op) — Metro lo prioriza automáticamente sobre `bluetoothPrinter.js` en builds web. Si se agrega otro paquete nativo sin soporte web, replicar este patrón (`nombre.web.js`).
4. **Babel transpila `let`/`const` en modo *loose* para nativo** (sin TDZ real), pero el build web sí aplica TDZ estricta. Un hook que referencia una función en su arreglo de dependencias de `useCallback` antes de que esa función esté declarada más abajo en el archivo "funciona por accidente" en nativo pero truena en web (`Cannot access 'X' before initialization`). Ya pasó en `useVehiculoQR.js` — declarar siempre las dependencias de un `useCallback`/`useEffect` **antes** de usarlas, sin depender del orden de hoisting.
5. **Iconos (`MaterialCommunityIcons`) como cuadros vacíos en iPhone (Safari y Chrome iOS — ambos corren sobre WebKit).** En web la fuente de iconos se descarga por red después del primer render; si el texto con esos glifos pinta antes de que la fuente cargue, WebKit no lo repinta cuando por fin llega (Chrome de escritorio sí). Además, `expo-font` **evita a propósito** su mecanismo de espera en WebKit (comentario en su código: *"WebKit is broken"*) y resuelve la carga de fuente de inmediato sin confirmar la descarga real — por eso no basta con `useFonts`. `App.js` espera explícitamente con la API nativa `document.fonts.load(...)` / `document.fonts.ready` (con timeout de 4s de respaldo) antes de renderizar nada. Verificado con el motor WebKit real de Playwright (`playwright install webkit`), no con Chromium — Chromium no reproduce este bug.

6. **Los íconos (`.ttf`) dan 404 en Vercel aunque el build local/`localhost` los sirva bien.** `expo export -p web` copia los fonts de `@expo/vector-icons` a `dist/assets/node_modules/@expo/vector-icons/...` (mantiene la ruta relativa original, que incluye `node_modules` porque el paquete vive ahí). El `.gitignore` de la raíz del repo tiene `node_modules/`, y como `dist/` está dentro del mismo repo git, Vercel hereda esa regla al subir el deploy y excluye esos archivos — el sitio carga pero los iconos quedan en blanco. Por eso siempre usar `npm run export:web` (no `npx expo export -p web` directo) para desplegar: ese script genera un `dist/.vercelignore` vacío que anula la herencia del `.gitignore` padre para ese deploy. `dist/.vercelignore` se pierde en cada export porque `expo export` limpia la carpeta — por eso el script lo regenera cada vez, no basta con crearlo una sola vez a mano.

**Deploy:** `npm run export:web` genera build estático en `dist/` (ya en `.gitignore`) y crea el `.vercelignore` necesario (ver gotcha 6). Desplegado como proyecto Vercel existente llamado `dist` (no confundir con `web-acarreos.vercel.app`, que es la web de verificación pública). Vincular con `vercel link --yes` desde dentro de `dist/` si `dist/.vercel` no existe (se pierde en cada export), luego `vercel deploy .` (agregar `--prod` solo si se pide explícitamente producción).

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
