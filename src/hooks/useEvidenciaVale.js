// 1. React y hooks
import { useState, useCallback } from "react";

// 2. React Native
import { Alert } from "react-native";

// 3. Third party
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

// 4. Local - Config
import { supabase } from "../config/supabase";

// Radio por defecto si la obra no tiene uno configurado
const RADIO_DEFAULT_METROS = 500;

/**
 * Calcula la distancia en metros entre dos coordenadas GPS
 * usando la fórmula de Haversine
 */
const calcularDistanciaMetros = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radio de la Tierra en metros
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * useEvidenciaVale
 *
 * Hook para capturar evidencia al completar un vale de renta.
 * Maneja permisos, foto y geolocalización en un solo lugar.
 *
 * FUNCIONALIDAD:
 * - Solicita permisos de cámara y ubicación
 * - Captura foto con expo-image-picker
 * - Obtiene coordenadas GPS con expo-location
 * - Calcula distancia entre checador y obra
 * - Sube foto a Supabase Storage (bucket: evidencias-vales)
 * - Retorna URL pública de la foto y datos de ubicación
 *
 * USADO EN:
 * - EvidenciaCaptura (componente visual)
 * - ValeDetalleRenta (al completar el vale)
 */
const useEvidenciaVale = (obraData = null) => {
  const [foto, setFoto] = useState(null); // URI local de la foto
  const [fotoUrl, setFotoUrl] = useState(null); // URL en Supabase Storage
  const [ubicacion, setUbicacion] = useState(null); // { latitud, longitud }
  const [distanciaObra, setDistanciaObra] = useState(null); // metros
  const [loadingFoto, setLoadingFoto] = useState(false);
  const [loadingUbicacion, setLoadingUbicacion] = useState(false);
  const [errorFoto, setErrorFoto] = useState(null);
  const [errorUbicacion, setErrorUbicacion] = useState(null);

  // Determina si la obra tiene coordenadas configuradas
  const obraTieneCoordenadas =
    obraData?.latitud != null && obraData?.longitud != null;

  // Determina si el checador está dentro del radio permitido
  const dentroDelRadio = (() => {
    if (!obraTieneCoordenadas || distanciaObra === null) return null;
    const radio = obraData?.radio_validacion_metros ?? RADIO_DEFAULT_METROS;
    return distanciaObra <= radio;
  })();
  // Después de la constante dentroDelRadio existente
  const radioConfigurado =
    obraData?.radio_validacion_metros ?? RADIO_DEFAULT_METROS;

  // Evidencia lista cuando hay foto subida y ubicación capturada
  const evidenciaLista = fotoUrl !== null;
  /**
   * Solicita permisos de cámara al sistema operativo
   */
  const solicitarPermisoCamara = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Se necesita acceso a la cámara para tomar la foto de evidencia. Actívalo en Configuración.",
        [{ text: "Entendido" }],
      );
      return false;
    }
    return true;
  }, []);

  /**
   * Solicita permisos de ubicación al sistema operativo
   */
  const solicitarPermisoUbicacion = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Se necesita acceso a la ubicación para registrar dónde se completó el vale. Actívalo en Configuración.",
        [{ text: "Entendido" }],
      );
      return false;
    }
    return true;
  }, []);

  /**
   * Toma foto con la cámara y la sube a Supabase Storage
   * Se ejecuta en paralelo con la captura de GPS para ahorrar tiempo
   */
  const tomarFoto = useCallback(
    async (folioVale, carpeta = null) => {
      try {
        setErrorFoto(null);

        const tienePermiso = await solicitarPermisoCamara();

        if (!tienePermiso) return false;

        const tCamara = Date.now();
        const resultado = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.4,
          allowsEditing: false,
          exif: false,
          maxWidth: 1280,
          maxHeight: 960,
        });
        console.log(`[PERF][foto] launchCamera+compresion: ${Date.now() - tCamara}ms`);

        if (resultado.canceled) return false;

        const uri = resultado.assets[0].uri;

        setFoto(uri);
        setLoadingFoto(true);

        const url = await subirFotoStorage(uri, folioVale, carpeta);

        if (!url) {
          setLoadingFoto(false);
          return false;
        }

        setFotoUrl(url);
        setLoadingFoto(false);

        return true;
      } catch (error) {
        setErrorFoto("No se pudo tomar la foto. Intenta de nuevo.");
        setLoadingFoto(false);
        return false;
      }
    },
    [solicitarPermisoCamara],
  );

  /**
   * Obtiene la ubicación GPS actual del dispositivo
   */
  const capturarUbicacion = useCallback(async () => {
    try {
      setErrorUbicacion(null);
      setLoadingUbicacion(true);

      const tienePermiso = await solicitarPermisoUbicacion();

      if (!tienePermiso) {
        setLoadingUbicacion(false);
        return true; // No bloquea aunque no haya permiso
      }

      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 0,
      });

      const coords = {
        latitud: posicion.coords.latitude,
        longitud: posicion.coords.longitude,
      };

      setUbicacion(coords);

      if (obraTieneCoordenadas) {
        const distancia = calcularDistanciaMetros(
          coords.latitud,
          coords.longitud,
          parseFloat(obraData.latitud),
          parseFloat(obraData.longitud),
        );
        setDistanciaObra(distancia);
      }

      setLoadingUbicacion(false);
      return true;
    } catch (error) {
      // GPS falló — se registra el error pero NO bloquea completar el vale
      setErrorUbicacion(
        "No se pudo obtener la ubicación. Se completará solo con la foto.",
      );
      setLoadingUbicacion(false);
      return true; // Retorna true para no bloquear el flujo
    }
  }, [solicitarPermisoUbicacion, obraData, obraTieneCoordenadas]);
  /**
   * Sube la foto al bucket 'evidencias-vales' en Supabase Storage
   * Ruta: evidencias-vales/{folio}/{timestamp}.jpg
   *
   * Usa FileSystem.readAsStringAsync en lugar de fetch(uri).blob() porque
   * en iOS, fetch() sobre URIs de archivo local retorna blobs de 0 bytes.
   */
  const subirFotoStorage = async (uri, folioVale, carpeta = null) => {
    const FileSystem = require("expo-file-system/legacy");
    const t0 = Date.now();
    try {
      const timestamp = Date.now();
      const nombreArchivo = carpeta
        ? `${folioVale}/${carpeta}/${timestamp}.jpg`
        : `${folioVale}/${timestamp}.jpg`;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64 || base64.length === 0) {
        throw new Error("No se pudo leer el archivo de imagen");
      }

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log(
        `[PERF][foto] readFile+decode: ${Date.now() - t0}ms | size: ${bytes.length} bytes (~${Math.round(bytes.length / 1024)}KB)`,
      );

      const tUpload = Date.now();
      const { error } = await supabase.storage
        .from("evidencias-vales")
        .upload(nombreArchivo, bytes.buffer, {
          contentType: "image/jpeg",
          upsert: false,
        });
      console.log(`[PERF][foto] upload Storage: ${Date.now() - tUpload}ms`);
      console.log(`[PERF][foto] total subirFotoStorage: ${Date.now() - t0}ms`);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("evidencias-vales")
        .getPublicUrl(nombreArchivo);

      return urlData.publicUrl;
    } catch (error) {
      console.error("[useEvidenciaVale] Error en subirFotoStorage:", error);
      console.error("[useEvidenciaVale] Error message:", error?.message);
      console.error("[useEvidenciaVale] Error details:", JSON.stringify(error));
      Alert.alert("Error", "No se pudo guardar la foto. Intenta de nuevo.");
      return null;
    }
  };

  /**
   * Resetea todo el estado del hook
   * Útil al cerrar el modal o cancelar
   */
  const resetEvidencia = useCallback(() => {
    setFoto(null);
    setFotoUrl(null);
    setUbicacion(null);
    setDistanciaObra(null);
    setErrorFoto(null);
    setErrorUbicacion(null);
    setLoadingFoto(false);
    setLoadingUbicacion(false);
  }, []);

  return {
    // Estado
    foto,
    fotoUrl,
    ubicacion,
    distanciaObra,
    evidenciaLista,
    dentroDelRadio,
    obraTieneCoordenadas,
    radioConfigurado,

    // Loading
    loadingFoto,
    loadingUbicacion,

    // Errores
    errorFoto,
    errorUbicacion,

    // Acciones
    tomarFoto,
    capturarUbicacion,
    resetEvidencia,
  };
};

export default useEvidenciaVale;
