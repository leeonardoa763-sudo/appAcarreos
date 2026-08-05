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

## TARIFAS POR OBRA (2026-08-04)

Una obra puede tener tarifa propia que **sustituye** a la del sindicato. Lo que ya
existía pasa a llamarse **tarifa por defecto del sindicato**.

| Capa | Tabla | Clave |
|---|---|---|
| Default del sindicato | `precios_material` | `(id_tipo_de_material, id_sindicato)` |
| Default del sindicato | `precios_renta` | `(id_sindicato)` |
| **Tarifa de obra** | `precios_material_obra` | `(id_obra, id_tipo_de_material, id_sindicato)` |
| **Tarifa de obra** | `precios_renta_obra` | `(id_obra, id_sindicato)` |

**Regla única de resolución**, igual para material, asfáltico, renta y pipas:
`tarifa de (obra, …) → si no existe → tarifa del sindicato`. Vive en
`utils/preciosMaterial.js` (`obtenerTarifaMaterial`) y `utils/preciosRenta.js`
(`resolverTarifaRenta`). Las tablas de obra son **espejo** de las de sindicato, así
que `calcularPrecioM3` es el mismo motor para ambas.

**Se eligieron tablas nuevas y no una columna `id_obra` nullable** en las existentes:
todos los consumidores actuales leen `precios_material` / `precios_renta` sin filtrar
por obra, así que agregarles filas de obra las haría devolver 2 filas por combinación
y elegir una al azar — un cambio de precio silencioso en la obra 146.

**Congelado del importe.** Material ya lo hacía (`precio_m3`, `costo_total`,
`tarifa_primer_km`, `tarifa_subsecuente`). Renta **no**: leía `costo_hr`/`costo_dia`
del join en vivo, así que editar una tarifa repreciaba todos los vales históricos.
Ahora `vale_renta_detalle` guarda `costo_hr_aplicado` / `costo_dia_aplicado` al crear
el vale. **Toda lectura de tarifa de renta va por `tarifaRentaEfectiva(detalle)`** —
nunca `detalle.precios_renta` directo; en vales previos a esta fecha esas columnas
son `null` y el helper cae al join, sin alterar el histórico.

`id_precios_renta` se sigue poblando **siempre** con el default del sindicato, gane o
no la tarifa de obra: la columna es anterior y tiene consumidores fuera de este repo
(web pública) además del trigger de abajo. Qué tarifa ganó se sabe por
`id_precios_renta_obra`. En material es al revés: solo una de `id_precios_material` /
`id_precios_material_obra` queda poblada.

**El trigger `calcular_totales_vale_renta` también aplica la misma regla.** Es
`BEFORE INSERT/UPDATE` sobre `vale_renta_detalle` y reescribe `NEW.costo_total`; leía
el precio **siempre** de `precios_renta`, así que pisaba el importe correcto que
escribía la app y dejaba el vale con la tarifa del sindicato. Corregido en
`20260804_trigger_renta_respeta_tarifa_obra.sql` para que prefiera
`costo_hr_aplicado` / `costo_dia_aplicado`. Su cuerpo **no estaba versionado** — si
tocas precios de renta, revisa ese archivo antes.
Ojo con sus ramas: día completo y renta por horas recalculan `costo_total`, pero
**medio día** (`es_renta_por_dia = false` + `hora_fin NULL`) no entra a ninguna y
conserva lo que escribió la app.

**Pantalla:** panel de Administrador → *Tarifas por obra* (`GestionTarifasScreen`).
Muestra los defaults en **solo lectura** y hace CRUD únicamente de las tarifas de obra
— editar un default desde la app afectaría a todas las obras, incluida la 146.
Quitar una tarifa de obra la devuelve al default; los vales ya creados no se tocan.

> `useCatalogos` ya **no** expone `preciosRenta`: la tarifa se resuelve contra la BD
> al crear el vale, porque una tarifa recién capturada debe aplicar de inmediato y el
> catálogo tenía TTL de 4 h.

