import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput } from "react-native";
import { colors } from "../../config/colors";
import { normalizarNombreBanco } from "../../hooks/useGestionBancos";
import ListaSeleccion from "../common/ListaSeleccion";
import {
  CajaModal,
  PieModal,
  FilaInfo,
  CampoNumero,
  MensajeError,
  estilosModal as estilos,
} from "./modalPartes";

const clave = (a, b) => `${a}-${b}`;

// ─── Banco ───────────────────────────────────────────────────────────────────
export function ModalBanco({ visible, banco, bancos = [], onGuardar, onCerrar }) {
  const [nombre, setNombre] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setNombre(banco?.banco ?? "");
      setErrMsg("");
    }
  }, [visible, banco]);

  // Aviso en vivo mientras escribe, antes de intentar guardar.
  const duplicado = useMemo(() => {
    const normalizado = normalizarNombreBanco(nombre);
    if (!normalizado) return null;
    return (
      bancos.find(
        (b) =>
          b.id_banco !== banco?.id_banco &&
          normalizarNombreBanco(b.banco) === normalizado
      ) ?? null
    );
  }, [nombre, bancos, banco]);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setErrMsg("Ingresa el nombre del banco");
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(nombre.trim());
      onCerrar();
    } catch (e) {
      setErrMsg(e.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <CajaModal
      visible={visible}
      titulo={banco ? "Editar banco" : "Nuevo banco"}
      onCerrar={onCerrar}
      pie={
        <PieModal
          onCerrar={onCerrar}
          onGuardar={handleGuardar}
          guardando={guardando}
          habilitado={!!nombre.trim() && !duplicado}
        />
      }
    >
      <Text style={estilos.inputLabel}>Nombre del banco</Text>
      <View
        style={[
          estilos.inputFila,
          (errMsg || duplicado) && estilos.inputError,
        ]}
      >
        <TextInput
          style={estilos.input}
          value={nombre}
          onChangeText={(v) => {
            setNombre(v);
            setErrMsg("");
          }}
          placeholder="Ej: BANCO TEPETATE NORTE"
          placeholderTextColor={colors.input.placeholder}
          autoCapitalize="characters"
        />
      </View>

      <MensajeError
        texto={
          duplicado
            ? `Ya existe un banco registrado como "${duplicado.banco}".`
            : errMsg
        }
      />
    </CajaModal>
  );
}

