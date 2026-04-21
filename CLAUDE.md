# CLAUDE.md — Control de Acarreos (appAcarreos)

> Archivo de contexto para Claude Code. Leer completo antes de cualquier tarea.
> Última actualización: 2025

---

## 1. QUÉ ES ESTE PROYECTO

**Control de Acarreos** es un sistema empresarial para una constructora mexicana que gestiona la logística de transporte en obras de construcción. El núcleo del sistema son los **"vales"**: comprobantes digitales de entrega de material o renta de equipo.

El sistema tiene **dos plataformas**:

| Plataforma                      | Repositorio / URL                 | Propósito                                          |
| ------------------------------- | --------------------------------- | -------------------------------------------------- |
| **App móvil** (`appAcarreos-1`) | Expo / React Native               | Operación en campo — Android, trabajadores de obra |
| **Web de verificación**         | `https://web-acarreos.vercel.app` | Consulta pública de vales por folio/QR, sin login  |

### La web companion

La web (`web-acarreos.vercel.app`) es una aplicación de **solo lectura** desplegada en Vercel. Su único propósito es que cualquier persona (sindicato, auditor, cliente) pueda escanear el QR de un vale impreso y ver su detalle completo sin necesitar la app. Accede al mismo Supabase backend. Las rutas siguen el patrón:

```
https://web-acarreos.vercel.app/vale/{folio}
```

Los QR que se imprimen en los tickets físicos (impresora térmica) codifican estas URLs. No tiene autenticación propia — usa las políticas RLS de Supabase con el rol `anon` (que tiene SELECT en vales, bancos y vehiculos).

---

## 2. STACK TECNOLÓGICO

### App móvil

- **Framework:** React Native + Expo (managed workflow)
- **Navegación:** React Navigation v6 — Stack, Tabs, Drawer
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Storage + Edge Functions)
- **Bluetooth:** `react-native-ble-manager` — impresoras térmicas 58mm ESC/POS
- **PDF:** `expo-print` + `expo-file-system/legacy` + `expo-sharing`
- **QR externo:** `api.qrserver.com` (imágenes QR en PDFs y tickets)
- **Iconos:** `MaterialCommunityIcons` de `@expo/vector-icons` — SIEMPRE estos, nunca Ionicons
- **Estilos:** `StyleSheet` de React Native — sin Tailwind, sin styled-components

### Build y distribución

- **Builds:** EAS local en Mac (`luisgabinoaguilar`, carpeta `appAcarreos-1`)
- **Distribución:** APK por Google Drive / WhatsApp (Android únicamente por ahora)
- **iOS:** Pendiente (TestFlight o instalación directa con Xcode)

### Supabase

- **Project ref:** `zqdnyqvgfymjorfplquf`
- **Email reporting:** Resend via Edge Function `send-vale-email` → `control.acarreos@grupoesp.mx`

---

## 3. PALETA DE COLORES OBLIGATORIA

Siempre importar desde `src/config/colors.js`:

```javascript
import { colors } from "../config/colors";
```

| Token                  | Hex       | Uso                                         |
| ---------------------- | --------- | ------------------------------------------- |
| `colors.primary`       | `#FF6B35` | Naranja construcción — acciones principales |
| `colors.secondary`     | `#004E89` | Azul profesional — headers, énfasis         |
| `colors.accent`        | `#1A936F` | Verde verificación — estados positivos      |
| `colors.surface`       | `#FFFFFF` | Fondos de tarjetas                          |
| `colors.background`    | `#F5F6FA` | Fondo general de pantallas                  |
| `colors.textPrimary`   | `#2C3E50` | Texto principal                             |
| `colors.textSecondary` | `#7F8C8D` | Texto secundario / subtítulos               |

**Nunca** usar colores hardcodeados. **Nunca** usar emojis en el código fuente.

---

## 4. ARQUITECTURA DE ARCHIVOS

