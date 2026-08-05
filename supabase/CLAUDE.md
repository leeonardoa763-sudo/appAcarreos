# CLAUDE.md — supabase/

Contexto de seguridad (RLS) del proyecto. Ref: `zqdnyqvgfymjorfplquf`.

Última verificación contra `pg_policies` en vivo: **2026-07-02**, cobertura
completa del schema `public`. Este archivo refleja el estado real (no solo la
intención de las migraciones). Falta solo `storage.objects` (bucket
`evidencias-vales`) — usar la query de Storage más abajo si se toca.

---

## QUÉ HAY EN ESTA CARPETA

| Archivo | Qué es |
|---|---|
| `schema.sql` | Snapshot de **tablas**. Del 2026-04-19 y **desactualizado** — le faltan tablas y columnas, ver hallazgo #8 del archivo de abajo |
| `funciones_triggers_vistas.sql` | Snapshot de **funciones, triggers, vistas y matviews** (2026-08-04) |
| `migrations/` | Cambios versionados. Solo cubren una parte de lo que existe en la BD |

**Los dos `.sql` de snapshot son para leer, no para correr.** Un cambio se hace
con una migración nueva en `migrations/` que toque solo ese objeto.

### Mucho de lo que corre en la BD nunca tuvo migración

Antes del 2026-08-04 el repo tenía el cuerpo de **3 funciones y 0 triggers**, y
en la BD hay **26 funciones y 14 triggers**. Todo lo demás se creó a mano en el
SQL Editor.

Eso costó caro una vez: al aplicar tarifas por obra, el trigger
`calcular_totales_vale_renta` revertía en silencio el `costo_total` de los vales
de renta, y su cuerpo no estaba en ninguna parte del repo — solo aparecía en unos
`GRANT`/`REVOKE`. Por eso existe `funciones_triggers_vistas.sql`.

**Antes de diagnosticar cualquier cosa donde un valor guardado no coincide con lo
que escribió la app, revisa los triggers de esa tabla en ese archivo.** Un
`BEFORE` puede estar reescribiendo la fila.

Su sección **HALLAZGOS** lista 8 problemas reales encontrados al volcarlo
(notificaciones que nunca se crean por casing, funciones muertas, `SECURITY
DEFINER` sin `search_path`, sobrecargas ambiguas). No están corregidos.

Para re-volcar el estado real:

```sql
SELECT p.proname, pg_get_functiondef(p.oid) FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f' ORDER BY p.proname;

SELECT c.relname, t.tgname, pg_get_triggerdef(t.oid) FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND NOT t.tgisinternal ORDER BY 1, 2;
```

---

## 🟢 BUG CORREGIDO (fix preparado, pendiente de aplicar en Supabase) — casing de rol Administrador

El código de la app compara siempre `role === "Administrador"` (PascalCase) —
ver `src/screens/CLAUDE.md` (sección "Roles en componentes"), `AcarreosScreen.js`,
`BottomTabNavigator.js`, `ValesScreen.js`, `useViajesRenta.js`,
`useViajesMaterial.js`. Los roles confirmados en la tabla `roles` (2026-07-02)
son: `Administrador`, `Residente`, `Finanzas`, `Sindicato`, `CHECADOR` (este
último sí en mayúsculas). **`'ADMINISTRADOR'` en mayúsculas no existe como
valor real.**

> La app además compara contra `"Planta de Asfaltos"` (PascalCase con espacios)
> en `utils/plantaAsfaltos.js`, `useVehiculoQR.js` y varias pantallas. Ese rol
> es posterior a la verificación del 2026-07-02 y **no está confirmado contra
> `pg_policies` ni contra la tabla `roles`** — correr la query de roles de más
> abajo antes de escribir cualquier policy que lo mencione.

Políticas que comparaban contra `'ADMINISTRADOR'` (mayúsculas) nunca
matcheaban — bloqueaban en silencio incluso a un Administrador autenticado real:

| Tabla | Políticas afectadas | Efecto (antes del fix) |
|---|---|---|
| `distancias_banco_obra` | INSERT/UPDATE/DELETE (`Only admins can ...`) | Nadie podía escribir distancias banco-obra, ni el Administrador |
| `persona_obra` | SELECT/INSERT/DELETE (`Admins read all / insert / delete obra assignments`) | El Administrador solo veía sus propias asignaciones (vía la policy de "Users read own") y no podía crear ni quitar ninguna |
| `operadores` | INSERT/UPDATE (`role = ANY('Residente','Administrador','ADMINISTRADOR')`) | Sin efecto real — `'Administrador'` ya está en el array, la entrada uppercase es dead code, no requiere fix |
| `vehiculos` | INSERT/UPDATE (mismo array) | Sin efecto real, mismo motivo que `operadores` |

**Fix:** migración `supabase/migrations/20260702_fix_administrador_casing.sql`
— recrea las 6 policies afectadas de `distancias_banco_obra` y `persona_obra`
con `role = 'Administrador'`. **Falta correrla en el SQL Editor de Supabase**
(el usuario aplica migraciones manualmente). `operadores`/`vehiculos` no se
tocaron por ser dead code sin efecto — limpiarlos es opcional, no urgente.

Después de aplicarla, confirmar con:
```sql
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('distancias_banco_obra', 'persona_obra')
ORDER BY tablename, policyname;
```

---

## 🟡 A VERIFICAR — UPDATE en `vales` sin check de identidad

Policy `"Permitir actualizar estado a conciliado"` en `vales`:
- `roles`: `{public}` (aplica a `anon` Y `authenticated`, no hay `TO authenticated`)
- `USING`: `verificado_por_sindicato = true AND estado = 'verificado'`
- `WITH CHECK`: `estado = 'conciliado'`

No hay ningún `EXISTS`/`auth.uid()` — la única barrera es el estado de la fila,
no quién hace la petición. RLS por sí sola no basta: si la key `anon` (la que
usa `web-acarreos.vercel.app`, pública y sin login) tiene además el GRANT de
`UPDATE` a nivel tabla sobre `vales`, entonces cualquiera con la anon key
podría mover un vale verificado a `conciliado` sin autenticarse. Si `anon`
solo tiene `SELECT` a nivel tabla (lo normal en Supabase salvo grant explícito),
el riesgo real es bajo porque el UPDATE se rechaza antes de evaluar RLS.

**Verificar con:**
```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'vales'
ORDER BY grantee, privilege_type;
```
Si `anon` aparece con `UPDATE`, es un hallazgo real que requiere decidir: o se
quita el GRANT de `UPDATE` a `anon`, o se le agrega un `TO authenticated` a la
policy (lo más probable que se buscaba originalmente).

---

## Cómo consultar las políticas vigentes

Ejecutar en el SQL Editor de Supabase cuando haya duda sobre el estado real:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd,
       qual AS using_expression, with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

```sql
-- Tablas con RLS habilitado/forzado
SELECT relname AS tabla, relrowsecurity AS rls_habilitado, relforcerowsecurity AS rls_forzado
FROM pg_class
WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
ORDER BY relname;
```

```sql
-- Valores reales de rol (para evitar bugs de casing como el de arriba)
SELECT DISTINCT role FROM roles ORDER BY role;
```

```sql
-- Políticas de Storage (bucket evidencias-vales), esquema distinto a public
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
```

---

## Modelo de roles de negocio

Tabla `roles` (columna `role`), NO confundir con roles de Postgres
(`anon`/`authenticated`/`service_role`). Valores confirmados (2026-07-02):
`Administrador`, `Residente`, `Finanzas`, `Sindicato`, `CHECADOR`.
La app usa además `Planta de Asfaltos`, sin confirmar contra la BD — ver nota
en la sección de casing arriba.

Patrón estándar para "solo Administrador puede escribir":
```sql
EXISTS (
  SELECT 1 FROM persona p
  JOIN roles r ON r.id_roles = p.id_role
  WHERE p.auth_user_id = auth.uid()
    AND r.role = 'Administrador'
)
```
Usar este patrón tal cual en policies nuevas. **Siempre `'Administrador'`, nunca `'ADMINISTRADOR'`.**

