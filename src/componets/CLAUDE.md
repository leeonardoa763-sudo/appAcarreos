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

## Subcarpetas

| Carpeta | Contenido |
|---|---|
| `rentaHelpers/` | Subcomponentes de vales de renta (tipo 2) |
| `helpersMaterial/` | Subcomponentes de vales de material (tipo 1 y 3) |
| `modals/` | Modales reutilizables |
