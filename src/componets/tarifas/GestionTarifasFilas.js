// src/componets/tarifas/GestionTarifasFilas.js
// Filas de la pantalla "Tarifas por obra" + caja de busqueda + selector de obra.
// UI pura: reciben ya resuelta la tarifa vigente y avisan por callbacks.
import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../config/colors";
import { estilosTarifas as estilos } from "./gestionTarifasStyles";

const fmt = (valor) =>
  valor === null || valor === undefined || valor === ""
    ? "Sin limite"
    : String(valor);

const fmtMoneda = (valor) =>
  valor === null || valor === undefined || valor === ""
    ? "-"
    : `$${parseFloat(valor).toFixed(2)}`;

export function CajaBusqueda({ valor, onCambiar, placeholder }) {
  return (
    <View style={estilos.searchRow}>
      <View style={estilos.searchBox}>
        <MaterialCommunityIcons
          name="magnify"
          size={19}
          color={colors.textSecondary}
        />
        <TextInput
          style={estilos.searchInput}
          value={valor}
          onChangeText={onCambiar}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          autoCorrect={false}
        />
        {!!valor && (
          <TouchableOpacity onPress={() => onCambiar("")}>
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function BadgeOrigen({ esTarifaDeObra }) {
  return (
    <View
      style={[
        estilos.badge,
        esTarifaDeObra ? estilos.badgeObra : estilos.badgeDefault,
      ]}
    >
      <Text
        style={[
          estilos.badgeTexto,
          esTarifaDeObra
            ? estilos.badgeTextoObra
            : estilos.badgeTextoDefault,
        ]}
      >
        {esTarifaDeObra ? "Tarifa de obra" : "Default del sindicato"}
      </Text>
    </View>
  );
}

function ValorChip({ etiqueta, valor }) {
  return (
    <View style={estilos.valorChip}>
      <Text style={estilos.valorChipEtiqueta}>{etiqueta}</Text>
      <Text style={estilos.valorChipValor}>{valor}</Text>
    </View>
  );
}

function Acciones({ esTarifaDeObra, onAsignar, onEditar, onQuitar }) {
  if (!esTarifaDeObra) {
    return (
      <View style={estilos.accionesRow}>
        <TouchableOpacity
          style={[estilos.btnAccion, estilos.btnAsignar]}
          onPress={onAsignar}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="plus"
            size={15}
            color={colors.surface}
          />
          <Text style={estilos.btnAsignarTexto}>Asignar tarifa a esta obra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={estilos.accionesRow}>
      <TouchableOpacity
        style={[estilos.btnAccion, estilos.btnEditar]}
        onPress={onEditar}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="pencil-outline"
          size={15}
          color={colors.secondary}
        />
        <Text style={estilos.btnEditarTexto}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[estilos.btnAccion, estilos.btnQuitar]}
        onPress={onQuitar}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="delete-outline"
          size={15}
          color={colors.danger}
        />
        <Text style={estilos.btnQuitarTexto}>Quitar</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Una combinacion tipo de material + sindicato.
 * `item.vigente` es la tarifa que se aplicaria hoy en esta obra; `item.esTarifaDeObra`
 * dice de cual de las dos tablas salio.
 */
export function FilaTarifaMaterial({ item, onAsignar, onEditar, onQuitar }) {
  const { vigente, esTarifaDeObra } = item;
  const dosIntervalos = parseFloat(vigente?.numero_de_intervalos) >= 2;

  return (
    <View
      style={[estilos.fila, esTarifaDeObra && estilos.filaConTarifaObra]}
    >
      <View style={estilos.filaEncabezado}>
        <View style={estilos.filaIcono}>
          <MaterialCommunityIcons
            name="dump-truck"
            size={21}
            color={esTarifaDeObra ? colors.primary : colors.textSecondary}
          />
        </View>
        <View style={estilos.filaTextos}>
          <Text style={estilos.filaNombre}>{item.tipoMaterialNombre}</Text>
          <Text style={estilos.filaSubtexto}>{item.sindicatoNombre}</Text>
        </View>
        <BadgeOrigen esTarifaDeObra={esTarifaDeObra} />
      </View>

      {vigente ? (
        <View style={estilos.valoresRejilla}>
          <ValorChip etiqueta="Primer km" valor={fmtMoneda(vigente.primer_km)} />
          <ValorChip
            etiqueta="Km sub. 1"
            valor={fmtMoneda(vigente.km_sub_int1)}
          />
          <ValorChip etiqueta="Limite 1" valor={fmt(vigente.limite_int1)} />
          {dosIntervalos && (
            <>
              <ValorChip
                etiqueta="Km sub. 2"
                valor={fmtMoneda(vigente.km_sub_int2)}
              />
              <ValorChip etiqueta="Limite 2" valor={fmt(vigente.limite_int2)} />
            </>
          )}
        </View>
      ) : (
        <View style={estilos.sinDefault}>
          <MaterialCommunityIcons
            name="alert-outline"
            size={15}
            color={colors.warning}
          />
          <Text style={estilos.sinDefaultTexto}>
            Sin tarifa por defecto del sindicato. Los vales de esta combinacion
            fallaran hasta que se capture una aqui o en Precios de Material.
          </Text>
        </View>
      )}

      <Acciones
        esTarifaDeObra={esTarifaDeObra}
        onAsignar={onAsignar}
        onEditar={onEditar}
        onQuitar={onQuitar}
      />
    </View>
  );
}

/** Un sindicato. Aplica igual a renta de equipo y a pipas de agua. */
export function FilaTarifaRenta({ item, onAsignar, onEditar, onQuitar }) {
  const { vigente, esTarifaDeObra } = item;

  return (
    <View
      style={[estilos.fila, esTarifaDeObra && estilos.filaConTarifaObra]}
    >
      <View style={estilos.filaEncabezado}>
        <View style={estilos.filaIcono}>
          <MaterialCommunityIcons
            name="excavator"
            size={21}
            color={esTarifaDeObra ? colors.primary : colors.textSecondary}
          />
        </View>
        <View style={estilos.filaTextos}>
          <Text style={estilos.filaNombre}>{item.sindicatoNombre}</Text>
          <Text style={estilos.filaSubtexto}>Renta de equipo y pipas</Text>
        </View>
        <BadgeOrigen esTarifaDeObra={esTarifaDeObra} />
      </View>

      {vigente ? (
        <View style={estilos.valoresRejilla}>
          <ValorChip
            etiqueta="Costo por hora"
            valor={fmtMoneda(vigente.costo_hr)}
          />
          <ValorChip
            etiqueta="Costo por dia"
            valor={fmtMoneda(vigente.costo_dia)}
          />
        </View>
      ) : (
        <View style={estilos.sinDefault}>
          <MaterialCommunityIcons
            name="alert-outline"
            size={15}
            color={colors.warning}
          />
          <Text style={estilos.sinDefaultTexto}>
            Sin tarifa por defecto del sindicato. Los vales de renta de este
            sindicato fallaran hasta que se capture una.
          </Text>
        </View>
      )}

      <Acciones
        esTarifaDeObra={esTarifaDeObra}
        onAsignar={onAsignar}
        onEditar={onEditar}
        onQuitar={onQuitar}
      />
    </View>
  );
}

/** Selector de obra. Modal simple: la lista de obras es corta. */
export function ModalSeleccionarObra({ visible, obras, obraId, onSelect, onCerrar }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <View style={estilos.overlay}>
        <View style={estilos.caja}>
          <View style={estilos.modalHeader}>
            <MaterialCommunityIcons
              name="office-building-marker-outline"
              size={21}
              color={colors.secondary}
            />
            <View style={estilos.modalHeaderTextos}>
              <Text style={estilos.modalTitulo}>Selecciona la obra</Text>
              <Text style={estilos.modalSubtitulo}>
                Las tarifas que configures aplican solo a esta obra
              </Text>
            </View>
            <TouchableOpacity onPress={onCerrar}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={estilos.modalCuerpo}>
            <View>
              {obras.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  style={[
                    estilos.opcionObra,
                    obraId === o.id && estilos.opcionObraActiva,
                  ]}
                  onPress={() => onSelect(o.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={
                      obraId === o.id
                        ? "radiobox-marked"
                        : "radiobox-blank"
                    }
                    size={20}
                    color={
                      obraId === o.id ? colors.secondary : colors.textSecondary
                    }
                  />
                  <View style={estilos.opcionObraTextos}>
                    <Text style={estilos.opcionObraNombre}>{o.nombre}</Text>
                    <Text style={estilos.opcionObraMeta}>
                      {[o.cc ? `CC ${o.cc}` : null, o.empresa]
                        .filter(Boolean)
                        .join("  ·  ") || `Obra ${o.id}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