```
src/
├── config/
│   ├── colors.js               # Paleta de colores (obligatorio importar)
│   ├── features.js             # Feature flags (ej: BLUETOOTH_ENABLED)
│   └── supabase.js             # Cliente Supabase
├── hooks/
│   ├── useAuth.js              # Autenticación y perfil de usuario
│   ├── queries/
│   │   └── valesSelect.js      # VALE_SELECT_COMPLETO (constante centralizada)
│   └── [feature]/              # Un hook por responsabilidad clara
├── screens/
│   └── [NombrePantalla].js     # Pantallas lean — solo orquestación
├── components/
│   ├── rentaHelpers/           # Subcomponentes de vales de renta
│   └── helpersMaterial/        # Subcomponentes de vales de material
└── utils/
    └── formatters.js           # Formateo de fechas, moneda, etc.
```

### Reglas de arquitectura

- **Screens lean:** La pantalla orquesta; la lógica va en hooks; la UI en componentes helper.
- **Un hook = una responsabilidad.** No crear hooks dios.
- **Archivos < 600 líneas.** Si crece más, dividir.
- **`VALE_SELECT_COMPLETO`** está centralizado en `hooks/queries/valesSelect.js`. Todas las queries que lean detalle de vale DEBEN usar esta constante. Nunca duplicar el select manualmente o se producen bugs de campo faltante.

---

## 5. DOMINIO DEL NEGOCIO

### Dos tipos de vale

#### Vale Material (`tipo = 1` o `tipo = 3`)

Registra viajes de camión cargando material (m³, toneladas). Campos clave:

- `detalle`: banco de origen, distancia, precio/m³, total
- `viajes`: tabla `vale_material_viajes` — cada viaje tiene su ticket, folio de banco, m³ y peso
- **Tipo 3 (flujo dos pasos):** soporta override por viaje (`id_banco_override`, `distancia_km_override`, `precio_m3_override`, `costo_viaje_override`). Feature flag: `TIPO3_FLUJO_DOS_PASOS` (pendiente de cleanup futuro)

#### Vale Renta (`tipo = 2`)

Registra renta de equipo (hora/día). Campos clave:

- `detalle`: tabla `vale_renta_detalle` — equipo, tarifa, unidad de tiempo
- `viajes`: tabla `vale_renta_viajes` — registro de cada uso/turno

### Ciclo de vida de un vale (`estado`)

```
borrador → en_proceso → emitido → verificado → conciliado
                                        ↓
                                    cancelado
```

| Estado       | Descripción                                                      |
| ------------ | ---------------------------------------------------------------- |
| `borrador`   | Default de BD al crear — estado inicial antes de estar activo   |
| `en_proceso` | Vale activo, aún editando/agregando viajes                      |
| `emitido`    | Completado y firmado digitalmente                               |
| `verificado` | Sindicato lo revisó y aprobó                                    |
| `conciliado` | Finanzas lo incluyó en una conciliación                         |
| `cancelado`  | Anulado por Residente (solo desde `en_proceso`)                 |

### Campos de fecha — distinción crítica

| Campo              | Propósito                                         | Regla                                 |
| ------------------ | ------------------------------------------------- | ------------------------------------- |
| `fecha_creacion`   | Timestamp financiero/presupuestal **inmutable**   | NO usar para filtrar estadísticas     |
| `fecha_completado` | Fecha operacional — cuándo se completó el trabajo | Usar para estadísticas y agrupaciones |

**Siempre** construir fechas con `new Date(year, month, day)` (hora local). **Nunca** `new Date("YYYY-MM-DD")` — se interpreta como UTC midnight y en México (UTC-6) crea desfase de un día.

---

## 6. BASE DE DATOS — TABLAS PRINCIPALES

### Tablas maestras

