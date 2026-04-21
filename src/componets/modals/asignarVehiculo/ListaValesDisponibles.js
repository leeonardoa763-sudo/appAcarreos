import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import styles from "./asignarStyles";

// ─── Constantes de grupos ─────────────────────────────────────────────────────

const GRUPOS = [
  {
    key: "material",
    titulo: "Carga de Material",
    icono: "package-variant",
    color: colors.primary,
    filtro: (vale) => vale.tipo_vale === "material",
  },
  {
    key: "renta",
    titulo: "Renta de Equipo",
    icono: "truck-cargo-container",
    color: colors.secondary,
    filtro: (vale) => vale.tipo_vale === "renta",
  },
];

// ─── Helpers de datos ─────────────────────────────────────────────────────────

const getMaterialNombre = (vale) => {
  if (vale.tipo_vale === "material") {
    return vale.vale_material_detalles?.[0]?.material?.material ?? null;
  }
  if (vale.tipo_vale === "renta") {
    return vale.vale_renta_detalle?.[0]?.material?.material ?? null;
  }
  return null;
};

const getBanco = (vale) =>
  vale.tipo_vale === "material"
    ? vale.vale_material_detalles?.[0]?.banco?.banco ?? null
    : null;

const getEmpresa = (vale) => vale.empresas?.empresa ?? null;

const sortByMaterial = (a, b) => {
  const matA = getMaterialNombre(a) ?? "";
  const matB = getMaterialNombre(b) ?? "";
  return matA.localeCompare(matB, "es");
};

// ─── Modal de confirmación ────────────────────────────────────────────────────

const ModalConfirmacion = ({ vale, onConfirmar, onCancelar }) => {
  if (!vale) return null;

  const esMaterial = vale.tipo_vale === "material";
  const materialNombre = getMaterialNombre(vale);
  const banco = getBanco(vale);
  const empresa = getEmpresa(vale);
  const obra = vale.obras
    ? `${vale.obras.cc ? vale.obras.cc + " - " : ""}${vale.obras.obra}`
    : "Sin obra";

  const tipoTexto = esMaterial ? "Material" : "Renta de Equipo";
  const tipoColor = esMaterial ? colors.primary : colors.secondary;
  const tipoIcono = esMaterial ? "package-variant" : "truck-cargo-container";

  return (
    <Modal
      visible={!!vale}
      animationType="fade"
      transparent
      onRequestClose={onCancelar}
    >
      <View style={confirmStyles.overlay}>
        <View style={confirmStyles.container}>
          {/* Ícono */}
          <View
            style={[
              confirmStyles.iconWrapper,
              { backgroundColor: `${tipoColor}15` },
            ]}
          >
            <MaterialCommunityIcons
              name="truck-check"
              size={36}
              color={tipoColor}
            />
          </View>

          {/* Título */}
          <Text style={confirmStyles.titulo}>Confirmar asignación</Text>
          <Text style={confirmStyles.subtitulo}>
            ¿Deseas asignar este vehículo al siguiente vale?
          </Text>

          {/* Datos del vale */}
          <View style={confirmStyles.card}>
            {/* Folio */}
            <View style={confirmStyles.fila}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={confirmStyles.filaLabel}>Folio</Text>
              <Text style={confirmStyles.filaValor}>{vale.folio}</Text>
            </View>

            <View style={confirmStyles.separador} />

            {/* Tipo */}
            <View style={confirmStyles.fila}>
              <MaterialCommunityIcons
                name={tipoIcono}
                size={16}
                color={tipoColor}
              />
              <Text style={confirmStyles.filaLabel}>Tipo</Text>
              <View
                style={[
                  confirmStyles.tipoBadge,
                  { backgroundColor: `${tipoColor}15` },
                ]}
              >
                <Text
                  style={[confirmStyles.tipoBadgeTexto, { color: tipoColor }]}
                >
                  {tipoTexto}
                </Text>
              </View>
            </View>

            {/* Material */}
            {materialNombre && (
              <>
                <View style={confirmStyles.separador} />
                <View style={confirmStyles.fila}>
                  <MaterialCommunityIcons
                    name="cube-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={confirmStyles.filaLabel}>Material</Text>
                  <Text style={confirmStyles.filaValor}>{materialNombre}</Text>
                </View>
              </>
            )}

            {/* Banco */}
            {banco && (
              <>
                <View style={confirmStyles.separador} />
                <View style={confirmStyles.fila}>
                  <MaterialCommunityIcons
                    name="bank-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={confirmStyles.filaLabel}>Banco</Text>
                  <Text style={confirmStyles.filaValor}>{banco}</Text>
                </View>
              </>
            )}

            <View style={confirmStyles.separador} />

            {/* Obra */}
            <View style={confirmStyles.fila}>
              <MaterialCommunityIcons
                name="office-building-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={confirmStyles.filaLabel}>Obra</Text>
              <Text style={confirmStyles.filaValor} numberOfLines={1}>
                {obra}
              </Text>
            </View>

            {/* Empresa */}
            {empresa && (
              <>
                <View style={confirmStyles.separador} />
                <View style={confirmStyles.fila}>
                  <MaterialCommunityIcons
                    name="domain"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={confirmStyles.filaLabel}>Empresa</Text>
                  <Text style={confirmStyles.filaValor} numberOfLines={1}>
                    {empresa}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Botones */}
          <View style={confirmStyles.botones}>
            <TouchableOpacity
              style={confirmStyles.btnCancelar}
              onPress={onCancelar}
              activeOpacity={0.7}
            >
              <Text style={confirmStyles.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                confirmStyles.btnConfirmar,
                { backgroundColor: tipoColor },
              ]}
              onPress={onConfirmar}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="check"
                size={18}
                color={colors.surface}
              />
              <Text style={confirmStyles.btnConfirmarTexto}>Asignar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const confirmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
    gap: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  iconWrapper: {
    borderRadius: 50,
    padding: 16,
    marginBottom: 4,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filaLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    width: 56,
  },
  filaValor: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  tipoBadge: {
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  tipoBadgeTexto: {
    fontSize: 12,
    fontWeight: "700",
  },
  separador: {
    height: 1,
    backgroundColor: colors.border,
  },
  botones: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 4,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btnCancelarTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  btnConfirmar: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnConfirmarTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface,
  },
});

