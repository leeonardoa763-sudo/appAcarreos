# CLAUDE.md — src/hooks/

Hooks de lógica de negocio. Un hook = una responsabilidad.

---

## Selects de vales — dos constantes

Hay dos constantes en `queries/valesSelect.js`. Usar la correcta según el contexto:

| Constante | Cuándo usar |
|---|---|
| `VALE_SELECT_LISTA` | Lista/scroll — solo campos visibles en ValeCard y filtros. Sin `vale_material_viajes` ni `precios_renta`. |
| `VALE_SELECT_COMPLETO` | Detalle de un vale individual — incluye todos los subtablas. |

```javascript
import { VALE_SELECT_LISTA, VALE_SELECT_COMPLETO } from "./queries/valesSelect";

// Lista → ligero
const { data } = await supabase.from("vales").select(VALE_SELECT_LISTA).in("id_obra", ids);

// Detalle → completo
const { data } = await supabase.from("vales").select(VALE_SELECT_COMPLETO).eq("id_vale", id).maybeSingle();
```

Si agregas un campo nuevo a la query, agrégalo en `queries/valesSelect.js` — no en el hook.

---

## PostgREST corta en `max-rows` — paginar o perder filas

Supabase limita cada respuesta a `max-rows` (1000 por defecto) **sin avisar**: no
hay error, solo llegan menos filas. Una query "de todo el histórico" devuelve 1000
vales y el resto desaparece en silencio — un CSV incompleto que nadie nota.

Si una query no está acotada por fecha o por un `.limit()` explícito que tú
elegiste, hay que paginar con `.range()` hasta que una página vuelva incompleta,
con un tope duro para no colgar la app:

```javascript
const PAGE_SIZE = 500;
let offset = 0;
for (;;) {
  const { data, error } = await supabase
    .from("vales")
    .select(SELECT)
    .order("fecha_creacion", { ascending: false })
    .order("id_vale", { ascending: false })   // orden estable entre paginas
    .range(offset, offset + PAGE_SIZE - 1);
  if (error) throw error;
  filas.push(...(data || []));
  if ((data || []).length < PAGE_SIZE) break;
  if (filas.length >= MAX_FILAS) { truncado = true; break; }
  offset += PAGE_SIZE;
}
```

El **segundo `.order()` no es opcional**: sin un desempate determinista, dos
páginas pueden repetir u omitir filas con el mismo `fecha_creacion`.

Implementación de referencia: `exportHelpers/historialQueries.js`. Cuando se
alcanza el tope, la UI debe decirlo (`truncado`) en vez de entregar datos
parciales como si estuvieran completos.

---

## Patrón estándar de query Supabase

```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("tabla").select(VALE_SELECT_COMPLETO);
      if (error) throw error;
      setData(data);
    } catch (error) {
      console.error("Error en [hook]:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

---

## Fechas — Bug UTC-6 (México)

```javascript
// MAL — se parsea como UTC midnight, llega a México como día anterior
const fecha = new Date("2024-03-15");

// BIEN — constructor local (mes es 0-indexed)
const fecha = new Date(2024, 2, 15);

// MAL — para guardar en Supabase
const fechaStr = new Date().toISOString().split("T")[0];

// BIEN — string local manual
const hoy = new Date();
const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
```

**Campos de fecha en vales:**
- `fecha_creacion` — timestamp de creación. USAR para filtrar listas y estadísticas (`useEstadisticasMaterial`, `useEstadisticasMaterialTendencia`).
- `fecha_completado` — fecha en que se completó/emitió el vale. Puede ser `null` en `en_proceso`. Para agrupaciones usar `fecha_completado ?? fecha_creacion`.

---

## FK aliases en Supabase PostgREST

Cuando dos FKs apuntan a la misma tabla, PostgREST necesita el nombre exacto del constraint.

```javascript
// MAL — falla silenciosamente si hay dos FKs a la misma tabla
.select('*, bancos(*)')