| Tabla          | Descripción                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `persona`      | Usuarios del sistema. `auth_user_id` → `auth.users.id`. Tiene `id_role`, `id_current_obra`, `id_sindicato`                                 |
| `roles`        | Catálogo de roles: `Administrador`, `Residente`, `CHECADOR`, `Finanzas`, `Sindicato`                                                       |
| `obras`        | Obras de construcción. **obra 888 = TEST, nunca en producción**                                                                            |
| `persona_obra` | Relación M:N persona ↔ obra                                                                                                                |
| `operadores`   | Choferes de camión. `nombre_completo` es columna **generada** en PostgreSQL — INSERT solo `nombre`, `primer_apellido`, `segundo_apellido`  |
| `vehiculos`    | Camiones. `qr_uid` formato `VH-{PLACAS}` para QR permanentes                                                                               |
| `bancos`       | Bancos de material (yacimientos). Lectura pública (`anon`)                                                                                 |
| `sindicatos`   | Sindicatos de operadores                                                                                                                   |

### Tablas de vales

| Tabla                   | Descripción                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `vales`                    | Cabecera de cada vale. FK a obra, operador, vehículo, persona creadora |
| `vale_material_detalles`   | Detalle de un vale de material (banco, distancia, precio, totales)     |
| `vale_material_viajes`     | Un viaje por fila. Soporta overrides de banco/precio por viaje         |
| `vale_renta_detalle`       | Detalle de un vale de renta (equipo, tarifa, unidad)                   |
| `vale_renta_viajes`        | Un turno/uso por fila                                                  |

### Tablas de proceso

| Tabla                   | Descripción                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `conciliaciones`        | Agrupación de vales para pago. Vinculada a sindicato                  |
| `conciliacion_vales`    | Relación M:N conciliacion ↔ vales                                     |
| `distancias_banco_obra` | Distancias precargadas banco→obra para cálculo automático             |
| `app_config`            | Configuración dinámica de la app (lectura pública si `activo = true`) |

---

## 7. POLÍTICAS RLS — RESUMEN EJECUTIVO

RLS habilitado en **todas** las tablas. Las políticas controlan qué ve y puede hacer cada rol.

### Roles y sus permisos clave

| Rol             | Casing exacto | Permisos destacados                                                                    |
| --------------- | ------------- | -------------------------------------------------------------------------------------- |
| `Administrador` | PascalCase    | Lee y modifica todo. Verifica vales. Crea conciliaciones. Gestiona distancias y config |
| `Residente`     | PascalCase    | Opera vales de sus obras asignadas (`persona_obra`). Cancela vales `en_proceso`        |
| `CHECADOR`      | MAYÚSCULAS    | UI restringida. Lee vales de su obra actual (`id_current_obra`)                        |
| `Finanzas`      | PascalCase    | Lee todo. Actualiza conciliaciones. No crea vales                                      |
| `Sindicato`     | PascalCase    | Ve vales de sus operadores. Verifica vales `emitido`. Crea/lee sus conciliaciones      |

### Lógica de acceso a obras

Un usuario accede a vales de una obra si cumple **cualquiera** de estas condiciones:

1. Es `Administrador` o `Finanzas` (acceso global)
2. Tiene la obra en `persona_obra` (asignación explícita)
3. La obra es su `id_current_obra` en `persona` (obra activa actual)

### Lectura pública (rol `anon`)

Las tablas `vales`, `bancos` y `vehiculos` tienen política SELECT para `anon`. Esto es intencional — la web de verificación (`web-acarreos.vercel.app`) la usa para mostrar vales sin login.

---

## 8. PATRONES DE CÓDIGO OBLIGATORIOS

### Imports organizados

```javascript
// 1. React y hooks
import React, { useState, useEffect, useCallback, useRef } from "react";

// 2. React Native
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// 4. Config
import { colors } from "../config/colors";

// 5. Hooks y utilidades
import { useAuth } from "../hooks/useAuth";
import { VALE_SELECT_COMPLETO } from "../hooks/queries/valesSelect";

// 6. Componentes
import CustomButton from "../components/CustomButton";
```

### Query Supabase con manejo de estado