**Patrón "propietario de obra"** — usado en tablas de vales/tickets/viajes
(`tickets_material`, `tickets_descarga`, `vale_material_detalles`,
`vale_material_viajes`, `vale_renta_detalle`, y variantes). Un usuario puede
leer/escribir si se cumple cualquiera de:
1. Es Administrador o Finanzas (acceso total), o
2. Está asignado a la obra del vale vía `persona_obra`, o
3. La obra del vale es su `persona.id_current_obra` (obra activa actual), o
4. (Solo lectura, `vale_material_detalles`/`vale_material_viajes`/`vale_renta_detalle`) Es Sindicato y el operador del vale pertenece a su `id_sindicato`.

`tickets_material` es una excepción parcial: su INSERT sí incluye la condición
3 (`id_current_obra`), pero SELECT/UPDATE no la incluyen — inconsistente con
`tickets_descarga`, que sí la incluye en las 4 operaciones. Podría ser
intencional o un descuido; no tocar sin confirmar.

---

## Estado por tabla (confirmado contra pg_policies en vivo)

### Catálogos con lectura pública (anon)
`bancos`, `empresas`, `material`, `obras`, `operadores` (solo `activo = true`
para authenticated, sin ese filtro para anon), `persona` (**expone todas las
filas a anon sin login** — confirmar si es intencional, incluye nombres),
`precios_renta`, `sindicatos`, `tipo_de_material` (dos policies anon
redundantes: una filtrada a tipos usados en vales, otra sin filtro — la
segunda hace inútil a la primera), `conciliaciones`, `conciliacion_vales`,
`vale_material_detalles`, `vale_renta_detalle`.

`precios_material`, `roles`, `distancias_banco_obra`: solo `authenticated`, sin anon.

### Escritura solo-Administrador (patrón EXISTS estándar, `'Administrador'` correcto)
`bancos`, `peso_especifico`, `material`, `tipo_de_material` — INSERT/UPDATE/DELETE
según aplique. `presupuesto_material_obra` / `presupuesto_renta_obra` tienen
doble policy redundante (`ALL` con EXISTS + `UPDATE` con EXISTS) — mismo efecto,
limpieza posible pero no urgente. `app_config` usa `ALL` con el mismo patrón.
`vale_material_detalles` y `vale_material_viajes` también tienen policies UPDATE/DELETE
"Administrador edita/elimina X" con el patrón correcto.

### Escritura solo-Administrador con bug de casing (ver sección roja arriba)
`distancias_banco_obra` (INSERT/UPDATE/DELETE), `persona_obra` (INSERT/DELETE).

### Multi-rol con reglas propias
- **`conciliaciones`**: Admin crea cualquiera; Sindicato solo crea/lee las suyas
  (`p.id_sindicato = conciliaciones.id_sindicato`); Admin+Finanzas leen/actualizan todas.
- **`operadores`**: INSERT/UPDATE para `Residente`, `Administrador` o `ADMINISTRADOR`
  (el último es dead code, ver arriba).
- **`solicitudes_desverificacion`**: INSERT solo Admin; SELECT Admin+Finanzas (todas)
  o Sindicato (solo las de su `id_sindicato_requerido`).
- **`vale_accesos`**: INSERT anon restringido a `tipo_accion = 'visualizacion_publica'`
  y `id_persona IS NULL` (para la web pública); INSERT authenticated sin restricción;
  SELECT Admin+Finanzas (todas) o Sindicato (solo las suyas por `id_persona`).
- **`vale_material_viajes`** UPDATE "banco override": incluye rol `CHECADOR` además
  del patrón de propietario de obra — único lugar donde aparece ese rol en policies.
- **`persona`**: cualquier authenticated lee todas las filas; solo puede actualizar
  su propia fila (`auth_user_id = auth.uid()`).

### Sin restricción real (`true`/`true`, riesgo aceptado documentado en migraciones)
- `asignacion_operador_vehiculo`: `ALL` para authenticated, `USING/WITH CHECK true`.
- `notificaciones`: INSERT sin restricción (`public`, `WITH CHECK true`) —
  pero SELECT/UPDATE **sí** están protegidos (solo el dueño vía
  `persona.auth_user_id = auth.uid()` contra `notificaciones.id_usuario`).
  Corrección respecto a la versión anterior de este archivo, que decía que
  todo era `true`.

