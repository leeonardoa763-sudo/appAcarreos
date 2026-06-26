// 1. React
import React, { useEffect, useState } from "react";

// 2. React Native
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local - Config
import { colors } from "../../config/colors";

// 5. Local - Hooks y servicios
import { useOperadoresSindicato } from "../../hooks/useOperadoresSindicato";
import {
  generarPDFOperadorIndividual,
  generarPDFOperadoresMasivo,
} from "../../services/pdfOperadoresGenerator";

// 6. Local - Componentes
import TarjetaOperador from "./TarjetaOperador";

/**
 * SeccionOperadoresSindicato
 *
 * Lista de operadores agrupados por sindicato con acciones de QR.
 * Solo visible para Residente en ValesScreen.
 *
 * FUNCIONALIDADES:
 * - Carga operadores al montar
 * - Comparte PDF QR individual por operador
 * - Exporta PDF masivo con todos los operadores
 * - Todos los grupos expandidos por defecto, colapsables al tocar
 */
const SeccionOperadoresSindicato = () => {
  const { grupos, loading, error, cargar } = useOperadoresSindicato();

  const [expandidos, setExpandidos] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [compartiendo, setCompartiendo] = useState(null);
  const [exportandoTodos, setExportandoTodos] = useState(false);
  const [exportandoSindicato, setExportandoSindicato] = useState(null);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const toggleGrupo = (id_sindicato) => {
    setExpandidos((prev) => ({
      ...prev,
      [id_sindicato]: !prev[id_sindicato],
    }));
  };

  const hayBusqueda = busqueda.trim().length > 0;

  const gruposFiltrados = hayBusqueda
    ? grupos
        .map((g) => ({
          ...g,
          operadores: g.operadores.filter((o) =>
            o.nombre_completo
              .toLowerCase()
              .includes(busqueda.toLowerCase().trim()),
          ),
        }))
        .filter((g) => g.operadores.length > 0)
    : grupos;

  const handleCompartirIndividual = async (operador) => {
    try {
      setCompartiendo(operador.id_operador);
      await generarPDFOperadorIndividual(operador);
    } catch (e) {
      Alert.alert("Error", "No se pudo generar el QR del operador.");
    } finally {
      setCompartiendo(null);
    }
  };

  const handleExportarTodos = async () => {
    const totalConQR = grupos.reduce(
      (acc, g) => acc + g.operadores.filter((o) => o.qr_uid).length,
      0,
    );

    if (totalConQR === 0) {
      Alert.alert("Sin datos", "Ningún operador tiene QR generado todavía.");
      return;
    }

    Alert.alert(
      "Exportar todos",
      `Se generará un PDF con los ${totalConQR} operadores que tienen QR. ¿Continuar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Exportar",
          onPress: async () => {
            try {
              setExportandoTodos(true);
              await generarPDFOperadoresMasivo(grupos);
            } catch (e) {
              Alert.alert("Error", "No se pudo generar el PDF masivo.");
            } finally {
              setExportandoTodos(false);
            }
          },
        },
      ],
    );
  };

  const handleExportarSindicato = async (grupo) => {
    const conQR = grupo.operadores.filter((o) => o.qr_uid);

    if (conQR.length === 0) {
      Alert.alert(
        "Sin datos",
        `${grupo.sindicato} no tiene operadores con QR.`,
      );
      return;
    }

    Alert.alert(
      "Exportar sindicato",
      `Se generará un PDF con ${conQR.length} operadores de ${grupo.sindicato}. ¿Continuar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Exportar",
          onPress: async () => {
            try {
              setExportandoSindicato(grupo.id_sindicato);
              await generarPDFOperadoresMasivo([grupo]);
            } catch (e) {
              Alert.alert("Error", "No se pudo generar el PDF.");
            } finally {
              setExportandoSindicato(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={colors.secondary} />
        <Text style={styles.cargandoTexto}>Cargando operadores...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centrado}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={32}
          color={colors.danger}
        />
        <Text style={styles.errorTexto}>{error}</Text>
        <TouchableOpacity style={styles.botonReintentar} onPress={cargar}>
          <Text style={styles.botonReintentarTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (grupos.length === 0) {
    return (
      <View style={styles.centrado}>
        <MaterialCommunityIcons
          name="account-off-outline"
          size={32}
          color={colors.textSecondary}
        />
        <Text style={styles.vacioTexto}>No hay operadores registrados.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header de sección */}
      <View style={styles.header}>
        <View style={styles.headerTitulo}>
          <MaterialCommunityIcons
            name="account-group"
            size={20}
            color={colors.secondary}
          />
          <Text style={styles.titulo}>Operadores por Sindicato</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.botonExportar,
            exportandoTodos && styles.botonExportarDeshabilitado,
          ]}
          onPress={handleExportarTodos}
          disabled={exportandoTodos}
          activeOpacity={0.8}
        >
          {exportandoTodos ? (
            <ActivityIndicator size={14} color={colors.surface} />
          ) : (
            <MaterialCommunityIcons
              name="file-export"
              size={14}
              color={colors.surface}
            />
          )}
          <Text style={styles.botonExportarTexto}>
            {exportandoTodos ? "Generando..." : "Exportar todos"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.buscadorContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={18}
          color={colors.textSecondary}
          style={styles.buscadorIcono}
        />
        <TextInput
          style={styles.buscadorInput}
          placeholder="Buscar operador..."
          placeholderTextColor={colors.textSecondary}
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="words"
          returnKeyType="search"
        />
        {hayBusqueda && (
          <TouchableOpacity onPress={() => setBusqueda("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Grupos por sindicato */}
      {gruposFiltrados.map((grupo) => {
        const estaExpandido = hayBusqueda ? true : expandidos[grupo.id_sindicato] === true;

        return (
          <View key={grupo.id_sindicato} style={styles.grupo}>
            <TouchableOpacity
              style={styles.grupoHeader}
              onPress={() => toggleGrupo(grupo.id_sindicato)}
              activeOpacity={0.7}
            >
              <View style={styles.grupoHeaderIzq}>
                <MaterialCommunityIcons
                  name="shield-account"
                  size={16}
                  color={colors.secondary}
                />
                <Text style={styles.grupoNombre}>{grupo.sindicato}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeTexto}>
                    {grupo.operadores.length}
                  </Text>
                </View>
              </View>

              <View style={styles.grupoHeaderDer}>
                <TouchableOpacity
                  style={[
                    styles.botonExportarSindicato,
                    exportandoSindicato === grupo.id_sindicato &&
                      styles.botonExportarDeshabilitado,
                  ]}
                  onPress={() => handleExportarSindicato(grupo)}
                  disabled={exportandoSindicato === grupo.id_sindicato}
                  activeOpacity={0.8}
                >
                  {exportandoSindicato === grupo.id_sindicato ? (
                    <ActivityIndicator size={12} color={colors.surface} />
                  ) : (
                    <MaterialCommunityIcons
                      name="file-export"
                      size={13}
                      color={colors.surface}
                    />
                  )}
                </TouchableOpacity>

                <MaterialCommunityIcons
                  name={estaExpandido ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>

            {estaExpandido && (
              <View style={styles.listaOperadores}>
                {grupo.operadores.map((operador) => (
                  <TarjetaOperador
                    key={operador.id_operador}
                    operador={operador}
                    onCompartirQR={handleCompartirIndividual}
                    compartiendo={compartiendo === operador.id_operador}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default SeccionOperadoresSindicato;

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  centrado: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  cargandoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  errorTexto: {
    fontSize: 13,
    color: colors.danger,
    textAlign: "center",
  },
  vacioTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  botonReintentar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    marginTop: 4,
  },
  botonReintentarTexto: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: 13,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitulo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  titulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  botonExportar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  botonExportarDeshabilitado: {
    backgroundColor: colors.disabled,
  },
  botonExportarTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.surface,
  },
  buscadorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    marginBottom: 12,
    height: 38,
  },
  buscadorIcono: {
    marginRight: 6,
  },
  buscadorInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  grupo: {
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  grupoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#F0F4FA",
  },
  grupoHeaderIzq: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  grupoHeaderDer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  botonExportarSindicato: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  grupoNombre: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.secondary,
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  badgeTexto: {
    fontSize: 11,
    color: colors.surface,
    fontWeight: "700",
  },
  listaOperadores: {
    padding: 10,
  },
});