```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tabla")
        .select(VALE_SELECT_COMPLETO); // usar la constante centralizada

      if (error) throw error;
      setData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

### Manejo de errores estandarizado

```javascript
try {
  // logica
} catch (error) {
  console.error("Error en [funcion]:", error);
  Alert.alert("Error", "No se pudo [accion]. Por favor intenta de nuevo.", [
    { text: "OK" },
  ]);
}
```

### Roles en componentes

```javascript
const { userProfile } = useAuth();
const userRole = userProfile?.role;

const esChecador = userRole === "CHECADOR"; // MAYUSCULAS
const esAdministrador = userRole === "Administrador"; // PascalCase
const esResidente = userRole === "Residente";
const esFinanzas = userRole === "Finanzas";
const esSindicato = userRole === "Sindicato";
```

---

## 9. TRAMPAS CONOCIDAS Y SOLUCIONES

### FK aliases en Supabase PostgREST

Cuando dos FKs apuntan a la misma tabla, PostgREST necesita el nombre del constraint como hint. Si no se especifica, el join falla silenciosamente o lanza error.

```javascript
// MAL — falla si hay dos FKs a la misma tabla
.select('*, bancos(*)')

// BIEN — usar el nombre completo del constraint
.select(`
  *,
  bancos_override:vale_material_viajes_id_banco_override_fkey (
    id_banco,
    nombre,
    precio_m3
  )
`)
```

Ante cualquier join que devuelva null inesperadamente, verificar primero los nombres de constraints en `information_schema.table_constraints`.

### Fechas y timezone (México UTC-6)

```javascript
// MAL — se parsea como UTC midnight, llega a México como día anterior
const fecha = new Date("2024-03-15");

// BIEN — constructor local
const fecha = new Date(2024, 2, 15); // mes es 0-indexed

// MAL para guardar en Supabase
const fechaStr = new Date().toISOString().split("T")[0];

// BIEN — construir string local manualmente
const hoy = new Date();
const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
```

### Estado React stale en callbacks

```javascript
// MAL — puede leer valor stale de state
const handleGuardar = useCallback(async () => {
  await guardar(miEstado); // si miEstado cambió justo antes, puede estar stale
}, []);

// BIEN — pasar valores como parámetros o usar useRef
const miEstadoRef = useRef(miEstado);
useEffect(() => {
  miEstadoRef.current = miEstado;
}, [miEstado]);

const handleGuardar = useCallback(async () => {
  await guardar(miEstadoRef.current);
}, []);
```

### Supabase `.single()` con joins anidados

PostgREST puede lanzar "cannot coerce to single JSON object" con joins complejos aunque solo haya una fila. Solución: simplificar el select o usar `.maybeSingle()` y validar.

### Dos modales en Android

Android no apila dos `<Modal>` confiablemente. Usar `ref` + `setTimeout` para cerrar el primero antes de abrir el segundo:

```javascript
const primeraModalRef = useRef(null);

const abrirSegundoModal = () => {
  setPrimerModalVisible(false);
  setTimeout(() => setSegundoModalVisible(true), 300);
};
```

### Metro bundler e imports condicionales

Los imports se resuelven **estáticamente** en Metro, sin importar feature flags en runtime. Un `require()` condicional dentro de un `if` NO previene que el módulo se compile. Cualquier import problemático debe resolverse a nivel de configuración de Metro o eliminarse del bundle.

### columna `nombre_completo` en `operadores`

Es una **columna generada** en PostgreSQL (computed). Nunca incluirla en INSERT/UPDATE. Siempre insertar los tres campos separados:

```javascript
// MAL
await supabase
  .from("operadores")
  .insert({ nombre_completo: "Juan Perez Lopez" });

