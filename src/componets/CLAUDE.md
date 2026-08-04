# CLAUDE.md — src/componets/

Componentes de UI. Reciben props, no hacen queries directas.

> Nota: El nombre de la carpeta es `componets` (typo heredado del proyecto — no renombrar).

---

## Reglas

- Componentes < 600 líneas. Si crece más, extraer subcomponentes.
- Solo `MaterialCommunityIcons` de `@expo/vector-icons`. Nunca Ionicons ni otros.
- Nunca emojis en strings de UI.
- Siempre `colors.*` — nunca colores hardcodeados.

---

## Orden de imports

```javascript
// 1. React y hooks nativos
import React, { useState, useEffect, useCallback, useRef } from "react";

// 2. React Native
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// 4. Config
import { colors } from "../../config/colors";

// 5. Hooks y utilidades
import { useAuth } from "../../hooks/useAuth";

// 6. Subcomponentes
import CustomButton from "../CustomButton";
```

---

## Ocultar UI fuera de alcance en web

Usar el flag `IS_WEB` de `src/config/features.js` (no `Platform.OS === "web"` inline repetido). Ver CLAUDE.md raíz, sección "SOPORTE WEB", para qué funciones están fuera de alcance en la v1 web (registrar/completar viaje, asignar vehículo post-creación, impresión Bluetooth, PDF).

```javascript
import { IS_WEB } from "../../config/features";

{!IS_WEB && <BotonRegistrarViaje ... />}
```

Si el botón/acción usa `Alert.alert` con botones que disparan la acción, usar `crossAlert` (`src/utils/crossAlert.js`) — `Alert.alert` no hace nada en web.

## Dos modales en Android — TRAMPA CRÍTICA

Android no apila dos `<Modal>` confiablemente. Siempre usar ref + setTimeout:

```javascript
const abrirSegundoModal = () => {
  setPrimerModalVisible(false);
  setTimeout(() => setSegundoModalVisible(true), 300);
};
```

---

## StyleSheet

```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  subtitulo: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
```

---

## ValeDetalleModal — carga lazy del detalle

La lista (`AcarreosScreen`) usa `VALE_SELECT_LISTA` (ligero). Al abrir el modal, `ValeDetalleModal` hace un fetch adicional con `VALE_SELECT_COMPLETO` y muestra un spinner mientras carga. Los componentes hijos (`ValeDetalleMaterial`, `ValeDetalleRenta`) reciben el `valeCompleto` — nunca el objeto ligero de la lista.

No pasar el vale de la lista directamente a los hijos del modal.

---

## CollapsibleSection — prop forceExpanded

`forceExpanded={true}` fuerza la sección abierta sin modificar el estado interno. Usar cuando el padre necesita expandir todas las secciones temporalmente (ej. búsqueda activa).

```javascript
<CollapsibleSection forceExpanded={!!searchQuery.trim()} ...>
```

---

## Reimprimir PDF

El botón de reimpresión en `ValeDetalleMaterial` y `ValeDetalleRenta` se muestra para **todos los estados excepto `en_proceso`** (antes solo en `emitido`).

---

## Subcarpetas

| Carpeta | Contenido |
|---|---|
| `acarreos/` | `ValeDetalleMaterial`, `ValeDetalleRenta`, `FilterBar`, tarjetas de vale |
| `acarreos/helpersMaterial/` | Subcomponentes de vales de material (tipo 1 y 3) |
| `acarreos/rentaHelpers/` | Subcomponentes de vales de renta (tipo 2) |
| `modals/` | Modales reutilizables — incluye `agregarOperador/` y `asignarVehiculo/` |
| `forms/` | `FormInput`, `FormCheckbox`, `CustomModalPicker`, `CustomTimePicker`, `CustomWeekPicker`, `CustomDatePicker` (ver nota abajo) |
| `historial/` | `FiltrosHistorial`, `ListaFoliosHistorial` — pantalla de historial/exportación |
| `common/` | `PrimaryButton`, `CollapsibleSection`, `QRScannerModal`, `StatusBadge`, `SuccessModal`, `ModalCancelarVale`, ... |
| `stats/` | `EstadisticasMaterialTab` / `EstadisticasRentaTab` y sus tarjetas de gráfica (`BarChartCard`, `LineChartCard`, `PieChartCard`, `ChartCard`) |
| `ButtonsGrid/` | `ButtonsGrid`, `UserProfile` |
| `vale/`, `operadores/`, `bancos/`, `materiales/`, `obras/`, `presupuestos/`, `dev/`, `ValeSelectionModal/` | Por dominio |

### Componentes de formulario — qué existe realmente

`forms/` tiene exactamente seis: `FormInput`, `FormCheckbox`, `CustomModalPicker`, `CustomTimePicker`, `CustomWeekPicker`, `CustomDatePicker`.

**`CustomDatePicker` y `CustomTimePicker` NO usan `@react-native-community/datetimepicker`,
a propósito** — es un modal propio con columnas y `FlatList`. El paquete nativo daba
problemas en distintos dispositivos (ver cabecera de `CustomTimePicker.js`) y, al no
depender de un módulo nativo, estos dos funcionan igual en Android, iOS y en el build
web sin necesitar una variante `.web.js`. No sustituirlos por el picker nativo.

**Ojo con `CustomModalPicker`: su `keyExtractor` hace `item.id.toString()`**, así que
un item con `id: null` tumba el componente. Para una opción "todos / sin filtro" usar
un centinela string (`SIN_FILTRO` en `historial/FiltrosHistorial.js`) y traducirlo a
`null` en la pantalla, no pasar `null` como `id`.

Los `Form*` **se borraron el 2026-07-29** por no tener uso: `FormPicker`, `FormTimePicker`, `FormDecimalInput`, `FormNumberInput`, `FormAutocomplete`. Ojo con los pares de nombre parecido — el picker vivo es `CustomModalPicker` (no `FormPicker`) y el de hora es `CustomTimePicker` (no `FormTimePicker`). Para un input decimal no queda reemplazo: usar `FormInput` con `keyboardType="numeric"`, como ya hace `ViajesMaterialSection`.

### No hay tutorial in-app — se enlaza la web de ayuda

`componets/tutorial/` y `TutorialHelpButton` fueron eliminados: los tutoriales viven en una web aparte. `ButtonsGrid` ya no acepta `registerRef` ni lee `tutorialId` de los botones. Ver CLAUDE.md raíz, sección "Limpieza de código muerto".

Lo que sí existe es **`common/BotonAyuda`**: un icono `help-circle-outline` que abre una página de esa web en un navegador dentro de la app. No reimplementar tutoriales aquí — agregar un enlace.

```javascript
import { urlAyudaVale } from "../../config/ayuda";
import BotonAyuda from "../common/BotonAyuda";

// En el header de la sección, al final de la fila (el titulo ya lleva flex: 1)
<BotonAyuda url={urlAyudaVale(vale, "registrar")} />
```

- `variante="header"` para cabeceras de color (pinta el icono blanco); default azul.
- **La URL la resuelve `src/config/ayuda.js`, no la sección.** `urlAyudaVale(vale, paso)` decide la guía según el tipo de vale (material / renta / pipa / asfáltico) y solo pega el `#paso-...` si esa guía tiene ese paso.
- Si el componente no recibe el `vale` (caso de `acarreos/ViajesRentaSection`), el padre resuelve la URL y la baja como prop `ayudaUrl`. No agregar el `vale` como prop solo para esto.

Ver también CLAUDE.md raíz, sección "CENTRO DE AYUDA".
