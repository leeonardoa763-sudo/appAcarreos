/**
 * components/common/QRCodeGenerator.js (CORREGIDO)
 *
 * Componente para generar códigos QR y convertirlos a base64
 *
 * MEJORAS:
 * - Manejo de errores con callback onError
 * - Validación de value antes de generar
 * - Logs más descriptivos
 * - Timeout configurable
 *
 * PROPÓSITO:
 * - Generar código QR a partir de una URL
 * - Convertir QR a formato base64 para incrustar en PDF
 * - Componente invisible que solo genera datos
 *
 * USADO EN:
 * - ValeMaterialScreen
 * - ValeRentaScreen
 * - GenerarPDFButton
 */

import React, { useRef, useEffect } from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

const QRCodeGenerator = ({
  value,
  onGenerated,
  onError,
  size = 200,
  timeout = 1000,
}) => {
  const qrRef = useRef(null);
  const hasGenerated = useRef(false);

  useEffect(() => {
    // Resetear flag cuando value cambia
    hasGenerated.current = false;

    // Validar value
    if (!value) {
      console.error("[QRCodeGenerator] Value vacío o indefinido");
      if (onError) {
        onError(new Error("Value vacío o indefinido"));
      }
      return;
    }

    console.log("[QRCodeGenerator] Iniciando generación de QR para:", value);

    // Esperar a que el componente se monte y el QR se renderice
    const timer = setTimeout(() => {
      if (hasGenerated.current) {
        console.log("[QRCodeGenerator] Ya generado, abortando");
        return;
      }

      if (!qrRef.current) {
        console.error("[QRCodeGenerator] qrRef.current es null");
        if (onError) {
          onError(new Error("QR ref no disponible"));
        }
        return;
      }

      try {
        console.log("[QRCodeGenerator] Convirtiendo QR a base64...");

        // Convertir QR a formato base64 (data URL)
        qrRef.current.toDataURL((dataURL) => {
          if (hasGenerated.current) {
            console.log("[QRCodeGenerator] Callback duplicado, ignorando");
            return;
          }

          if (!dataURL) {
            console.error("[QRCodeGenerator] dataURL vacío");
            if (onError) {
              onError(new Error("dataURL vacío después de conversión"));
            }
            return;
          }

          // Agregar el prefijo correcto si no lo tiene
          const fullDataURL = dataURL.startsWith("data:image")
            ? dataURL
            : `data:image/png;base64,${dataURL}`;

          console.log("[QRCodeGenerator] QR generado exitosamente");

          hasGenerated.current = true;

          // Llamar al callback con el QR en base64
          if (onGenerated) {
            onGenerated(fullDataURL);
          }
        });
      } catch (error) {
        console.error("[QRCodeGenerator] Error en try-catch:", error);
        if (onError) {
          onError(error);
        }
      }
    }, timeout);

    return () => {
      clearTimeout(timer);
    };
  }, [value, onGenerated, onError, timeout]);

  return (
    // Componente invisible fuera de la pantalla
    <View style={{ position: "absolute", left: -9999, top: -9999 }}>
      <QRCode
        value={value || ""}
        size={size}
        getRef={(ref) => {
          qrRef.current = ref;
          console.log("[QRCodeGenerator] Ref asignada:", !!ref);
        }}
      />
    </View>
  );
};

export default QRCodeGenerator;
