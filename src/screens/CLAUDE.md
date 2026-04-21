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

## Navegación QR de vehículos

Al escanear QR de un camión (`VH-{PLACAS}`):
1. `useVehiculoQRNavegacion` interpreta el UID
2. Si el vehículo tiene vale activo (`en_proceso`) → navega directo
3. Si no → abre `ModalSeleccionarVale`

---

## Manejo de errores en pantallas

```javascript
try {
  // logica
} catch (error) {
  console.error("Error en [pantalla/funcion]:", error);
  Alert.alert("Error", "No se pudo [accion]. Por favor intenta de nuevo.", [{ text: "OK" }]);
}
```
