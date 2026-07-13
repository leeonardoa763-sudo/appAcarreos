/**
 * components/acarreos/rentaHelpers/SeccionCompletarVale.js
 *
 * Sección "Completar Vale" del detalle de renta.
 * Contiene el formulario completo para completar un vale en proceso:
 * - Formulario de datos pendientes (operador/vehículo)
 * - Registro de viajes
 * - Checkboxes de tipo de renta
 * - Selector de hora fin
 * - Notas adicionales
 * - Captura de evidencia
 * - Botón de completar
 *
 * PROPS:
 * - vale: object
 * - viajes: array
 * - loadingViajes: boolean
 * - registrando: boolean
 * - puedeRegistrar: boolean
 * - totalViajes: number
 * - onRegistrarViaje: function
 * - esRentaPorDia: boolean
 * - esRentaPorMedioDia: boolean
 * - onChangeRentaPorDia: function
 * - onChangeRentaPorMedioDia: function
 * - horaFin: Date | null
 * - onChangeHoraFin: function
 * - notasAdicionales: string
 * - onChangeNotas: function
 * - evidenciaProps: object — todas las props de EvidenciaCaptura
 * - mensajeBloqueo: string | null
 * - saving: boolean
 * - onCompletar: function
 */

import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../config/colors";
import { HIDE_ON_WEB } from "../../../config/features";
import { rentaStyles as styles } from "./rentaStyles";

import ViajesRentaSection from "../ViajesRentaSection";
import FormCheckbox from "../../forms/FormCheckbox";
import CustomTimePicker from "../../forms/CustomTimePicker";
import FormInput from "../../forms/FormInput";
import EvidenciaCaptura from "../../vale/EvidenciaCaptura";
import PrimaryButton from "../../common/PrimaryButton";

const SeccionCompletarVale = ({
  vale,
  viajes,
  loadingViajes,
  registrando,
  puedeRegistrar,
  totalViajes,
  onRegistrarViaje,
  esRentaPorDia,
  esRentaPorMedioDia,
  onChangeRentaPorDia,
  onChangeRentaPorMedioDia,
  horaFin,
  onChangeHoraFin,
  notasAdicionales,
  onChangeNotas,
  evidenciaProps,
  mensajeBloqueo,
  saving,
  onCompletar,
  totalTickets = 0,
  esResidente = false,
  esChecador = false,
  onEliminarUltimoViaje,
  eliminandoViaje = false,
  esMaterialDescarga = false,
}) => {
  const ticketsViajesDesbalanceados =
    totalTickets > 0 && totalViajes !== totalTickets;

  const botonDeshabilitado =
    saving ||
    !!mensajeBloqueo ||
    (!esRentaPorDia && !esRentaPorMedioDia && !horaFin) ||
    !evidenciaProps.evidenciaLista ||
    ticketsViajesDesbalanceados;

  const helperText = esRentaPorDia
    ? "Renta por día completo — mínimo 8 hrs desde inicio"
    : esRentaPorMedioDia
      ? "Renta por medio día — mínimo 4 hrs desde inicio"
      : "Hora de fin requerida para renta por hora";

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Completar Vale</Text>
      <Text style={styles.sectionSubtitle}>
        Captura los datos para completar el vale
      </Text>

      <ViajesRentaSection
        viajes={viajes}
        loading={loadingViajes}
        registrando={registrando}
        puedeRegistrar={puedeRegistrar}
        totalViajes={totalViajes}
        onRegistrarViaje={onRegistrarViaje}
        esResidente={esResidente}
        esChecador={esChecador}
        onEliminarUltimoViaje={onEliminarUltimoViaje}
        eliminandoViaje={eliminandoViaje}
        totalTickets={totalTickets}
        esMaterialDescarga={esMaterialDescarga}
      />

      {/* Completar vale — fuera de alcance en web */}
      {!HIDE_ON_WEB && (
        <>
          <FormCheckbox
            label="Renta por día completo"
            value={esRentaPorDia}
            onChange={onChangeRentaPorDia}
          />

          <FormCheckbox
            label="Renta por medio día"
            value={esRentaPorMedioDia}
            onChange={onChangeRentaPorMedioDia}
          />

          <CustomTimePicker
            label="Hora de Fin"
            value={horaFin}
            onChange={onChangeHoraFin}
            disabled={esRentaPorDia || esRentaPorMedioDia}
          />

          <FormInput
            label="Notas (opcional)"
            value={notasAdicionales}
            onChangeText={onChangeNotas}
            placeholder=""
            multiline
            maxLength={200}
          />

          <EvidenciaCaptura
            folioVale={vale?.folio}
            foto={evidenciaProps.foto}
            fotoUrl={evidenciaProps.fotoUrl}
            ubicacion={evidenciaProps.ubicacion}
            distanciaObra={evidenciaProps.distanciaObra}
            dentroDelRadio={evidenciaProps.dentroDelRadio}
            obraTieneCoordenadas={evidenciaProps.obraTieneCoordenadas}
            radioConfigurado={evidenciaProps.radioConfigurado}
            loadingFoto={evidenciaProps.loadingFoto}
            loadingUbicacion={evidenciaProps.loadingUbicacion}
            errorFoto={evidenciaProps.errorFoto}
            errorUbicacion={evidenciaProps.errorUbicacion}
            onTomarFoto={evidenciaProps.onTomarFoto}
            onCapturarUbicacion={evidenciaProps.onCapturarUbicacion}
          />

          {mensajeBloqueo && (
            <View style={styles.bloqueoContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.bloqueoText}>{mensajeBloqueo}</Text>
            </View>
          )}

          {ticketsViajesDesbalanceados && (
            <View style={styles.bloqueoContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={18}
                color={colors.danger}
              />
              <Text style={styles.bloqueoText}>
                {`Tickets y viajes no coinciden: ${totalTickets} ticket(s), ${totalViajes} viaje(s). Deben ser iguales para completar.`}
              </Text>
            </View>
          )}
          <PrimaryButton
            title="Completar Vale"
            onPress={onCompletar}
            loading={saving}
            disabled={botonDeshabilitado}
            icon="check-circle"
            backgroundColor={colors.accent}
          />

          <Text style={styles.helperText}>{helperText}</Text>
        </>
      )}
    </View>
  );
};

export default SeccionCompletarVale;