// BIEN — nombre completo del constraint como alias
.select(`
  *,
  bancos_override:vale_material_viajes_id_banco_override_fkey (
    id_banco, nombre, precio_m3
  )
`)
```

Si un join devuelve `null` inesperadamente, verificar constraints en `information_schema.table_constraints`.

---

## Alert.alert no funciona en web

`react-native-web` no implementa `Alert.alert` (es un no-op silencioso). En cualquier hook que corra también en la versión web (ver CLAUDE.md raíz, sección "SOPORTE WEB"), si el `Alert.alert` tiene botones cuyo `onPress` dispara una acción o cierra un flujo (confirmaciones, éxito con callback), usar `crossAlert` de `src/utils/crossAlert.js` en su lugar — mismo API (`title, message, buttons`). Alertas de solo error/notificación (un botón, sin `onPress` relevante) pueden dejarse con `Alert.alert` normal.

## Orden de declaración en useCallback — TDZ real en web

Babel transpila `let`/`const` en modo *loose* para nativo (sin TDZ real), por lo que un `useCallback` que referencia en su arreglo de dependencias una función `const` declarada MÁS ABAJO en el mismo hook "funciona por accidente" en Android/iOS. El build web sí aplica TDZ estricta y truena con `Cannot access 'X' before initialization`. Siempre declarar las funciones dependientes (`_cargarX`, helpers internos) ANTES del `useCallback` que las usa, sin depender del hoisting.

## Estado stale en callbacks — BUG REAL, no teórico

Si un `useCallback` **lee** un state, ese state va en el arreglo de dependencias. Omitirlo no da error ni warning en runtime: la función simplemente guarda el valor que tenía la última vez que el callback se recreó, y escribe eso en la BD.

**Caso real (corregido 2026-07-29):** en `ValeDetalleMaterial.js`, `handleCompletar` leía `notasAdicionales` pero sus deps eran `[completarVale, userProfile, totalTickets, totalViajes]`. El callback solo se recreaba al registrar un viaje o imprimir un ticket, así que **las notas escritas después del último viaje —el flujo normal— se guardaban como `null`**. Parecía intermitente y "dependiente del rol", pero no había ninguna condición de rol: dependía de si escribías la nota antes o después del último viaje. El equivalente en `ValeDetalleRenta.js` sí tenía la dep y funcionaba bien.

Antes de completar/guardar, revisar que **todo state leído dentro del callback esté en sus deps**.

```javascript
// MAL — guarda el valor de notas de hace varios renders
const handleCompletar = useCallback(async () => {
  await completar({ notas: notasAdicionales });
}, [completarVale, totalViajes]);

// BIEN — la dep faltante
const handleCompletar = useCallback(async () => {
  await completar({ notas: notasAdicionales });
}, [completarVale, totalViajes, notasAdicionales]);

// ALTERNATIVA — useRef cuando el valor cambia en cada tecla y no quieres recrear
const notasRef = useRef(notasAdicionales);
useEffect(() => { notasRef.current = notasAdicionales; }, [notasAdicionales]);
const handleCompletar = useCallback(async () => {
  await completar({ notas: notasRef.current });
}, [completarVale]);
```

---

## Supabase `.single()` con joins complejos

PostgREST puede lanzar "cannot coerce to single JSON object" aunque haya una sola fila. Usar `.maybeSingle()` y validar el resultado.

---

## Tablas de BD relevantes para hooks

| Tabla | Descripción |
|---|---|
| `vales` | Cabecera. FK a obra, operador, vehículo, persona creadora |
| `vale_material_detalles` | Detalle material: banco, distancia, precio, totales |
| `vale_material_viajes` | Un viaje por fila. Soporta overrides de banco/precio |
| `vale_renta_detalle` | Detalle renta: equipo, tarifa, unidad de tiempo |
| `vale_renta_viajes` | Un turno/uso por fila |
| `persona` | `auth_user_id` → `auth.users.id`. Tiene `id_role`, `id_current_obra` |
| `operadores` | `nombre_completo` es columna GENERADA — INSERT solo `nombre`, `primer_apellido`, `segundo_apellido` |
| `distancias_banco_obra` | Distancias precargadas banco→obra |
| `conciliaciones` | Agrupación de vales para pago |

---

## useObras — parámetro esAdmin

`useObras(personaId, esAdmin)` tiene dos modos:

- `esAdmin = false` (default): query a `persona_obra` — devuelve solo las obras asignadas.
- `esAdmin = true`: query directa a `obras` — devuelve todas excepto la 888 (prueba).

```javascript
const { obras } = useObras(userProfile?.id_persona, esAdministrador);
```

---

## Estadísticas — estados y periodo

`useEstadisticasMaterial` y `useEstadisticasMaterialTendencia` incluyen el estado `en_proceso` en sus filtros. Los periodos soportados son: `hoy`, `ayer`, `semana`, `mes`, `trimestre`, `anio`.

Periodos cortos (`hoy`, `ayer`, `semana`) agrupan por **día**; los demás agrupan por **semana ISO**.

---

## RLS — Lógica de acceso a obras

Un usuario accede a vales de una obra si:
1. Es `Administrador` o `Finanzas` (acceso global)
2. Tiene la obra en `persona_obra` (asignación explícita)
3. La obra es su `id_current_obra` en `persona` (obra activa)

Roles exactos (casing importa en las políticas):
- `Administrador`, `Residente`, `Finanzas`, `Sindicato` — PascalCase
- `Planta de Asfaltos` — PascalCase **con espacios**. Ver screens/CLAUDE.md para sus reglas
- `CHECADOR` — MAYÚSCULAS

`userRole` viene de `useAuth()` ya resuelto (`AuthContext` lo calcula como `userProfile?.roles?.role`). No leer `userProfile?.role` — no existe.
