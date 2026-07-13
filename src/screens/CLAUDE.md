# CLAUDE.md — src/screens/

Pantallas lean: solo orquestan. La lógica va en hooks. La UI en componentes helper.

---

## Regla fundamental

Una pantalla NO debe tener lógica de negocio directamente. Patrón:

```
Screen.js         → orquesta, pasa props, maneja navegación
useXxxLogic.js    → lógica de negocio, queries, estado
XxxComponent.js   → UI pura, recibe props
```

---

## Dominio — Tipos de vale

### Vale Material (`tipo = 1` o `tipo = 3`)
- Registra viajes de camión con material (m³, toneladas)
- `detalle`: banco de origen, distancia, precio/m³, total
- `viajes`: tabla `vale_material_viajes`
- **Tipo 3:** soporta override por viaje (`id_banco_override`, `distancia_km_override`, `precio_m3_override`, `costo_viaje_override`). Feature flag: `TIPO3_FLUJO_DOS_PASOS`

### Vale Renta (`tipo = 2`)
- Registra renta de equipo (hora/día)
- `detalle`: tabla `vale_renta_detalle` — equipo, tarifa, unidad
- `viajes`: tabla `vale_renta_viajes` — cada turno/uso

---

## Ciclo de vida de un vale (`estado`)

```
borrador → en_proceso → emitido → verificado → conciliado
                                                    ↑
                                               cancelado (solo desde en_proceso)
```

| Estado | Quién actúa |
|---|---|
| `borrador` | Default BD al crear |
| `en_proceso` | Activo, editando/agregando viajes |
| `emitido` | Completado y firmado |
| `verificado` | Sindicato aprobó |
| `conciliado` | Finanzas lo incluyó en conciliación |
| `cancelado` | Residente lo anuló (solo desde `en_proceso`) |

---

## Roles en componentes

```javascript
const { userProfile } = useAuth();
const userRole = userProfile?.role;

const esChecador = userRole === "CHECADOR";        // MAYUSCULAS
const esAdministrador = userRole === "Administrador"; // PascalCase
const esResidente = userRole === "Residente";
const esFinanzas = userRole === "Finanzas";
const esSindicato = userRole === "Sindicato";
```

---

## AcarreosScreen — comportamiento por rol

### No-admin (Residente, Checador, etc.)
- Carga vales de los últimos **60 días** (desde `fecha_creacion`).
- Excluye estados `verificado` y `conciliado` de la lista.
- Límite: 1000 filas.

### Administrador
- Recibe **todas las obras** via `useObras(id, true)` — no filtradas por `persona_obra`.
- La lista usa un **selector de mes** (`MesSelectorRow` en FilterBar) — solo el mes seleccionado, todos los estados.
- No hay límite de filas.

### Fetch throttle
`fetchVales` tiene un cooldown de 30 segundos entre llamadas automáticas. Usar `force = true` para saltarlo (refresh manual, cierre de modal, cambio de mes).

```javascript
fetchVales(false, true); // force — ignora cooldown
```

### forceExpanded en búsqueda
Cuando `searchQuery` tiene texto, todos los `CollapsibleSection` se expanden forzosamente via el prop `forceExpanded`.

---

## Navegación QR de vehículos

Al escanear QR de un camión (`VH-{PLACAS}`):
1. `useVehiculoQRNavegacion` interpreta el UID
2. Si el vehículo tiene vale activo (`en_proceso`) → navega directo
3. Si no → abre `ModalSeleccionarVale`

---

## ValesScreen — botones filtrados por plataforma

`buttonConfigs` ya usa `.filter(Boolean)` con entradas condicionales por rol (`!esChecador && {...}`). El mismo patrón se usa para ocultar botones fuera de alcance en web (`!IS_WEB && {...}`) — ver CLAUDE.md raíz, sección "SOPORTE WEB". Al agregar un botón nuevo, decidir explícitamente si aplica a web o no.

## Manejo de errores en pantallas

```javascript
try {
  // logica
} catch (error) {
  console.error("Error en [pantalla/funcion]:", error);
  Alert.alert("Error", "No se pudo [accion]. Por favor intenta de nuevo.", [{ text: "OK" }]);
}
```