---

## TIEMPO MÍNIMO ENTRE VIAJES Y EVIDENCIA (2026-08-04)

### El tiempo mínimo se calcula, ya no es un número fijo

Antes: `obras.min_minutos_entre_viajes` (20 por defecto), el mismo valor para un banco
a 2 km y para uno a 40 km. **Solo aplica a vales de material** — se quitó de renta
(`useViajesRenta`), donde un viaje no es un ciclo de acarreo; el asfáltico nunca
registró viajes.

Regla, en `utils/tiempoEntreViajes.js` (`resolverTiempoMinimo`):

```
umbral = MAX(formula, piso_historico_de_la_ruta)   acotado a [5, 180] min

formula = ((km * 2 / velocidad_promedio_kmh) * 60
           + minutos_carga_descarga) * factor_tolerancia_tiempo

piso_historico = percentil 5 de los ciclos de esa RUTA exacta
                 (obra + banco + es_planta_asfaltos), y solo si tiene
                 >= 30 ciclos registrados
Sin distancia -> obras.min_minutos_entre_viajes (comportamiento anterior)
```

Los 3 parámetros viven en `obras` y se editan en el modal de admin de obras — **no son
constantes en el código a propósito**: recalibrar sin publicar APK.

#### El historial solo puede SUBIR el umbral, nunca bajarlo

Es la decisión menos obvia y la más importante. La calibración sobre los 9,439 viajes
reales del 2026-03-23 al 2026-08-04 mostró que **el percentil 10 histórico está
contaminado por el problema mismo que este feature ataca**: hay ciclos registrados de
1.0 min para un banco a 5 km y de 1.3 min para uno a 16 km — físicamente imposibles.
Si el historial pudiera bajar el umbral, esos registros se volverían la norma del banco
y la regla se autodestruiría (CHUPON habría quedado en el piso de 5 min para 16 km).

Con `MAX` el historial solo aporta lo que sí sabe con confianza: que un banco concreto
es **más** lento que la física — camino malo, cola larga. Ejemplo real: MAGDALENO CEDILLO
a 15 km da 43 min por fórmula, pero en la obra 15 su p10 real es 61 min, y ese gana.

Por lo mismo `MUESTRAS_MINIMAS_HISTORICO` es **30** y no 10: los bancos con 18-24 ciclos
daban percentiles sin sentido, y los que de verdad importan tienen entre 80 y 5,021 ciclos.

#### Por qué percentil 5 y no 10

Cuando gana el historial, **el umbral *es* el percentil**, así que ese número fija por
construcción cuántos viajes van a pedir motivo. Con p10 sería 1 de cada 10 incluso en
rutas impecables — INCASA→obra tiene 50 ciclos y ninguno imposible (el más rápido son
108 min), y aun así habría pedido motivo en ~5 de ellos.

En las rutas sucias el percentil **ni se usa**, porque ahí gana la fórmula. Por eso bajar
a p05 no debilita la detección: solo quita fricción donde no había nada que detectar.

#### Los viajes anticipados se descartan DESPUÉS del LAG

La vista **`ciclos_banco_obra`** (`security_invoker`, últimos 180 días) excluye del
cálculo los ciclos que tocan un `registro_anticipado` — si no, los registros forzados con
motivo contaminarían el umbral, vuelta tras vuelta.

**Pero el filtro va en el `SELECT` exterior, no en el `WHERE` del CTE.** `WHERE` se evalúa
*antes* que las funciones de ventana: filtrar ahí borra la fila de la partición y el `LAG`
acaba emparejando el viaje 2 con el 4, inventando un ciclo que vale la suma de dos y que
nunca ocurrió. Se descarta el ciclo si **cualquiera** de sus dos extremos es anticipado —
la `hora_registro` de un viaje capturado tarde no dice cuándo ocurrió, así que envenena
tanto el ciclo que termina en él como el que arranca de él.

