// 1. React
import React, { useState, useEffect, useRef } from "react";

// 2. React Native
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Clipboard,
  Alert,
} from "react-native";

// 3. Third party
import { MaterialCommunityIcons } from "@expo/vector-icons";

// 4. Local
import { colors } from "../../config/colors";

// Almacén global de logs
const logStore = [];
const listeners = [];

// Reemplaza console.log/error/warn globalmente
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

export const initDebugLogger = () => {
  console.log = (...args) => {
    const msg = args
      .map((a) =>
        typeof a === "object" ? JSON.stringify(a, null, 2) : String(a),
      )
      .join(" ");
    const entry = {
      tipo: "LOG",
      msg,
      hora: new Date().toLocaleTimeString("es-MX"),
    };
    logStore.push(entry);
    listeners.forEach((fn) => fn([...logStore]));
    originalLog(...args);
  };

  console.error = (...args) => {
    const msg = args
      .map((a) =>
        typeof a === "object" ? JSON.stringify(a, null, 2) : String(a),
      )
      .join(" ");
    const entry = {
      tipo: "ERROR",
      msg,
      hora: new Date().toLocaleTimeString("es-MX"),
    };
    logStore.push(entry);
    listeners.forEach((fn) => fn([...logStore]));
    originalError(...args);
  };

  console.warn = (...args) => {
    const msg = args
      .map((a) =>
        typeof a === "object" ? JSON.stringify(a, null, 2) : String(a),
      )
      .join(" ");
    const entry = {
      tipo: "WARN",
      msg,
      hora: new Date().toLocaleTimeString("es-MX"),
    };
    logStore.push(entry);
    listeners.forEach((fn) => fn([...logStore]));
    originalWarn(...args);
  };
};

export const addDebugLog = (msg, tipo = "LOG") => {
  const entry = { tipo, msg, hora: new Date().toLocaleTimeString("es-MX") };
  logStore.push(entry);
  listeners.forEach((fn) => fn([...logStore]));
};

export const clearDebugLogs = () => {
  logStore.length = 0;
  listeners.forEach((fn) => fn([]));
};

// Componente visual
const DebugLogger = () => {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState([...logStore]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handler = (newLogs) => {
      setLogs(newLogs);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const handleCopiar = () => {
    const texto = logs.map((l) => `[${l.hora}] ${l.tipo}: ${l.msg}`).join("\n");
    Clipboard.setString(texto);
    Alert.alert("Copiado", "Logs copiados al portapapeles");
  };

  const colorPorTipo = (tipo) => {
    if (tipo === "ERROR") return "#FF4444";
    if (tipo === "WARN") return "#FFA500";
    return "#00CC88";
  };

  return (
    <>
      {/* Botón flotante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="bug" size={24} color="#FFFFFF" />
        {logs.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{logs.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal de logs */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.titulo}>Debug Logs</Text>
              <View style={styles.headerBotones}>
                <TouchableOpacity
                  onPress={handleCopiar}
                  style={styles.headerBtn}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    clearDebugLogs();
                  }}
                  style={styles.headerBtn}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setVisible(false)}
                  style={styles.headerBtn}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Lista de logs */}
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
            >
              {logs.length === 0 ? (
                <Text style={styles.vacio}>
                  Sin logs todavia. Realiza una accion.
                </Text>
              ) : (
                logs.map((log, i) => (
                  <View key={i} style={styles.logEntry}>
                    <Text style={styles.logHora}>{log.hora}</Text>
                    <Text
                      style={[
                        styles.logTipo,
                        { color: colorPorTipo(log.tipo) },
                      ]}
                    >
                      {log.tipo}
                    </Text>
                    <Text style={styles.logMsg}>{log.msg}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 8,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  container: {
    height: "80%",
    backgroundColor: "#1A1A2E",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#16213E",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titulo: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerBotones: {
    flexDirection: "row",
    gap: 12,
  },
  headerBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 8,
  },
  vacio: {
    color: "#888",
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },
  logEntry: {
    backgroundColor: "#0F3460",
    borderRadius: 6,
    padding: 8,
    gap: 2,
  },
  logHora: {
    color: "#888",
    fontSize: 10,
  },
  logTipo: {
    fontSize: 11,
    fontWeight: "bold",
  },
  logMsg: {
    color: "#E0E0E0",
    fontSize: 12,
    fontFamily: "monospace",
  },
});

export default DebugLogger;