### Funciones SECURITY DEFINER (de migraciones, no re-verificado en vivo esta vez)
- Internas (triggers): `REVOKE FROM PUBLIC` sin re-grant — `actualizar_updated_at`,
  `calcular_totales_vale_renta`, `recalcular_consumo_*`.
- De negocio (llamadas por la app autenticada): `REVOKE FROM PUBLIC` + `GRANT TO authenticated`
  — `completar_vale_material`, `completar_vale_renta`, `generar_folio_*`,
  `verificar_vale`, `solicitar_desverificacion`, `responder_desverificacion`,
  `refrescar_stats`, `recalcular_presupuesto_*`.
- Web pública: `registrar_descarga_vale_web` mantiene `anon` — la usa
  `web-acarreos.vercel.app` sin login. **No revocar.**

### `vales` — la tabla central, policies más ricas
- **SELECT**: `anon` lee todo (`Public read vales`, web pública); Sindicato ve
  vales cuyo operador es de su `id_sindicato`; el resto vía patrón "propietario
  de obra" (Admin/Finanzas, `persona_obra`, o `id_current_obra`).
- **INSERT** (`Users create own vales`): exige `id_persona_creador = self` **y**
  patrón de propietario de obra — no basta con ser dueño de la obra, el vale
  debe quedar atribuido a quien lo crea.
- **UPDATE**, cinco policies distintas (permisivas, se OR'ean):
  - `Users update own vales` — patrón de propietario de obra, **sin** restricción
    de `estado` ni de columnas. Es la más amplia: si el usuario tiene acceso a
    la obra, puede modificar cualquier campo del vale en cualquier estado. Las
    otras cuatro son más específicas pero redundantes en la práctica porque
    esta ya cubre casi todos los casos de sus mismos usuarios.
  - `Admin verifica cualquier vale` — Admin, exige que el UPDATE deje
    `verificado_por_sindicato` e `id_persona_verificador` no nulos.
  - `Sindicato verifica sus vales` — Sindicato, solo vales `emitido` y no
    verificados de operadores de su sindicato; exige que el UPDATE marque
    `verificado_por_sindicato = true` con fecha y verificador.
  - `Residente cancela vale en_proceso` — Residente con obra asignada, solo
    vales `en_proceso`, exige que el UPDATE deje `estado = 'cancelado'`.
  - `Permitir actualizar estado a conciliado` — ver hallazgo 🟡 arriba.

### `vehiculos`
Mismo patrón que `operadores`: SELECT abierto a anon (`true`) y a authenticated
(`activo = true`); INSERT/UPDATE para `Residente`/`Administrador`/`ADMINISTRADOR`
(la entrada uppercase es dead code, ver tabla de arriba).

### `vale_renta_viajes`
Mismo patrón "propietario de obra" que `vale_material_viajes`, pero aquí
**Sindicato tiene DELETE además de SELECT** (`v.id_operador` pertenece a su
`id_sindicato`) — en `vale_material_viajes`/`vale_material_detalles` el
Sindicato solo tiene lectura. Confirmar si dar borrado a Sindicato en viajes
de renta es intencional o una asimetría no buscada frente al flujo de material.

### Storage
- Bucket `evidencias-vales`: lectura pública intencional (PDFs compartidos por QR).
  No verificado en esta pasada — usar la query de `storage.objects` de arriba si se toca.

---

## Reglas al tocar RLS

- Nunca dejar `USING (true)` / `WITH CHECK (true)` en escritura salvo que ya
  esté documentado arriba como riesgo aceptado.
- Toda policy nueva de "solo admin" usa el patrón EXISTS con `role = 'Administrador'`
  (PascalCase) — nunca `'ADMINISTRADOR'`.
- Cambios a políticas son una migración nueva en `migrations/`, nunca edición
  manual sin registrar (ver CLAUDE.md raíz: cambios a BD siempre aditivos).
- No tocar policies de obra `146` (producción) sin correr antes `pg_policies`
  para confirmar el estado real — este archivo puede quedar desactualizado.