**Y agrupa por `es_planta_asfaltos`, no solo por `(obra, banco)`.** Un vale de planta se
carga a una obra pero el material no se descarga ahí: va a la Planta de Asfaltos, y su
distancia sale de `distancias_banco_planta` (banco→planta), más corta que banco→obra.
Son **dos rutas distintas desde el mismo banco**. Sin separarlas, el p10 mezcla ciclos
cortos de planta con ciclos largos de obra y no describe ninguna de las dos — fue lo que
hizo que INCASA apareciera con 21.5 km promedio teniendo 40 configurados.
`useViajesMaterial` filtra igual al consultarla.

#### Calibración de los defaults (2026-08-04)

`velocidad_promedio_kmh = 30`, `minutos_carga_descarga = 19`, `factor_tolerancia_tiempo = 0.55`.

Salen de ajustar una recta a las **medianas** de duración por distancia (5 km→39 min,
15→76, 21.5→87, 36→165): pendiente 4.06 min/km ida y vuelta ⇒ 29.5 km/h de recorrido,
con 19 min de intercepto. **Se ajustó contra medianas y no contra percentiles bajos**
precisamente porque estos están contaminados.

El factor 0.55 no es arbitrario: deja el umbral por debajo del percentil 25 observado en
todos los bancos medidos (el único que queda arriba es CHUPON, cuyo p25 de 22 min para
16 km ya es implausible), y muy por encima de los ciclos de 1-3 min. Con factor 1.0 se
bloquearía la mitad de los viajes legítimos por definición.

#### Umbrales reales en producción (verificados 2026-08-04, tras correr la vista)

| ruta | km | n ciclos | fórmula | p05 | **umbral** | gana |
|---|---|---|---|---|---|---|
| o16 CALLE PROL SALK | 5 | 5020 | 21 | 4.8 | **21** | fórmula |
| o16 SATURNINO CEDILLO | 10 | 130 | 32 | 15.5 | **32** | fórmula |
| o16 MAGDALENO CEDILLO | 15 | 944 | 43 | 11.6 | **43** | fórmula |
| o15 MAGDALENO CEDILLO | 15 | 142 | 43 | 47.3 | **47** | histórico |
| o16 CHUPON | 16 | 81 | 46 | 1.1 | **46** | fórmula |
| o16 INCASA (planta) | 17 | 207 | 48 | 59.2 | **59** | histórico |
| o15 GRAMOL | 36 | 111 | 90 | 16.5 | **90** | fórmula |
| o16 GRAMOL | 36 | 200 | 90 | 133.0 | **133** | histórico |
| o16 INCASA (obra) | 40 | 50 | 98 | 115.2 | **115** | histórico |

El `TECHO_MINUTOS` se subió de 120 a **180** por esta tabla: el p05 de GRAMOL (133 min)
es legítimo y 120 se lo recortaba. El banco más lejano configurado está a 40 km, así que
180 cubre cualquier ruta real con margen.

Los p05 de un solo dígito en bancos con miles de ciclos (PROL SALK: 4.8 min para 5 km con
5,020 ciclos) son la prueba de por qué el historial no puede bajar el umbral: son ~250
ciclos físicamente imposibles en el banco más transitado.

`min_minutos_entre_viajes` **ya no es un piso, solo el fallback** — dejarlo como piso
mantendría el problema original en los bancos cercanos. La columna no se migró ni se borró.

### Registrar antes de tiempo: se permite, con motivo

El umbral dejó de ser un muro. Si faltan minutos, `ViajesMaterialSection` abre
`ModalMotivo` (chips + texto libre, obligatorio solo en "Otro") y el viaje se registra
con `registro_anticipado`, `minutos_faltantes_anticipado` y el motivo.

