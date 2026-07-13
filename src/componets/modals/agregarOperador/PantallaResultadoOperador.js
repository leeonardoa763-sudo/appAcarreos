import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { colors } from "../../../config/colors";
import QRCodeGenerator from "../../common/QRCodeGenerator";

const generarHtmlTarjeta = (vehiculo, operador, qrDataUrl) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          background: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 24px;
        }
        .card {
          width: 100%;
          max-width: 320px;
          border: 2px solid #004E89;
          border-radius: 16px;
          overflow: hidden;
          margin: 0 auto;
        }
        .header {
          background-color: #004E89;
          padding: 16px 20px;
          text-align: center;
        }
        .header-titulo {
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .header-subtitulo { color: rgba(255,255,255,0.75); font-size: 11px; }
        .body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .qr-wrapper {
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 14px;
          background: #F5F6FA;
        }
        .qr-wrapper img { display: block; width: 160px; height: 160px; }
        .info {
          width: 100%;
          border-top: 1px solid #E5E7EB;
          padding-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fila { display: flex; flex-direction: column; gap: 2px; }
        .fila-label {
          font-size: 10px;
          color: #7F8C8D;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .fila-valor { font-size: 15px; font-weight: 700; color: #2C3E50; }
        .fila-valor-placas {
          font-size: 22px;
          font-weight: 800;
          color: #004E89;
          letter-spacing: 2px;
        }
        .footer {
          background: #F5F6FA;
          padding: 10px 20px;
          text-align: center;
          border-top: 1px solid #E5E7EB;
        }
        .footer-texto { font-size: 10px; color: #7F8C8D; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="header-titulo">Control de Acarreos</div>
          <div class="header-subtitulo">Identificación de Vehículo</div>
        </div>
        <div class="body">
          <div class="qr-wrapper">
            <img src="${qrDataUrl}" />
          </div>
          <div class="info">
            <div class="fila">
              <span class="fila-label">Placas</span>
              <span class="fila-valor-placas">${vehiculo.placas}</span>
            </div>
            ${
              operador?.nombre_completo
                ? `<div class="fila">
                     <span class="fila-label">Operador</span>
                     <span class="fila-valor">${operador.nombre_completo}</span>
                   </div>`
                : ""
            }
            ${
              vehiculo.capacidad_m3
                ? `<div class="fila">
                     <span class="fila-label">Capacidad</span>
                     <span class="fila-valor">${vehiculo.capacidad_m3} m³</span>
                   </div>`
                : ""
            }
          </div>
        </div>
        <div class="footer">
          <span class="footer-texto">Escanea el QR para asignar este vehículo a un vale</span>
        </div>
      </div>
    </body>
  </html>
`;

const PantallaResultadoOperador = ({ operador, vehiculo, mensaje, onCerrar }) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const tieneVehiculo = !!vehiculo?.qr_uid;

  const handleExportarPDF = async () => {
    if (!qrDataUrl) {
      Alert.alert("Espera", "El código QR aún se está generando.");
      return;
    }
    try {
      setGenerandoPDF(true);
      const html = generarHtmlTarjeta(vehiculo, operador, qrDataUrl);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const puedeCompartir = await Sharing.isAvailableAsync();
      if (!puedeCompartir) {
        Alert.alert("Error", "La función de compartir no está disponible.");
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `QR Vehículo ${vehiculo.placas}`,
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("[PantallaResultadoOperador] Error generando PDF:", error);
      Alert.alert("Error", "No se pudo generar el PDF. Intenta de nuevo.");
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {tieneVehiculo && (
        <QRCodeGenerator
          value={vehiculo.qr_uid}
          onGenerated={(dataUrl) => setQrDataUrl(dataUrl)}
          size={200}
        />
      )}

      <View style={styles.banner}>
        <MaterialCommunityIcons name="check-circle" size={36} color={colors.accent} />
        <Text style={styles.bannerTitulo}>Registro exitoso</Text>
        <Text style={styles.bannerMensaje}>{mensaje}</Text>
      </View>

      {tieneVehiculo && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="dump-truck" size={20} color={colors.surface} />
            <Text style={styles.cardHeaderTexto}>Identificación del vehículo</Text>
          </View>

          <View style={styles.qrContainer}>
            {qrDataUrl ? (
              <Image source={{ uri: qrDataUrl }} style={styles.qrImagen} />
            ) : (
              <View style={styles.qrCargando}>
                <ActivityIndicator size="small" color={colors.secondary} />
                <Text style={styles.qrCargandoTexto}>Generando QR...</Text>
              </View>
            )}
          </View>

          <View style={styles.datosContainer}>
            <View style={styles.datoFila}>
              <Text style={styles.datoLabel}>PLACAS</Text>
              <Text style={styles.datoValorPlacas}>{vehiculo.placas}</Text>
            </View>
            {operador?.nombre_completo && (
              <>
                <View style={styles.separador} />
                <View style={styles.datoFila}>
                  <Text style={styles.datoLabel}>OPERADOR</Text>
                  <Text style={styles.datoValor}>{operador.nombre_completo}</Text>
                </View>
              </>
            )}
            {vehiculo.capacidad_m3 && (
              <>
                <View style={styles.separador} />
                <View style={styles.datoFila}>
                  <Text style={styles.datoLabel}>CAPACIDAD</Text>
                  <Text style={styles.datoValor}>{vehiculo.capacidad_m3} m³</Text>
                </View>
              </>
            )}
          </View>

          <Text style={styles.qrHint}>
            Pega este QR en el vehículo para asignarlo rápidamente a un vale
          </Text>
        </View>
      )}

      <View style={styles.botones}>
        {tieneVehiculo && (
          <TouchableOpacity
            style={[styles.btnPDF, (!qrDataUrl || generandoPDF) && styles.btnDisabled]}
            onPress={handleExportarPDF}
            disabled={!qrDataUrl || generandoPDF}
            activeOpacity={0.8}
          >
            {generandoPDF ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <MaterialCommunityIcons name="file-pdf-box" size={22} color={colors.surface} />
            )}
            <Text style={styles.btnPDFTexto}>
              {generandoPDF ? "Generando..." : "Exportar QR en PDF"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btnListo} onPress={onCerrar} activeOpacity={0.8}>
          <MaterialCommunityIcons name="check" size={20} color={colors.secondary} />
          <Text style={styles.btnListoTexto}>Listo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  banner: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  bannerTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
  },
  bannerMensaje: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: {
    backgroundColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardHeaderTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.surface,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  qrContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: colors.background,
  },
  qrImagen: {
    width: 160,
    height: 160,
    borderRadius: 8,
  },
  qrCargando: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  qrCargandoTexto: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  datosContainer: {
    padding: 16,
    gap: 10,
  },
  datoFila: {
    gap: 2,
  },
  datoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  datoValor: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  datoValorPlacas: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.secondary,
    letterSpacing: 2,
  },
  separador: {
    height: 1,
    backgroundColor: colors.background,
  },
  qrHint: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    lineHeight: 16,
  },
  botones: {
    gap: 10,
  },
  btnPDF: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  btnDisabled: {
    backgroundColor: colors.disabled,
    elevation: 0,
  },
  btnPDFTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface,
  },
  btnListo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  btnListoTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.secondary,
  },
});

export default PantallaResultadoOperador;
