/**
 * components/common/QRCodeGenerator.js
 *
 * Componente para generar códigos QR y convertirlos a base64
 *
 * PROPÓSITO:
 * - Generar código QR a partir de una URL
 * - Convertir QR a formato base64 para incrustar en PDF
 * - Componente invisible que solo genera datos
 *
 * USADO EN:
 * - ValeMaterialScreen
 * - ValeRentaScreen
 *
 * EJEMPLO DE USO:
 * <QRCodeGenerator
 *   value="https://verify.controldeacarreos.com/vale/CD-140-00001"
 *   onGenerated={(dataURL) => setQrDataUrl(dataURL)}
 *   size={200}
 * />
 */

import React, { useRef, useEffect } from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

const QRCodeGenerator = ({ value, onGenerated, size = 200 }) => {
  const qrRef = useRef(null);

  useEffect(() => {
    // Esperar a que el componente se monte y el QR se renderice
    const timer = setTimeout(() => {
      if (qrRef.current) {
        try {
          // Convertir QR a formato base64 (data URL)
          qrRef.current.toDataURL((dataURL) => {
            // Agregar el prefijo correcto si no lo tiene
            const fullDataURL = dataURL.startsWith("data:image")
              ? dataURL
              : `data:image/png;base64,${dataURL}`;

            // Llamar al callback con el QR en base64
            onGenerated(fullDataURL);
          });
        } catch (error) {
          console.error("Error generando QR:", error);
        }
      }
    }, 500); // Esperar 500ms para asegurar que el QR se renderice

    return () => clearTimeout(timer);
  }, [value, onGenerated]);

  return (
    // Componente invisible fuera de la pantalla
    // Solo existe para generar el QR y convertirlo a base64
    <View style={{ position: "absolute", left: -9999, top: -9999 }}>
      <QRCode
        value={value}
        size={size}
        getRef={(ref) => (qrRef.current = ref)}
      />
    </View>
  );
};

export default QRCodeGenerator;
