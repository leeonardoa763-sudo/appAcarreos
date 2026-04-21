/**
 * components/common/QRCodeGenerator.js
 *
 * VERSIÓN CORREGIDA - EVITA LLAMADAS MÚLTIPLES
 *
 * Componente para generar códigos QR y convertirlos a base64
 *
 * MEJORAS:
 * - Flag para prevenir generación múltiple
 * - Solo llama a onGenerated UNA vez
 * - Mejor manejo de timeout
 * - Limpieza adecuada de refs
 */

import React, { useRef, useEffect } from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

const QRCodeGenerator = ({
  value,
  onGenerated,
  onError,
  size = 200,
  timeout = 500,
}) => {
  const qrRef = useRef(null);
  const hasGenerated = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Validar value
    if (!value) {
      console.error("[QRCodeGenerator] Value vacío o indefinido");
      if (onError) {
        onError(new Error("Value vacío o indefinido"));
      }
      return;
    }

    // Si ya se generó, no volver a generar
    if (hasGenerated.current) {
      return;
    }


    // Esperar a que el componente se monte y el QR se renderice
    timeoutRef.current = setTimeout(() => {
      // Doble verificación
      if (hasGenerated.current) {
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
        // Convertir QR a formato base64 (data URL)
        qrRef.current.toDataURL((dataURL) => {
          // Triple verificación antes de llamar callback
          if (hasGenerated.current) {
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

          // Marcar como generado ANTES de llamar al callback
          hasGenerated.current = true;


          // Llamar al callback con el QR en base64
          if (onGenerated) {
            onGenerated(fullDataURL);
          }
        });
      } catch (error) {
        console.error("[QRCodeGenerator] Error generando QR:", error);
        if (onError) {
          onError(error);
        }
      }
    }, timeout);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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
        }}
      />
    </View>
  );
};

export default QRCodeGenerator;
