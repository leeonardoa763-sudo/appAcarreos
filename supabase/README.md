# Base de datos — Control de Acarreos

Project ref: `zqdnyqvgfymjorfplquf`

## Estructura

```
supabase/
├── schema.sql          ← Esquema completo actual (snapshot)
├── migrations/         ← Cambios incrementales futuros
│   └── YYYYMMDD_descripcion.sql
└── seeds/              ← Datos de prueba (obra 888)
```

## Cómo actualizar schema.sql

Cuando hagas cambios en Supabase, ejecuta esta query en el SQL Editor
y reemplaza el contenido de schema.sql:

```sql
-- Ver todas las tablas del proyecto
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## Convención para migrations

Nombre: `YYYYMMDD_descripcion_corta.sql`
Ejemplo: `20250419_agregar_columna_notas_vale.sql`

Cada archivo debe ser idempotente (usar `IF NOT EXISTS`, `IF EXISTS`).