**El botón NO se pinta en gris antes del tiempo mínimo** — se queda en color, en ámbar,
y cambia a *"Registrar Viaje N apresurado"* con icono de reloj. Un botón gris comunica
"no se puede" y el usuario ni lo intenta, que es justo lo contrario de lo que se busca:
el registro sí se puede hacer, solo pide motivo. El gris queda reservado para el único
bloqueo real de esa pantalla, que es no haber impreso el ticket.
`minutos_minimos_calculados` se guarda **en todos los viajes**, no solo los anticipados:
es lo único que permite auditar después si el umbral quedó bien calibrado.

Sin motivo válido sigue siendo un bloqueo (`useViajesMaterial:276`). **El Administrador
ya no está exento de esta regla** (sí sigue exento de la jornada): es justamente quien
captura vales fuera de campo, el caso que se quiere auditar.

### La foto de evidencia es opcional, pero la ausencia se declara

Aplica a los **tres** tipos de vale. Antes, cuando el vale se capturaba después y fuera
de campo, el usuario fotografiaba la nada solo para poder avanzar — una evidencia falsa
guardada como válida, peor que ninguna. Ahora hay un botón "No tomar foto" que exige
motivo, guardado en `foto_omitida` + `motivo_sin_foto_codigo` + `motivo_sin_foto_texto`
(en `vale_material_viajes`, `vale_renta_detalle` y `vale_material_detalles`).

`componets/vale/ModalMotivo.js` exporta dos piezas: `FormularioMotivo` (solo el
contenido) y `ModalMotivo` (con su `<Modal>`). **`ModalEvidenciaViaje` usa el primero
dentro de su propio modal, con un estado `paso`** — Android no apila dos `<Modal>`.

Los motivos **sí se leen**, en tres lugares. Se hizo a propósito para no repetir lo de
`foto_evidencia_url`, que se guarda desde 2026-04 y no se muestra en ninguna pantalla ni
PDF:

| Dónde | Qué muestra |
|---|---|
| `ViajesMaterialSection` → `ViajeItem` (vale `en_proceso`) | Chips "Anticipado" / "Sin foto"; al tocarlos, el motivo |
| `SeccionViajesMaterialCompletado` (vale **ya emitido**) | Badge ámbar en el header con el total de excepciones, nota que **lista cada viaje con sus minutos y su motivo**, e iconos en la columna Hora |
| CSV de historial | 6 columnas (`historialConverter.js`) |

El bloque del vale emitido **lista los motivos completos, no solo un icono**: el residente
revisa el vale días después y necesita reconstruir qué pasó sin llamarle al checador.

> El distintivo **no** está en `ValeCard` (la lista). `VALE_SELECT_LISTA` excluye a
> propósito `vale_material_viajes` para que la lista siga siendo ligera, y saber si un
> vale tiene excepciones exige leer sus viajes. Si se quiere en la lista, la vía barata
> es una columna agregada en `vale_material_detalles`, no engordar el select.

> Migración: `20260804_tiempo_dinamico_y_motivos.sql`. **Correrla antes de desplegar** —
> el INSERT de viajes ya manda las columnas nuevas. `cargarConfiguracion` reintenta con
> el select viejo si falla, pero eso solo cubre la lectura, no el insert.

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

> **⚠️ 146 y 888 son CC (centro de costo), NO `id_obra`** (confirmado con el usuario,
> 2026-08-04). Son columnas distintas de `obras`: `id_obra` es la PK y `cc` el centro de
> costo que además se usa para armar los folios.
>
> Los `id_obra` reales están en el rango 8–21. La obra con más volumen registrado es la
> **`id_obra` 16** (5,021 ciclos en un solo banco); la que se comporta como obra de
> pruebas es la **`id_obra` 14** — sus bancos se llaman "BANCO PRUEBA" / "BANCO PRUEBA 2"
> y su velocidad implícita da 797 km/h.
>
> **Por lo tanto todos los `id_obra != 888` del repo comparan una PK contra un CC y no
> excluyen nada**, y la obra de pruebas real sí entra en reportes y estadísticas.
> Pendiente de decidir con el usuario. Antes de escribir un filtro nuevo:
> `SELECT id_obra, cc, obra, activo FROM obras ORDER BY id_obra;`

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
