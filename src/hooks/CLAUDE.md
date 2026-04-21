# CLAUDE.md — src/hooks/

Hooks de lógica de negocio. Un hook = una responsabilidad.

---

## VALE_SELECT_COMPLETO — OBLIGATORIO

Toda query que lea detalle de un vale DEBE usar esta constante. Nunca duplicar el select manualmente.

```javascript
import { VALE_SELECT_COMPLETO } from "./queries/valesSelect";

const { data, error } = await supabase
  .from("vales")
  .select(VALE_SELECT_COMPLETO)
  .eq("id_vale", id);
```

Si agregas un campo nuevo a la query, agrégalo en `queries/valesSelect.js` — no en el hook.

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
- `fecha_creacion` — timestamp financiero inmutable. NO usar para filtrar estadísticas.
- `fecha_completado` — fecha operacional. USAR para estadísticas y agrupaciones.

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

## Estado stale en callbacks

```javascript
// MAL — puede leer valor stale de state
const handleGuardar = useCallback(async () => {
  await guardar(miEstado);
}, []);

// BIEN — useRef para valores que cambian frecuente
const miEstadoRef = useRef(miEstado);
useEffect(() => { miEstadoRef.current = miEstado; }, [miEstado]);

const handleGuardar = useCallback(async () => {
  await guardar(miEstadoRef.current);
}, []);
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

## RLS — Lógica de acceso a obras

Un usuario accede a vales de una obra si:
1. Es `Administrador` o `Finanzas` (acceso global)
2. Tiene la obra en `persona_obra` (asignación explícita)
3. La obra es su `id_current_obra` en `persona` (obra activa)

Roles exactos (casing importa en las políticas):
- `Administrador`, `Residente`, `Finanzas`, `Sindicato` — PascalCase
- `CHECADOR` — MAYÚSCULAS
