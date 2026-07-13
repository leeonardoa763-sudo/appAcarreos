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
| `rentaHelpers/` | Subcomponentes de vales de renta (tipo 2) |
| `helpersMaterial/` | Subcomponentes de vales de material (tipo 1 y 3) |
| `modals/` | Modales reutilizables |
