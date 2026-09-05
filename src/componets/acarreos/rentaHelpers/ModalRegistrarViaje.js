/**
 * componets/acarreos/rentaHelpers/ModalRegistrarViaje.js
 *
 * Modal de pasos para registrar un viaje de renta (no pipa): categoría →
 * subcategoría (material concreto) → carga aproximada → confirmar. Cada paso
 * exige una selección antes de avanzar — no hay forma de saltar un paso.
 *
 * Un solo <Modal> con estado interno "paso" (Android no apila dos <Modal> de
 * forma confiable, ver componets/CLAUDE.md) — mismo patrón que
 * componets/vale/ModalEvidenciaViaje.js.
 *
 * Autocontenido: carga su propio catálogo (materialesRenta / categoriasMaterialRenta)
 * vía useCatalogos, así ValeDetalleRenta/SeccionCompletarVale no tienen que
 * enhebrar props de catálogo hasta aquí.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import { useCatalogos } from "../../../hooks/useCatalogos";
import { useBancosDescargaRenta } from "../../../hooks/useBancosDescargaRenta";
import SelectorCategoriaMaterial from "../../materiales/SelectorCategoriaMaterial";

const OPCIONES_CARGA = [
  { valor: 100, label: "100% de carga" },
  { valor: 75, label: "75% de carga" },
  { valor: 50, label: "50% de carga" },
];

const BANCO_MIN_CHARS = 3;

const TITULOS_PASO = {
  categoria: "¿Qué tipo de material se movió?",
  material: "¿Cuál material exactamente?",
  carga: "¿Con qué carga aproximada?",
  banco: "¿En qué banco se descarga?",
  confirmar: "Confirmar viaje",
};

const ModalRegistrarViaje = ({
  visible,
  onClose,
  numeroViaje,
  idObra = null,
  idCategoriaPlaneada = null,
  registrando = false,
  onConfirmar,
}) => {
  const { categoriasMaterialRenta, materialesRenta, loading } = useCatalogos([
    "categoriasMaterialRenta",
    "materialesRenta",
  ]);
  const { bancos: bancosUsados, recargarBancos } = useBancosDescargaRenta(idObra);

  const [paso, setPaso] = useState("categoria");
  const [idCategoria, setIdCategoria] = useState(null);
  const [idMaterial, setIdMaterial] = useState(null);
  const [carga, setCarga] = useState(null);
  const [banco, setBanco] = useState("");
  const [errorBanco, setErrorBanco] = useState("");

  // Remonta el estado cada vez que se abre — no debe arrastrar la seleccion
  // de la vez anterior.
  useEffect(() => {
    if (visible) {
      setPaso("categoria");
      setIdCategoria(null);
      setIdMaterial(null);
      setCarga(null);
      setBanco("");
      setErrorBanco("");
      // El viaje anterior pudo haber guardado un banco nuevo — refrescar la
      // lista de sugerencias en cada apertura, no solo al montar el modal.
      recargarBancos();
    }
  }, [visible, recargarBancos]);

  const materialesDeCategoria = (idCat) =>
    materialesRenta.filter((m) => m.id_categoria_material_renta === idCat);

  const handleSeleccionarCategoria = (idCat) => {
    setIdCategoria(idCat);
    const materiales = materialesDeCategoria(idCat);
    if (materiales.length <= 1) {
      // Caso "Basura": una sola subcategoría, se autoselecciona y se salta el paso.
      setIdMaterial(materiales[0]?.id_material ?? null);
      setPaso("carga");
    } else {
      setIdMaterial(null);
      setPaso("material");
    }
  };

  const handleSeleccionarMaterial = (idMat) => {
    setIdMaterial(idMat);
    setPaso("carga");
  };

  const handleSeleccionarCarga = (valor) => {
    setCarga(valor);
    setPaso("banco");
  };

  const handleChangeBanco = (texto) => {
    setBanco(texto.toUpperCase());
    if (errorBanco) setErrorBanco("");
  };

  const handleConfirmarBanco = () => {
    const bancoLimpio = banco.trim();
    if (!bancoLimpio) {
      setErrorBanco("El nombre del banco es obligatorio.");
      return;
    }
    if (bancoLimpio.length < BANCO_MIN_CHARS) {
      setErrorBanco(`Escribe al menos ${BANCO_MIN_CHARS} caracteres.`);
      return;
    }
    setBanco(bancoLimpio);
    setPaso("confirmar");
  };

  const handleSeleccionarBancoSugerido = (bancoSugerido) => {
    setBanco(bancoSugerido);
    setErrorBanco("");
    setPaso("confirmar");
  };

  // Sugerencias: bancos ya usados en esta obra que coinciden con lo escrito.
  // Se ocultan si ya coincide exacto (el usuario ya "eligio" ese) o si no hay texto.
  const sugerenciasBanco = banco.trim()
    ? bancosUsados
        .filter(
          (b) =>
            b.toUpperCase().includes(banco.trim().toUpperCase()) &&
            b.toUpperCase() !== banco.trim().toUpperCase(),
        )
        .slice(0, 5)
    : bancosUsados.slice(0, 5);

  const handleAtras = () => {
    if (paso === "material") {
      setPaso("categoria");
    } else if (paso === "carga") {
      const tieneVariasSubcategorias =
        materialesDeCategoria(idCategoria).length > 1;
      setPaso(tieneVariasSubcategorias ? "material" : "categoria");
    } else if (paso === "banco") {
      setPaso("carga");
    } else if (paso === "confirmar") {
      setPaso("banco");
    }
  };

  const categoriaSeleccionada = categoriasMaterialRenta.find(
    (c) => c.id_categoria_material_renta === idCategoria,
  );
  const materialSeleccionado = materialesRenta.find(
    (m) => m.id_material === idMaterial,
  );
  const cargaSeleccionada = OPCIONES_CARGA.find((o) => o.valor === carga);

  const handleConfirmar = () => {
    onConfirmar(idMaterial, carga, banco);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={estilos.overlay}>
        <View style={estilos.sheet}>
          <View style={estilos.header}>
            {paso !== "categoria" && (
              <TouchableOpacity
                onPress={handleAtras}
                disabled={registrando}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            )}
            <Text style={estilos.headerTitulo}>
              Viaje {numeroViaje} — {TITULOS_PASO[paso]}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={registrando}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={estilos.cuerpo}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginTop: 30 }}
              />
            ) : (
              <>
                {paso === "categoria" && (
                  <SelectorCategoriaMaterial
                    items={categoriasMaterialRenta.map((c) => ({
                      id: c.id_categoria_material_renta,
                      nombre: c.categoria,
                      descripcion: c.descripcion,
                    }))}
                    value={idCategoria}
                    onSelect={handleSeleccionarCategoria}
                    idDestacado={idCategoriaPlaneada}
                  />
                )}

                {paso === "material" && (
                  <SelectorCategoriaMaterial
                    items={materialesDeCategoria(idCategoria).map((m) => ({
                      id: m.id_material,
                      nombre: m.material,
                    }))}
                    value={idMaterial}
                    onSelect={handleSeleccionarMaterial}
                  />
                )}

                {paso === "carga" && (
                  <View style={estilos.cargaLista}>
                    {OPCIONES_CARGA.map((opcion) => {
                      const seleccionada = opcion.valor === carga;
                      return (
                        <TouchableOpacity
                          key={opcion.valor}
                          style={[
                            estilos.cargaBoton,
                            seleccionada && estilos.cargaBotonSeleccionado,
                          ]}
                          onPress={() => handleSeleccionarCarga(opcion.valor)}
                          activeOpacity={0.75}
                        >
                          <MaterialCommunityIcons
                            name="dump-truck"
                            size={22}
                            color={
                              seleccionada ? colors.surface : colors.secondary
                            }
                          />
                          <Text
                            style={[
                              estilos.cargaBotonTexto,
                              seleccionada && estilos.cargaBotonTextoSeleccionado,
                            ]}
                          >
                            {opcion.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {paso === "banco" && (
                  <View>
                    <Text style={estilos.bancoInstruccion}>
                      Escribe el nombre del banco donde se descargará el
                      material:
                    </Text>
                    <TextInput
                      style={[
                        estilos.bancoInput,
                        errorBanco ? estilos.bancoInputError : null,
                      ]}
                      value={banco}
                      onChangeText={handleChangeBanco}
                      placeholder="Ej. BANCO MUNICIPAL NORTE"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="characters"
                      autoFocus
                      maxLength={60}
                    />
                    {!!errorBanco && (
                      <Text style={estilos.bancoError}>{errorBanco}</Text>
                    )}

                    {sugerenciasBanco.length > 0 && (
                      <View style={estilos.sugerenciasContainer}>
                        <Text style={estilos.sugerenciasTitulo}>
                          Bancos ya usados en esta obra
                        </Text>
                        {sugerenciasBanco.map((bancoSugerido) => (
                          <TouchableOpacity
                            key={bancoSugerido}
                            style={estilos.sugerenciaItem}
                            onPress={() =>
                              handleSeleccionarBancoSugerido(bancoSugerido)
                            }
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons
                              name="map-marker-outline"
                              size={16}
                              color={colors.secondary}
                            />
                            <Text style={estilos.sugerenciaTexto}>
                              {bancoSugerido}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      style={estilos.botonRegistrar}
                      onPress={handleConfirmarBanco}
                      activeOpacity={0.8}
                    >
                      <Text style={estilos.botonRegistrarTexto}>
                        Siguiente
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {paso === "confirmar" && (
                  <View style={estilos.resumen}>
                    <View style={estilos.resumenFila}>
                      <Text style={estilos.resumenLabel}>Categoría</Text>
                      <Text style={estilos.resumenValor}>
                        {categoriaSeleccionada?.categoria || "—"}
                      </Text>
                    </View>
                    <View style={estilos.resumenFila}>
                      <Text style={estilos.resumenLabel}>Material</Text>
                      <Text style={estilos.resumenValor}>
                        {materialSeleccionado?.material || "—"}
                      </Text>
                    </View>
                    <View style={estilos.resumenFila}>
                      <Text style={estilos.resumenLabel}>Carga</Text>
                      <Text style={estilos.resumenValor}>
                        {cargaSeleccionada?.label || "—"}
                      </Text>
                    </View>
                    <View style={estilos.resumenFila}>
                      <Text style={estilos.resumenLabel}>Banco</Text>
                      <Text style={estilos.resumenValor}>{banco || "—"}</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        estilos.botonRegistrar,
                        registrando && estilos.botonDeshabilitado,
                      ]}
                      onPress={handleConfirmar}
                      disabled={registrando}
                      activeOpacity={0.8}
                    >
                      {registrando ? (
                        <ActivityIndicator size="small" color={colors.surface} />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={18}
                            color={colors.surface}
                          />
                          <Text style={estilos.botonRegistrarTexto}>
                            Registrar Viaje {numeroViaje}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ModalRegistrarViaje;

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitulo: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cuerpo: {
    padding: 18,
  },
  cargaLista: {
    gap: 10,
  },
  cargaBoton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  cargaBotonSeleccionado: {
    backgroundColor: colors.secondary,
  },
  cargaBotonTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.secondary,
  },
  cargaBotonTextoSeleccionado: {
    color: colors.surface,
  },
  bancoInstruccion: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 12,
    lineHeight: 20,
  },
  bancoInput: {
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    backgroundColor: colors.background,
    letterSpacing: 0.5,
  },
  bancoInputError: {
    borderColor: colors.danger,
  },
  bancoError: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 6,
  },
  sugerenciasContainer: {
    marginTop: 14,
    gap: 6,
  },
  sugerenciasTitulo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  sugerenciaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  sugerenciaTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  resumen: {
    gap: 4,
  },
  resumenFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resumenLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  resumenValor: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  botonRegistrar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 18,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonRegistrarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
});