// BIEN
await supabase.from("operadores").insert({
  nombre: "Juan",
  primer_apellido: "Perez",
  segundo_apellido: "Lopez",
});
```

### PDF en iOS

```css
/* Obligatorio para que los colores de fondo se impriman */
-webkit-print-color-adjust: exact !important;
background-color: #ff6b35 !important;
```

No calcular alturas manualmente. Usar `@page { size: 50mm auto }` y pasar altura explícita a `Print.printToFileAsync`.

---

## 10. SISTEMA QR DE VEHÍCULOS

Los camiones tienen stickers QR permanentes. El QR codifica `VH-{PLACAS}` (campo `vehiculos.qr_uid`).

Al escanear desde la app:

1. `useVehiculoQRNavegacion` interpreta el UID
2. Si el vehículo tiene un vale activo (`en_proceso`) → navega directo a ese vale
3. Si no → abre `ModalSeleccionarVale` para asignarle un vale nuevo

Los QR de **vales** (para la web) codifican la URL completa:

```
https://web-acarreos.vercel.app/vale/{folio}
```

---

## 11. FEATURE FLAGS

En `src/config/features.js`:

| Flag                    | Estado                     | Descripción                                             |
| ----------------------- | -------------------------- | ------------------------------------------------------- |
| `BLUETOOTH_ENABLED`     | Activo                     | Muestra/oculta UI de impresión Bluetooth                |
| `TIPO3_FLUJO_DOS_PASOS` | Activo (pendiente cleanup) | Flujo especial para vales tipo 3 con override por viaje |

---

## 12. OBRAS

| ID    | Estado         | Nota                                                             |
| ----- | -------------- | ---------------------------------------------------------------- |
| `146` | **PRODUCCIÓN** | Obra real activa — no usar para pruebas                          |
| `888` | **TEST**       | Solo para desarrollo/pruebas — excluir de toda lógica productiva |

Siempre filtrar `id_obra != 888` (o equivalente) en cualquier reporte, estadística o exportación de datos reales.

---

## 13. CONVENCIONES DE NOMBRES

| Tipo                 | Convención                | Ejemplo                          |
| -------------------- | ------------------------- | -------------------------------- |
| Componentes          | PascalCase                | `SeccionViajesMaterial.js`       |
| Hooks                | camelCase + prefijo `use` | `useValeDetalle.js`              |
| Utilidades           | camelCase                 | `formatters.js`                  |
| Constantes           | UPPER_SNAKE_CASE          | `VALE_SELECT_COMPLETO`           |
| Carpetas             | camelCase                 | `rentaHelpers/`                  |
| Variables de negocio | camelCase español         | `totalViajes`, `fechaCompletado` |

---

## 14. WORKFLOW DE DESARROLLO

- **Paso a paso:** Confirmar cada paso antes de avanzar al siguiente. Un mensaje = una funcionalidad.
- **Antes de escribir código:** Verificar nombres de columnas con `information_schema.columns` si hay duda. Correr query en Supabase SQL Editor para confirmar datos antes de escribir la lógica.
- **Cambios a BD:** Siempre aditivos/no destructivos. No modificar columnas existentes que afecten vales de producción (obra 146).
- **Debugging:** Agregar `console.log` para confirmar diagnóstico → luego aplicar fix. No adivinar.
- **Archivos con múltiples cambios:** Entregar archivo completo. Para cambios mínimos y localizados, entregar solo el bloque a reemplazar con indicación exacta de dónde va.

---

## 15. LO QUE NUNCA HACER

- Colores hardcodeados en lugar de `colors.*`
- Usar Ionicons u otros icon sets que no sean `MaterialCommunityIcons`
- Emojis en el código fuente (ni comentarios, ni strings de UI)
- `console.log` innecesarios en código final
- Componentes monolíticos > 600 líneas
- `new Date("YYYY-MM-DD")` para fechas locales
- INSERT de `nombre_completo` en tabla `operadores` (es columna generada)
- INSERT de `apellido_paterno`/`apellido_materno` — las columnas reales son `primer_apellido`/`segundo_apellido`
- Queries a `vale_*` sin usar `VALE_SELECT_COMPLETO`
- Incluir obra 888 en lógica o reportes de producción
- Dos `<Modal>` apilados en Android sin el patrón ref+timeout
