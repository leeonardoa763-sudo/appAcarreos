-- ============================================================
-- SCHEMA — Control de Acarreos
-- Project: zqdnyqvgfymjorfplquf
-- Exportado: 2026-04-19
-- ============================================================

-- ============================================================
-- TABLAS MAESTRAS / CATÁLOGOS
-- ============================================================

-- Roles del sistema
-- Valores: 'Administrador', 'Residente', 'CHECADOR', 'Finanzas', 'Sindicato'
CREATE TABLE roles (
  id_roles     integer PRIMARY KEY,
  role         text
);

-- Empresas constructoras
CREATE TABLE empresas (
  id_empresa   integer PRIMARY KEY DEFAULT nextval('empresas_id_seq'),
  empresa      text NOT NULL,
  sufijo       text NOT NULL,        -- sufijo usado en folios
  logo         text                  -- URL del logo
);

-- Obras de construcción
-- IMPORTANTE: obra 888 = TEST, nunca en producción. Obra 146 = producción activa.
CREATE TABLE obras (
  id_obra                  integer PRIMARY KEY,
  obra                     text,
  cc                       integer,
  id_empresa               integer,
  latitud                  numeric,
  longitud                 numeric,
  radio_validacion_metros  integer DEFAULT 500,
  min_minutos_entre_viajes integer NOT NULL DEFAULT 20
);

-- Sindicatos de operadores
CREATE TABLE sindicatos (
  id_sindicato             integer PRIMARY KEY,
  sindicato                text,       -- nombre corto
  nombre_completo          text,
  nombre_firma_conciliacion varchar
);

-- Bancos de material (yacimientos). Lectura pública (anon).
CREATE TABLE bancos (
  id_banco  integer PRIMARY KEY,
  banco     text
);

-- Tipos de material (Pétreos, Carpeta asfáltica, Tepetate, etc.)
CREATE TABLE tipo_de_material (
  id_tipo_de_material  integer PRIMARY KEY,
  tipo_de_material     text
);

-- Catálogo de materiales
CREATE TABLE material (
  id_material          integer PRIMARY KEY,
  material             text,
  id_tipo_de_material  integer,
  es_material_descarga boolean DEFAULT false
);

-- ============================================================
-- USUARIOS
-- ============================================================

-- Usuarios del sistema. auth_user_id → auth.users.id
CREATE TABLE persona (
  id_persona        integer PRIMARY KEY,
  nombre            text,
  primer_apellido   text,
  segundo_apellido  text,
  id_role           integer,                   -- FK → roles.id_roles
  id_current_obra   integer,                   -- obra activa actual
  auth_user_id      uuid,                      -- FK → auth.users.id
  email             text,
  contraseña        text,                      -- LEGACY: no usar, la auth va por Supabase Auth
  id_sindicato      integer,
  usuario_activo    boolean NOT NULL DEFAULT true,
  feature_flags     jsonb DEFAULT '{}'::jsonb  -- flags por usuario (ver featureFlags.js)
);