// ─── Distancia banco - obra ──────────────────────────────────────────────────
export function ModalDistancia({
  visible,
  distancia,
  listaBancos = [],
  obras = [],
  distancias = [],
  onGuardar,
  onCerrar,
}) {
  const esEdicion = !!distancia;
  const [bancoSelId, setBancoSelId] = useState(null);
  const [obraSelId, setObraSelId] = useState(null);
  const [distKm, setDistKm] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setBancoSelId(distancia?.id_banco ?? null);
      setObraSelId(distancia?.id_obra ?? null);
      setDistKm(distancia ? String(distancia.distancia_km) : "");
      setErrMsg("");
    }
  }, [visible, distancia]);

  const usadas = useMemo(
    () => new Set(distancias.map((d) => clave(d.id_banco, d.id_obra))),
    [distancias]
  );

  const itemsBancos = useMemo(
    () =>
      listaBancos.map((b) => {
        const libres = obras.filter(
          (o) => !usadas.has(clave(b.id_banco, o.id_obra))
        ).length;
        return {
          id: b.id_banco,
          label: b.banco,
          deshabilitado: obras.length > 0 && libres === 0,
          nota: "Todas configuradas",
        };
      }),
    [listaBancos, obras, usadas]
  );

  const itemsObras = useMemo(
    () =>
      obras.map((o) => ({
        id: o.id_obra,
        label: o.obra,
        deshabilitado:
          bancoSelId != null && usadas.has(clave(bancoSelId, o.id_obra)),
        nota: "Ya configurada",
      })),
    [obras, bancoSelId, usadas]
  );

  const handleSeleccionarBanco = (id) => {
    setBancoSelId(id);
    setErrMsg("");
    // La obra elegida puede quedar bloqueada con el banco nuevo.
    if (obraSelId != null && usadas.has(clave(id, obraSelId))) {
      setObraSelId(null);
    }
  };

  const km = parseFloat(distKm);
  const kmValido = Number.isFinite(km) && km > 0;
  const habilitado = esEdicion
    ? kmValido
    : !!bancoSelId && !!obraSelId && kmValido;

  const handleGuardar = async () => {
    if (!esEdicion && !bancoSelId) return setErrMsg("Selecciona un banco");
    if (!esEdicion && !obraSelId) return setErrMsg("Selecciona una obra");
    if (!kmValido) return setErrMsg("Ingresa una distancia valida en km");

    setGuardando(true);
    try {
      if (esEdicion) {
        await onGuardar(distancia.id_distancia_banco_obra, km);
      } else {
        await onGuardar({
          id_banco: bancoSelId,
          id_obra: obraSelId,
          distancia_km: km,
        });
      }
      onCerrar();
    } catch (e) {
      setErrMsg(e.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <CajaModal
      visible={visible}
      titulo={esEdicion ? "Editar distancia" : "Nueva distancia"}
      onCerrar={onCerrar}
      pie={
        <PieModal
          onCerrar={onCerrar}
          onGuardar={handleGuardar}
          guardando={guardando}
          habilitado={habilitado}
        />
      }
    >
      {esEdicion ? (
        <FilaInfo
          icono="map-marker-distance"
          texto={`${distancia?.bancos?.banco}  →  ${distancia?.obras?.obra}`}
        />
      ) : (
        <>
          <ListaSeleccion
            label="Banco"
            items={itemsBancos}
            valor={bancoSelId}
            onSeleccionar={handleSeleccionarBanco}
            placeholderBusqueda="Buscar banco..."
            mensajeVacio="No hay bancos registrados"
          />

          <View style={estilos.espacio} />

          <ListaSeleccion
            label="Obra"
            items={itemsObras}
            valor={obraSelId}
            onSeleccionar={(id) => {
              setObraSelId(id);
              setErrMsg("");
            }}
            placeholderBusqueda="Buscar obra..."
            mensajeVacio="No hay obras activas"
          />

          <View style={estilos.espacio} />
        </>
      )}

      <CampoNumero
        label="Distancia"
        valor={distKm}
        onChange={(v) => {
          setDistKm(v);
          setErrMsg("");
        }}
        placeholder="Ej: 12.5"
        sufijo="km"
        error={!!errMsg}
      />

      <MensajeError texto={errMsg} />
    </CajaModal>
  );
}

// ─── Distancia banco - planta de asfaltos ────────────────────────────────────
export function ModalDistanciaPlanta({
  visible,
  distancia,
  listaBancos = [],
  distanciasPlanta = [],
  onGuardar,
  onCerrar,
}) {
  const esEdicion = !!distancia;
  const [bancoSelId, setBancoSelId] = useState(null);
  const [distKm, setDistKm] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setBancoSelId(distancia?.id_banco ?? null);
      setDistKm(distancia ? String(distancia.distancia_km) : "");
      setErrMsg("");
    }
  }, [visible, distancia]);

  // La tabla tiene UNIQUE (id_banco): un banco solo puede tener una distancia
  // a la planta.
  const itemsBancos = useMemo(() => {
    const usados = new Set(distanciasPlanta.map((d) => d.id_banco));
    return listaBancos.map((b) => ({
      id: b.id_banco,
      label: b.banco,
      deshabilitado: usados.has(b.id_banco),
      nota: "Ya configurado",
    }));
  }, [listaBancos, distanciasPlanta]);

  const km = parseFloat(distKm);
  const kmValido = Number.isFinite(km) && km > 0;
  const habilitado = esEdicion ? kmValido : !!bancoSelId && kmValido;

  const handleGuardar = async () => {
    if (!esEdicion && !bancoSelId) return setErrMsg("Selecciona un banco");
    if (!kmValido) return setErrMsg("Ingresa una distancia valida en km");

    setGuardando(true);
    try {
      if (esEdicion) {
        await onGuardar(distancia.id_distancia_banco_planta, km);
      } else {
        await onGuardar({ id_banco: bancoSelId, distancia_km: km });
      }
      onCerrar();
    } catch (e) {
      setErrMsg(e.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <CajaModal
      visible={visible}
      titulo={esEdicion ? "Editar distancia a planta" : "Nueva distancia a planta"}
      onCerrar={onCerrar}
      pie={
        <PieModal
          onCerrar={onCerrar}
          onGuardar={handleGuardar}
          guardando={guardando}
          habilitado={habilitado}
        />
      }
    >
      {esEdicion ? (
        <FilaInfo
          icono="map-marker-distance"
          texto={`${distancia?.bancos?.banco}  →  Planta de Asfaltos`}
        />
      ) : (
        <>
          <ListaSeleccion
            label="Banco"
            items={itemsBancos}
            valor={bancoSelId}
            onSeleccionar={(id) => {
              setBancoSelId(id);
              setErrMsg("");
            }}
            placeholderBusqueda="Buscar banco..."
            mensajeVacio="No hay bancos registrados"
          />
          <View style={estilos.espacio} />
        </>
      )}

      <CampoNumero
        label="Distancia"
        valor={distKm}
        onChange={(v) => {
          setDistKm(v);
          setErrMsg("");
        }}
        placeholder="Ej: 12.5"
        sufijo="km"
        error={!!errMsg}
      />

      <MensajeError texto={errMsg} />
    </CajaModal>
  );
}

// ─── Peso especifico ─────────────────────────────────────────────────────────
export function ModalPesoEspecifico({
  visible,
  peso,
  listaBancos = [],
  materiales = [],
  pesosEspecificos = [],
  onGuardar,
  onCerrar,
}) {
  const esEdicion = !!peso;
  const [bancoSelId, setBancoSelId] = useState(null);
  const [materialSelId, setMaterialSelId] = useState(null);
  const [valorPeso, setValorPeso] = useState("1");
  const [errMsg, setErrMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setBancoSelId(peso?.id_banco ?? null);
      setMaterialSelId(peso?.id_material ?? null);
      setValorPeso(peso ? String(peso.peso_especifico) : "1");
      setErrMsg("");
    }
  }, [visible, peso]);

  // La tabla tiene UNIQUE (id_material, id_banco).
  const usados = useMemo(
    () => new Set(pesosEspecificos.map((p) => clave(p.id_banco, p.id_material))),
    [pesosEspecificos]
  );

  const itemsBancos = useMemo(
    () =>
      listaBancos.map((b) => {
        const libres = materiales.filter(
          (m) => !usados.has(clave(b.id_banco, m.id_material))
        ).length;
        return {
          id: b.id_banco,
          label: b.banco,
          deshabilitado: materiales.length > 0 && libres === 0,
          nota: "Todos configurados",
        };
      }),
    [listaBancos, materiales, usados]
  );

  const itemsMateriales = useMemo(
    () =>
      materiales.map((m) => ({
        id: m.id_material,
        label: m.material,
        deshabilitado:
          bancoSelId != null && usados.has(clave(bancoSelId, m.id_material)),
        nota: "Ya configurado",
      })),
    [materiales, bancoSelId, usados]
  );

  const handleSeleccionarBanco = (id) => {
    setBancoSelId(id);
    setErrMsg("");
    if (materialSelId != null && usados.has(clave(id, materialSelId))) {
      setMaterialSelId(null);
    }
  };

  const val = parseFloat(valorPeso);
  const valValido = Number.isFinite(val) && val > 0;
  const habilitado = esEdicion
    ? valValido
    : !!bancoSelId && !!materialSelId && valValido;

  const handleGuardar = async () => {
    if (!esEdicion && !bancoSelId) return setErrMsg("Selecciona un banco");
    if (!esEdicion && !materialSelId) return setErrMsg("Selecciona un material");
    if (!valValido) return setErrMsg("Ingresa un peso valido mayor a 0");

    setGuardando(true);
    try {
      if (esEdicion) {
        await onGuardar(peso.id_peso_especifico, val);
      } else {
        await onGuardar({
          id_banco: bancoSelId,
          id_material: materialSelId,
          peso_especifico: val,
        });
      }
      onCerrar();
    } catch (e) {
      setErrMsg(e.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <CajaModal
      visible={visible}
      titulo={esEdicion ? "Editar peso" : "Nuevo peso especifico"}
      onCerrar={onCerrar}
      pie={
        <PieModal
          onCerrar={onCerrar}
          onGuardar={handleGuardar}
          guardando={guardando}
          habilitado={habilitado}
        />
      }
    >
      {esEdicion ? (
        <FilaInfo
          icono="weight-kilogram"
          texto={`${peso?.bancos?.banco}  ·  ${peso?.material?.material}`}
        />
      ) : (
        <>
          <ListaSeleccion
            label="Banco"
            items={itemsBancos}
            valor={bancoSelId}
            onSeleccionar={handleSeleccionarBanco}
            placeholderBusqueda="Buscar banco..."
            mensajeVacio="No hay bancos registrados"
          />

          <View style={estilos.espacio} />

          <ListaSeleccion
            label="Material"
            items={itemsMateriales}
            valor={materialSelId}
            onSeleccionar={(id) => {
              setMaterialSelId(id);
              setErrMsg("");
            }}
            placeholderBusqueda="Buscar material..."
            mensajeVacio="No hay materiales en el catalogo"
          />

          <View style={estilos.espacio} />
        </>
      )}

      <CampoNumero
        label="Peso especifico"
        valor={valorPeso}
        onChange={(v) => {
          setValorPeso(v);
          setErrMsg("");
        }}
        placeholder="Ej: 1.85"
        sufijo="ton/m3"
        error={!!errMsg}
      />

      <MensajeError texto={errMsg} />
    </CajaModal>
  );
}
