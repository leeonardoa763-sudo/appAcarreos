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
- **Bluetooth:** `react-native-bluetooth-classic` — impresoras térmicas 58mm ESC/POS. (NO `react-native-ble-manager`; no es dependencia del proyecto)
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
├── config/         colors.js, statsColors.js, features.js, featureFlags.js, supabase.js
├── context/        AuthContext.js — única fuente de sesión y perfil
├── navigation/     BottomTabNavigator.js
├── hooks/          Un hook = una responsabilidad. Ver hooks/CLAUDE.md
│   ├── queries/    VALE_SELECT_LISTA / VALE_SELECT_COMPLETO centralizados aquí
│   └── exportHelpers/
├── screens/        Pantallas lean — solo orquestación. Ver screens/CLAUDE.md
├── componets/      (typo intencional en carpeta). Ver componets/CLAUDE.md
├── services/       Bluetooth, PDF, QR. Ver services/CLAUDE.md
├── styles/         commonStyles, formStyles, listScreenStyles, screenStyles
└── utils/          formatters.js, crossAlert.js, jornadaLaboral.js, preciosMaterial.js, ...
```

**Reglas:**
- Screens orquestan. La lógica va en hooks. La UI en componentes helper.
- Un hook = una responsabilidad. No crear hooks dios.
- Archivos < 600 líneas. Si crece más, dividir.
- **Sin código muerto.** Si un componente/hook deja de usarse, se borra en el mismo cambio — no se deja "por si acaso" (para eso está git). Ver "Limpieza de código muerto" abajo.

---

## SOPORTE WEB (v1 — react-native-web)

La misma app corre también como build web (`react-native-web`, ya instalado) para uso operativo real (no solo demo), con alcance **intencionalmente acotado**:

| Función | En web v1 |
|---|---|
| Crear vales (material, renta, asfáltico) | Sí |
| Cancelar vale / Eliminar viaje | Sí |
| Crear operadores | Sí |
| Estadísticas | Sí |
| Historial de vales / exportar CSV | Sí — el navegador descarga el archivo (`exportHelpers/fileSystemUtils.web.js`) |
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

6. **Los íconos (`.ttf`) dan 404 en Vercel aunque el build local/`localhost` los sirva bien.** `expo export -p web` copia los fonts de `@expo/vector-icons` a `dist/assets/node_modules/@expo/vector-icons/...` (mantiene la ruta relativa original, que incluye `node_modules` porque el paquete vive ahí). **Vercel nunca despliega una carpeta llamada `node_modules`, sin importar `.vercelignore` ni `.gitignore` — es una regla dura de la plataforma, no herencia del `.gitignore` padre.** Por eso el fix real no es un `.vercelignore`: `scripts/fix-web-assets.js` renombra `dist/assets/node_modules` a `dist/assets/vendor` y reescribe las referencias correspondientes en el bundle JS. Ese script corre solo vía `npm run export:web` — nunca desplegar con `npx expo export -p web` directo, o los iconos quedan en blanco. El script también escribe un `dist/.vercelignore` vacío; es inofensivo pero **no** es lo que arregla el 404. Verificar tras cada export: `dist/assets/` debe contener `vendor` (no `node_modules`) y el bundle no debe tener referencias a `/assets/node_modules/`.

7. **El chequeo de versión (`app_config`) no corre en web — a propósito.** `AuthGuard` verifica la versión de la app contra `app_config.version_minima` y, si está obsoleta, muestra `UpdateRequiredScreen`, cuya única salida es `Linking.openURL(downloadUrl)` para bajar el **APK** — inútil en un navegador. Además el bundle web siempre es el último desplegado, así que no existe una versión "vieja" que bloquear. Sin este skip, cada release que sube `version_minima` para forzar la actualización de los APKs **bloquea también la web** hasta que alguien la re-exporte. Por eso `AuthGuard.verifyAppVersion()` retorna temprano si `IS_WEB`. Se usa `IS_WEB` y no `HIDE_ON_WEB` a propósito: es un fix de correctitud, no debe depender del flag temporal de pruebas.

8. **Caché de transformación de Metro: `app.json` cambiado no llega al bundle.** `expo-constants` incrusta el contenido de `app.json` dentro de su propio módulo al compilarse. Si subes la versión en `app.json`, ese módulo **no cambia**, así que Metro reutiliza su transformación cacheada y el bundle queda con la versión vieja congelada — `npx expo config` dice 1.3.9 mientras el bundle dice 1.3.7. Ya pasó (2026-07-17) y disparó el bloqueo del gotcha 7. Por eso `export:web` corre `expo export -p web --clear`. Tus archivos editados **sí** entran (Metro invalida por hash de contenido); lo que se queda stale es el config incrustado. Para verificar tras un export: `grep -o 'version\\":\\"[0-9.]*' dist/_expo/static/js/web/*.js`.

**Deploy web (pasos completos):**

El proyecto Vercel se llama `dist` (no confundir con `web-acarreos.vercel.app`, que es la web de verificación pública). Producción estable: `https://dist-weld-tau-61.vercel.app`.

El Vercel CLI **no está instalado globalmente** — se corre con `npx --yes vercel@latest ...`. La sesión ya está autenticada (`npx --yes vercel@latest whoami`).

`expo export` limpia `dist/` por completo en cada corrida, así que **`dist/.vercel/project.json` (el link al proyecto) se borra cada vez**. Respaldarlo antes y restaurarlo después es más rápido y seguro que re-linkear:

```bash
# 1. Respaldar el link (dist/ se borra en el export)
cp dist/.vercel/project.json /tmp/vercel-project.json.bak

# 2. Generar el build (corre expo export --clear + fix-web-assets; ver gotchas 6 y 8)
npm run export:web

# 3. Restaurar el link
mkdir -p dist/.vercel && cp /tmp/vercel-project.json.bak dist/.vercel/project.json

# 4. Verificar el build (ver gotcha 6)
ls dist/assets/                 # debe salir "vendor", NO "node_modules"
grep -c "/assets/node_modules/" dist/_expo/static/js/web/*.js   # debe ser 0

# 5. Desplegar desde dentro de dist/
cd dist
npx --yes vercel@latest deploy . -y --no-wait            # preview
npx --yes vercel@latest deploy . --prod -y --no-wait     # produccion (solo si se pide explicitamente)
```

Si se perdió el respaldo del link, re-linkear con `npx --yes vercel@latest link --yes` desde dentro de `dist/`. Contenido de referencia de `project.json`: `projectName: "dist"`, orgId del team `bruno-leonardos-projects`.

**El flag de BD no basta:** los cambios que dependen de una columna nueva requieren correr la migración en el SQL Editor de Supabase **antes** de desplegar, o el `insert`/`select` truena en producción.

---

## CENTRO DE AYUDA (2026-08-03)

Los tutoriales viven en un **sitio aparte**: `https://acarreos-ayuda.vercel.app`
(repo `AyudaAcarreos`, carpeta hermana `acarreos-ayuda/`). La app **no** los
reimplementa: los enlaza.

| Archivo | Qué es |
|---|---|
| `src/config/ayuda.js` | Solo datos: `AYUDA_URLS` + `urlAyudaVale(vale, paso)`. **Único lugar donde se escriben URLs de ayuda** |
| `src/utils/abrirAyuda.js` | Abre la URL con `expo-web-browser` (navegador *dentro* de la app, no `Linking`) |
| `src/componets/common/BotonAyuda.js` | El icono `help-circle-outline`. Ver `componets/CLAUDE.md` |

**Dónde están los accesos hoy:** fila "Ayuda" de `ConfiguracionScreen` y
`ValeSelectionModal` → portada. `headerRight` de las 4 variantes de creación de
vale (en `navigation/BottomTabNavigator.js`) → su lección. Headers de
`TicketsMaterialSection`, `ViajesMaterialSection`, `ModalCambiarBanco`,
`ValeFormCompletarNormal`, `TicketDescargaSection`, `ViajesRentaSection`,
`SeccionCompletarVale` y `ModalAsignarVehiculo` → el paso exacto del checador.

**Se eligió `expo-web-browser` y no `Linking.openURL`** para que el checador no
pierda lo que estaba capturando: el navegador se monta encima y "Listo" lo
devuelve a la misma pantalla. Es dependencia nativa: **un release que la incluya
necesita APK nuevo**. En web degrada a `window.open` sin código aparte.

**Los pasos del checador se abren con `#paso-<nombre>`** (`asignar`, `ticket`,
`registrar`, `banco`, `completar`). Esa lista está duplicada en `PASOS_POR_GUIA`
de `config/ayuda.js` y en los `data-paso` del HTML del sitio — ver "CONTRATO CON
LA APP MÓVIL" en `acarreos-ayuda/CLAUDE.md` antes de renombrar cualquiera.
Pipa y asfáltico van a su guía **sin** paso: esas páginas no tienen modales.

---

## HISTORIAL DE VALES (2026-08-03)

`HistorialValesScreen` (botón "Historial" en `ValesScreen`, ruta `Historial` del
`ValesStack`) sustituyó a la vieja `ArchivadosScreen`.

**Por qué se quitó Archivados:** filtraba con `.eq("archivado", true)`, pero
**nada en la app escribe `archivado = true`** — la pantalla siempre salía vacía.
La columna `vales.archivado` se dejó en la BD (regla de cambios aditivos), ya sin
ningún consumidor. No reimplementar ese filtro.

**Cómo funciona ahora:** no carga nada al abrir. Primero pregunta *qué* vales
(periodo todos/mes/rango, obra, tipo, material, sindicato, banco, incluir
cancelados) y luego *qué hacer* con ellos: verlos como lista de folios con
buscador, o exportarlos a CSV.

| Archivo | Rol |
|---|---|
| `hooks/exportHelpers/historialQueries.js` | La consulta. Paginada, con select propio |
| `hooks/exportHelpers/historialConverter.js` | Fila de CSV unificada (material + renta + pipas) |
| `hooks/useHistorialVales.js` | Orquesta lista vs. export |
| `utils/periodoHistorial.js` | Traduce el selector de periodo a un rango de fechas |
| `componets/historial/` | `FiltrosHistorial`, `ListaFoliosHistorial` |

**El CSV lleva una fila por viaje registrado.** Los vales sin viajes no aparecen.
Ninguna celda queda vacía: `"-"` para texto, `"0"` para numéricos. A diferencia
de `InformesScreen`, **sí respeta los overrides de tipo 3** (`precio_m3_override`,
`costo_viaje_override`, `distancia_km_override`, `bancos_override`) — el export de
Informes los ignora y por eso sus cifras no cuadran con la app en vales tipo 3.

---

## LIMPIEZA DE CÓDIGO MUERTO (2026-07-29)

Se eliminaron **54 archivos** sin uso. `src/` quedó en **189 archivos, todos alcanzables** desde `index.js`. No reintroducir lo borrado:

| Qué se borró | Por qué |
|---|---|
| **Tutorial guiado completo** (15 archivos: `componets/tutorial/`, `TutorialHelpButton`, `config/tutorialSteps.js`, `config/tutorialFakeData.js`, `useSpotlightTutorial`, `useTutorialAsignarFlow`, `useTutorialSeen`) | Los tutoriales se movieron a una **web aparte**. No volver a implementarlos dentro de la app |
| `useValeMaterialPDF` / `useValeRentaPDF` | Capa intermedia sin usuarios. `GenerarPDFButton.js` llama directo a `services/pdfMaterialGeneratorRecibo.js` y `services/pdfRentaGeneratorRecibo.js` — **esos servicios siguen vivos** |
| Generación vieja de estadísticas (19 archivos de `componets/stats/`, `ButtonsGrid/EstadisticasScreen.js`, `useChartData`, `useStatsFilteredData`, `useFilterCatalogos`, `utils/statsReportTemplate.js`) | La pantalla viva es `screens/EstadisticasScreen.js`, que solo usa `stats/EstadisticasMaterialTab` y `stats/EstadisticasRentaTab` |
| 5 componentes de `forms/` (`FormPicker`, `FormTimePicker`, `FormDecimalInput`, `FormNumberInput`, `FormAutocomplete`) | Nadie los importaba. Los vivos son `FormInput`, `FormCheckbox`, `CustomModalPicker`, `CustomTimePicker`, `CustomWeekPicker` |
| `debug/DebugLogger`, `dev/SeccionQRVehiculos`, `useVehiculosQR`, `ImprimirTicketButton`, `ErrorReportable`, `SearchBar`, `FloatingActionButton`, y otros sueltos | Sin referencias |

**Al quitar el tutorial se desconectó también su cableado** en `ValesScreen.js` (bloque spotlight completo, estado `tutorialArmed`), `AcarreosScreen.js` (efecto de `route.params.tutorialValeFicticio`) y `ButtonsGrid.js` (prop `registerRef` y `tutorialId` por botón). Si ves esos nombres en algún lado, es residuo.

**Cómo verificar que no hay código muerto nuevo:** análisis de alcanzabilidad desde `index.js`/`App.js` siguiendo imports y `require()`, resolviendo variantes `.web.js`/`.native.js` como hace Metro. Un simple "quién me importa" no basta: no detecta muertos transitivos (archivo importado solo por otro archivo muerto).

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