-- Relación M:N persona ↔ obra
CREATE TABLE persona_obra (
  id          integer PRIMARY KEY DEFAULT nextval('persona_obra_id_seq'),
  persona_id  integer NOT NULL,
  obra_id     integer NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- OPERADORES Y VEHÍCULOS
-- ============================================================

-- Choferes de camión
-- IMPORTANTE: nombre_completo es columna GENERADA — nunca incluir en INSERT/UPDATE
-- Insertar siempre: nombre, primer_apellido, segundo_apellido
CREATE TABLE operadores (
  id_operador      integer PRIMARY KEY,
  nombre           text NOT NULL,
  primer_apellido  text,           -- en CLAUDE.md documentado como apellido_paterno
  segundo_apellido text,           -- en CLAUDE.md documentado como apellido_materno
  nombre_completo  text,           -- COLUMNA GENERADA (computed)
  id_sindicato     integer,
  activo           boolean DEFAULT true,
  fecha_registro   timestamptz DEFAULT now()
);

-- Camiones. qr_uid formato VH-{PLACAS}. Lectura pública (anon).
CREATE TABLE vehiculos (
  id_vehiculo          integer PRIMARY KEY,
  placas               text NOT NULL,
  qr_uid               text,                -- formato: VH-{PLACAS}
  id_sindicato         integer,
  capacidad_m3         numeric,
  id_operador_sugerido integer,
  activo               boolean DEFAULT true,
  fecha_registro       timestamptz DEFAULT now()
);

-- ============================================================
-- TARIFAS Y PRECIOS
-- ============================================================

-- Tarifas de material por sindicato y tipo (estructura de intervalos de km)
CREATE TABLE precios_material (
  id_precios_material    integer PRIMARY KEY,
  id_tipo_de_material    integer,
  id_sindicato           integer,
  numero_de_intervalos   numeric,
  primer_km              numeric,
  km_sub_int1            numeric,
  limite_int1            numeric,
  km_sub_int2            numeric,
  limite_int2            numeric
);

-- Tarifas de renta por sindicato
CREATE TABLE precios_renta (
  id_precios_renta  integer PRIMARY KEY,
  id_sindicato      integer,
  costo_hr          numeric,
  costo_dia         numeric
);

-- Peso específico por banco y tipo de material (para conversión m³ ↔ ton)
CREATE TABLE peso_especifico (
  id_peso_especifico  integer PRIMARY KEY,
  id_banco            integer,
  id_material         bigint,
  peso_especifico     numeric DEFAULT 1
);

-- Distancias precargadas banco → obra para cálculo automático de precio
CREATE TABLE distancias_banco_obra (
  id_distancia_banco_obra  integer PRIMARY KEY,
  id_banco                 integer NOT NULL,
  id_obra                  integer NOT NULL,
  distancia_km             numeric NOT NULL,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

-- ============================================================
-- PRESUPUESTOS POR OBRA
-- ============================================================

CREATE TABLE presupuesto_material_obra (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_obra             integer NOT NULL,
  id_material         integer NOT NULL,
  m3_presupuestados   numeric NOT NULL,
  m3_consumidos       numeric NOT NULL DEFAULT 0,
  activo              boolean NOT NULL DEFAULT true,
  created_by          integer,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE presupuesto_renta_obra (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_obra             integer NOT NULL,
  monto_presupuestado numeric NOT NULL,
  monto_consumido     numeric NOT NULL DEFAULT 0,
  activo              boolean NOT NULL DEFAULT true,
  created_by          integer,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- VALES (núcleo del sistema)
-- ============================================================

-- Cabecera de cada vale
-- estados: 'borrador' | 'en_proceso' | 'emitido' | 'verificado' | 'conciliado' | 'cancelado'
-- NOTA: el default en BD es 'borrador' — verificar si difiere de 'en_proceso' en lógica de app
-- fecha_creacion: timestamp financiero/presupuestal — NO usar para estadísticas
-- fecha_completado: fecha operacional — USAR para estadísticas y agrupaciones
CREATE TABLE vales (
  id_vale                  bigint PRIMARY KEY,
  folio                    varchar NOT NULL,
  tipo_vale                varchar NOT NULL,   -- '1'=Material Pétreo, '2'=Renta, '3'=Tepetate
  id_obra                  integer NOT NULL,
  id_empresa               integer NOT NULL,
  id_persona_creador       integer NOT NULL,
  id_operador              integer,
  id_vehiculo              integer,
  estado                   varchar DEFAULT 'borrador',
  fecha_creacion           timestamptz DEFAULT now(),
  fecha_completado         timestamptz,
  fecha_programada         date,
  qr_verification_url      text,
  verificado_por_sindicato boolean DEFAULT false,
  fecha_verificacion       timestamptz,
  id_persona_verificador   integer,
  id_persona_completador   integer,
  archivado                boolean DEFAULT false,
  total_descargas_web      integer DEFAULT 0,
  impresiones_ticket       integer NOT NULL DEFAULT 1,
  motivo_cancelacion       text,
  cancelado_por            uuid,
  fecha_cancelacion        timestamptz,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

-- Detalle de un vale de material
-- NOTA: el nombre real en BD es vale_material_detalles (con 's')
-- CLAUDE.md lo documenta como vale_material_detalle (sin 's') — actualizar CLAUDE.md
CREATE TABLE vale_material_detalles (
  id_detalle_material   integer PRIMARY KEY,
  id_vale               bigint,
  id_material           integer,
  id_banco              integer,
  id_sindicato          integer,
  id_precios_material   integer,
  capacidad_m3          numeric,
  distancia_km          numeric,
  cantidad_pedida_m3    numeric,
  volumen_real_m3       numeric,
  peso_ton              numeric,
  folio_banco           text,
  folio_vale_fisico     text,
  precio_m3             numeric,
  tarifa_primer_km      numeric,
  tarifa_subsecuente    numeric,
  costo_total           numeric,
  notas_adicionales     text,
  requisicion           text,
  foto_evidencia_url    text,
  latitud_completado    numeric,
  longitud_completado   numeric,
  distancia_obra_metros integer
);

-- Viajes de un vale de material (uno por fila)
-- Soporta overrides de banco/precio por viaje (flujo tipo 3)
CREATE TABLE vale_material_viajes (
  id_viaje              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_detalle_material   integer NOT NULL,
  numero_viaje          integer NOT NULL,
  hora_registro         timestamptz NOT NULL DEFAULT now(),
  id_persona_registro   integer NOT NULL,
  peso_ton              numeric,
  volumen_m3            numeric,
  precio_m3             numeric,
  costo_viaje           numeric,
  id_precios_material   integer,
  tarifa_primer_km      numeric,
  tarifa_subsecuente    numeric,
  folio_vale_fisico     text,
  -- Overrides para tipo 3 (tepetate)
  id_banco_override     integer,
  distancia_km_override numeric,
  precio_m3_override    numeric,
  costo_viaje_override  numeric,
  created_at            timestamptz DEFAULT now()
);

-- Detalle de un vale de renta
CREATE TABLE vale_renta_detalle (
  id_vale_renta_detalle  integer PRIMARY KEY,
  id_vale                bigint,
  id_material            integer,
  id_sindicato           integer,
  id_precios_renta       integer,
  capacidad_m3           numeric,
  hora_inicio            timestamptz,
  hora_fin               timestamptz,
  total_horas            numeric,
  total_dias             numeric,
  numero_viajes          integer DEFAULT 1,
  costo_total            numeric,
  notas_adicionales      text,
  es_renta_por_dia       boolean DEFAULT false,
  es_turno_nocturno      boolean NOT NULL DEFAULT false,
  foto_evidencia_url     text,
  latitud_completado     numeric,
  longitud_completado    numeric,
  distancia_obra_metros  integer,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- Viajes/turnos de un vale de renta
CREATE TABLE vale_renta_viajes (
  id_viaje               bigint PRIMARY KEY DEFAULT nextval('vale_renta_viajes_id_viaje_seq'),
  id_vale_renta_detalle  integer NOT NULL,
  numero_viaje           integer NOT NULL,
  hora_registro          timestamptz NOT NULL DEFAULT now(),
  id_persona_registro    integer NOT NULL,
  created_at             timestamptz DEFAULT now()
);

-- ============================================================
-- TICKETS
-- ============================================================

-- Tickets de material impresos (uno por viaje)
CREATE TABLE tickets_material (
  id_ticket            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_vale              integer NOT NULL,
  folio_ticket         text NOT NULL,
  numero_ticket        integer NOT NULL,
  id_persona_registro  integer NOT NULL,
  reimprimir_count     integer NOT NULL DEFAULT 0,
  fecha_impresion      timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz DEFAULT now()
);

-- Tickets de descarga (para vales de renta con descarga de material)
CREATE TABLE tickets_descarga (
  id_ticket             integer PRIMARY KEY DEFAULT nextval('tickets_descarga_id_ticket_seq'),
  id_vale               integer NOT NULL,
  folio_ticket          text NOT NULL,
  numero_ticket         integer NOT NULL,
  banco_descarga        text NOT NULL,
  id_material_ticket    integer,
  id_persona_registro   integer,
  reimprimir_count      integer NOT NULL DEFAULT 0,
  fecha_impresion       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CONCILIACIONES
-- ============================================================

-- Agrupación de vales para pago (vinculada a sindicato y semana)
CREATE TABLE conciliaciones (
  id_conciliacion      integer PRIMARY KEY DEFAULT nextval('conciliaciones_id_conciliacion_seq'),
  folio                varchar NOT NULL,
  tipo_conciliacion    varchar NOT NULL,
  id_obra              integer NOT NULL,
  id_sindicato         integer NOT NULL,
  id_empresa           integer NOT NULL,
  numero_semana        integer NOT NULL,
  año                  integer NOT NULL,
  fecha_inicio         date NOT NULL,
  fecha_fin            date NOT NULL,
  subtotal             numeric NOT NULL,
  iva_16_porciento     numeric NOT NULL,
  retencion_4_porciento numeric NOT NULL DEFAULT 0,
  total_final          numeric NOT NULL,
  total_dias           numeric DEFAULT 0,
  total_horas          numeric DEFAULT 0,
  estado               varchar DEFAULT 'generada',
  generado_por         integer NOT NULL,
  fecha_generacion     timestamp DEFAULT now(),
  created_at           timestamp DEFAULT now(),
  updated_at           timestamp DEFAULT now()
);

-- Relación M:N conciliacion ↔ vales
CREATE TABLE conciliacion_vales (
  id_conciliacion   integer NOT NULL,
  id_vale           bigint NOT NULL,
  fecha_vinculacion timestamp DEFAULT now()
);

-- ============================================================
-- CONFIGURACIÓN Y AUDITORÍA
-- ============================================================

-- Configuración dinámica de la app (versiones mínimas, URLs, etc.)
CREATE TABLE app_config (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_minima         text NOT NULL,
  version_actual         text NOT NULL,
  download_url           text NOT NULL,
  mensaje_actualizacion  text,
  notas                  text,
  activo                 boolean DEFAULT true,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- Notificaciones push (no documentado en CLAUDE.md)
CREATE TABLE notificaciones (
  id_notificacion  bigint PRIMARY KEY,
  id_vale          bigint NOT NULL,
  id_usuario       integer,
  leida            boolean DEFAULT false,
  fecha_creacion   timestamptz DEFAULT now()
);

-- Log de accesos a vales (auditoría)
CREATE TABLE vale_accesos (
  id_acceso    bigint PRIMARY KEY,
  id_vale      bigint NOT NULL,
  id_persona   integer,
  tipo_accion  varchar NOT NULL,   -- ej: 'ver', 'descargar', 'verificar'
  ip_address   varchar,
  user_agent   text,
  fecha_acceso timestamptz DEFAULT now()
);

-- ============================================================
-- VISTAS (VIEWS)
-- ============================================================

-- Vista: vales con número de semana calculado
-- vales_con_semanas (view): id_vale, folio, tipo_vale, estado, id_persona_creador,
--   id_obra, fecha_creacion, numero_semana, anio_semana

-- Vista: vehículos con sus vales en_proceso activos
-- vehiculos_vales_activos (view): id_vehiculo, placas, qr_uid, id_sindicato,
--   capacidad_m3, id_operador_sugerido, operador_sugerido_nombre,
--   vales_activos (count), ids_vales_activos (array), folios_activos (array)

-- ============================================================
-- DISCREPANCIAS DETECTADAS vs CLAUDE.md
-- ============================================================
-- 1. operadores.primer_apellido / segundo_apellido
--    CLAUDE.md dice apellido_paterno / apellido_materno — ACTUALIZAR CLAUDE.md
-- 2. vales.estado default = 'borrador' en BD
--    CLAUDE.md documenta estado inicial como 'en_proceso' — verificar si 'borrador' es válido
-- 3. Nombre de tabla: vale_material_detalles (con 's' al final)
--    CLAUDE.md dice vale_material_detalle (sin 's') — ACTUALIZAR CLAUDE.md
-- 4. Tablas NO documentadas en CLAUDE.md:
--    notificaciones, vale_accesos, empresas, material, tipo_de_material,
--    peso_especifico, precios_material, precios_renta, presupuesto_material_obra,
--    presupuesto_renta_obra, tickets_material, tickets_descarga
-- 5. persona.contraseña — columna legacy con contraseña en texto plano (no usar)
