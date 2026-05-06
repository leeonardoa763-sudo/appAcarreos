// src/screens/PresupuestosObraScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/colors";
import { useAuth } from "../hooks/useAuth";
import { useObras } from "../hooks/useObras";
import { useCatalogos } from "../hooks/useCatalogos";
import { usePresupuestosAdmin } from "../hooks/usePresupuestosAdmin";
import {
  CardPresupuestoMaterial,
  CardPresupuestoRenta,
} from "../componets/presupuestos/PresupuestoCards";
import {
  ModalEditarMaterial,
  ModalEditarRenta,
  ModalNuevoMaterial,
} from "../componets/presupuestos/PresupuestoModales";

export default function PresupuestosObraScreen() {
  const { userProfile } = useAuth();
  const { obras, loading: obrasLoading } = useObras(
    userProfile?.id_persona,
    true
  );
  const { materiales } = useCatalogos(["materiales"]);

  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [modal, setModal] = useState(null);
  // modal: { tipo: 'material'|'renta'|'nuevo_material', datos: {} }

  const {
    presupuestosMaterial,
    presupuestoRenta,
    loading,
    guardando,
    guardarMaterial,
    guardarRenta,
  } = usePresupuestosAdmin(obraSeleccionada?.id, materiales);

  const handleSeleccionarObra = useCallback(
    (idObra) => {
      const obra = obras.find((o) => o.id === idObra);
      if (obra) {
        setObraSeleccionada(obra);
        setModal(null);
      }
    },
    [obras]
  );

  const abrirEditarMaterial = useCallback((item) => {
    setModal({
      tipo: "material",
      datos: {
        id_material: item.id_material,
        nombre: item.nombre,
        valorActual:
          item.presupuestados != null ? String(item.presupuestados) : "",
      },
    });
  }, []);

  const abrirNuevoMaterial = useCallback(() => {
    setModal({ tipo: "nuevo_material", datos: {} });
  }, []);

  const abrirEditarRenta = useCallback(() => {
    setModal({
      tipo: "renta",
      datos: {
        valorActual: presupuestoRenta
          ? String(presupuestoRenta.presupuestado)
          : "",
      },
    });
  }, [presupuestoRenta]);

  const cerrarModal = useCallback(() => setModal(null), []);

  const handleGuardarMaterial = useCallback(
    async (id_material, m3Texto) => {
      const m3 = parseFloat(String(m3Texto).replace(/,/g, ""));
      if (isNaN(m3) || m3 <= 0) {
        Alert.alert("Valor invalido", "Ingresa un numero mayor a 0.");
        return;
      }
      try {
        await guardarMaterial(id_material, m3);
        cerrarModal();
      } catch {
        Alert.alert("Error", "No se pudo guardar el presupuesto.");
      }
    },
    [guardarMaterial, cerrarModal]
  );

  const handleGuardarRenta = useCallback(
    async (montoTexto) => {
      const monto = parseFloat(String(montoTexto).replace(/,/g, ""));
      if (isNaN(monto) || monto <= 0) {
        Alert.alert("Valor invalido", "Ingresa un monto mayor a 0.");
        return;
      }
      try {
        await guardarRenta(monto);
        cerrarModal();
      } catch {
        Alert.alert("Error", "No se pudo guardar el presupuesto de renta.");
      }
    },
    [guardarRenta, cerrarModal]
  );

  const materialesSinPresupuesto = materiales.filter(
    (m) => !presupuestosMaterial.some((p) => p.id_material === m.id_material)
  );

  return (
    <View style={estilos.contenedor}>
      {/* Selector de obra — desplegable */}
      <View style={estilos.pickerWrapper}>
        {obrasLoading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ paddingVertical: 14 }}
          />
        ) : (
          <Picker
            mode="dropdown"
            selectedValue={obraSeleccionada?.id ?? -1}
            onValueChange={(value) => {
              if (value === -1) return;
              handleSeleccionarObra(value);
            }}
            style={estilos.picker}
            dropdownIconColor={colors.secondary}
          >
            <Picker.Item
              label="Selecciona una obra..."
              value={-1}
              color={colors.textSecondary}
              enabled={false}
            />
            {obras.map((obra) => (
              <Picker.Item
                key={obra.id}
                label={obra.nombre}
                value={obra.id}
                color={colors.textPrimary}
              />
            ))}
          </Picker>
        )}
      </View>

      {/* Contenido principal */}
      {!obraSeleccionada ? (
        <View style={estilos.centrado}>
          <MaterialCommunityIcons
            name="gesture-tap"
            size={48}
            color={colors.border}
          />
          <Text style={estilos.placeholder}>Selecciona una obra</Text>
        </View>
      ) : loading ? (
        <View style={estilos.centrado}>
          <ActivityIndicator color={colors.primary} />
          <Text style={estilos.placeholder}>Cargando presupuestos...</Text>
        </View>
      ) : (
        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.scrollContenido}
        >
          {/* Sección Materiales */}
          <View style={estilos.seccionEncabezado}>
            <Text style={estilos.seccionTitulo}>Materiales</Text>
            <TouchableOpacity
              style={estilos.botonAgregarSmall}
              onPress={abrirNuevoMaterial}
            >
              <MaterialCommunityIcons
                name="plus"
                size={16}
                color={colors.surface}
              />
              <Text style={estilos.botonAgregarSmallTexto}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {presupuestosMaterial.length === 0 ? (
            <View style={estilos.cardVacio}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={28}
                color={colors.textSecondary}
              />
              <Text style={estilos.cardVacioTexto}>
                Sin presupuestos de material configurados
              </Text>
            </View>
          ) : (
            presupuestosMaterial.map((item) => (
              <CardPresupuestoMaterial
                key={item.id_material}
                item={item}
                onEditar={() => abrirEditarMaterial(item)}
              />
            ))
          )}

          {/* Sección Renta */}
          <View style={[estilos.seccionEncabezado, { marginTop: 20 }]}>
            <Text style={estilos.seccionTitulo}>Renta</Text>
            {!presupuestoRenta && (
              <TouchableOpacity
                style={estilos.botonAgregarSmall}
                onPress={abrirEditarRenta}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={16}
                  color={colors.surface}
                />
                <Text style={estilos.botonAgregarSmallTexto}>Configurar</Text>
              </TouchableOpacity>
            )}
          </View>
          <CardPresupuestoRenta
            renta={presupuestoRenta}
            onEditar={abrirEditarRenta}
          />
        </ScrollView>
      )}

      <ModalEditarMaterial
        visible={modal?.tipo === "material"}
        datos={modal?.datos}
        guardando={guardando}
        onGuardar={handleGuardarMaterial}
        onCerrar={cerrarModal}
      />

      <ModalEditarRenta
        visible={modal?.tipo === "renta"}
        datos={modal?.datos}
        guardando={guardando}
        onGuardar={handleGuardarRenta}
        onCerrar={cerrarModal}
      />

      <ModalNuevoMaterial
        visible={modal?.tipo === "nuevo_material"}
        materiales={materialesSinPresupuesto}
        guardando={guardando}
        onGuardar={handleGuardarMaterial}
        onCerrar={cerrarModal}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pickerWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
  },
  picker: {
    color: colors.textPrimary,
    height: 54,
  },
  scroll: { flex: 1 },
  scrollContenido: {
    padding: 16,
    paddingBottom: 40,
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  placeholder: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  seccionEncabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  botonAgregarSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  botonAgregarSmallTexto: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "600",
  },
  cardVacio: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 24,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 8,
  },
  cardVacioTexto: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
});