// ─── Item de vale ─────────────────────────────────────────────────────────────

const ItemVale = ({ vale, asignando, onSeleccionar }) => {
  const esMaterial = vale.tipo_vale === "material";
  const materialNombre = getMaterialNombre(vale);
  const banco = getBanco(vale);
  const empresa = getEmpresa(vale);
  const obra = vale.obras
    ? `${vale.obras.cc ? vale.obras.cc + " - " : ""}${vale.obras.obra}`
    : "Sin obra";

  return (
    <TouchableOpacity
      style={styles.itemVale}
      onPress={() => onSeleccionar(vale)}
      disabled={asignando}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.itemValeTipoBar,
          esMaterial ? styles.barMaterial : styles.barRenta,
        ]}
      />
      <View style={styles.itemValeBody}>
        <View style={styles.itemValeTop}>
          <MaterialCommunityIcons
            name={esMaterial ? "package-variant" : "truck-cargo-container"}
            size={20}
            color={esMaterial ? colors.primary : colors.secondary}
          />
          <Text style={styles.itemValeFolio}>{vale.folio}</Text>
          <View
            style={[
              styles.itemValeTipoBadge,
              esMaterial ? styles.badgeMaterial : styles.badgeRenta,
            ]}
          >
            <Text style={styles.itemValeTipoTexto}>
              {esMaterial ? "Material" : "Renta"}
            </Text>
          </View>
        </View>
        {materialNombre && (
          <Text style={styles.itemValeMaterial} numberOfLines={1}>
            {banco ? `${materialNombre} · ${banco}` : materialNombre}
          </Text>
        )}
        <Text style={styles.itemValeObra} numberOfLines={1}>
          {obra}
        </Text>
        {empresa && (
          <Text style={styles.itemValeEmpresa} numberOfLines={1}>
            {empresa}
          </Text>
        )}
      </View>
      {asignando ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
};

// ─── Lista principal ──────────────────────────────────────────────────────────

const ListaValesDisponibles = ({ vales, asignando, onSeleccionar }) => {
  const [valeParaConfirmar, setValeParaConfirmar] = useState(null);

  const handleSeleccionar = (vale) => {
    setValeParaConfirmar(vale);
  };

  const handleConfirmar = () => {
    if (!valeParaConfirmar) return;
    onSeleccionar(valeParaConfirmar.id_vale, valeParaConfirmar.folio);
    setValeParaConfirmar(null);
  };

  const handleCancelar = () => {
    setValeParaConfirmar(null);
  };

  if (vales.length === 0) {
    return (
      <View style={styles.sinValesContainer}>
        <MaterialCommunityIcons
          name="clipboard-off-outline"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.sinValesTexto}>
          No hay vales en proceso disponibles para este sindicato.
        </Text>
      </View>
    );
  }

  const gruposConVales = GRUPOS.map((grupo) => ({
    ...grupo,
    vales: vales.filter(grupo.filtro).sort(sortByMaterial),
  })).filter((grupo) => grupo.vales.length > 0);

  return (
    <>
      <ModalConfirmacion
        vale={valeParaConfirmar}
        onConfirmar={handleConfirmar}
        onCancelar={handleCancelar}
      />

      <View style={styles.listaContainer}>
        <Text style={styles.listaTitulo}>Selecciona un vale para asignar</Text>
        {gruposConVales.map((grupo) => (
          <View key={grupo.key} style={styles.grupoContainer}>
            <View
              style={[styles.grupoHeader, { borderLeftColor: grupo.color }]}
            >
              <MaterialCommunityIcons
                name={grupo.icono}
                size={16}
                color={grupo.color}
              />
              <Text style={[styles.grupoTitulo, { color: grupo.color }]}>
                {grupo.titulo}
              </Text>
              <View
                style={[
                  styles.grupoBadge,
                  { backgroundColor: `${grupo.color}15` },
                ]}
              >
                <Text style={[styles.grupoBadgeTexto, { color: grupo.color }]}>
                  {grupo.vales.length}
                </Text>
              </View>
            </View>
            {grupo.vales.map((vale) => (
              <ItemVale
                key={vale.id_vale}
                vale={vale}
                asignando={asignando}
                onSeleccionar={handleSeleccionar}
              />
            ))}
          </View>
        ))}
      </View>
    </>
  );
};

export default ListaValesDisponibles;
