# AGENTS.md — App de Gastos

Contexto para cualquier agente de código que trabaje en este repo.

## Qué es esto

App personal de control de gastos. Reemplaza un flujo previo de
"Shortcut de iOS → Google Apps Script → Google Sheets" (que ya funciona)
por una arquitectura propia. El Shortcut se va a mantener del lado del
usuario, pero apuntando a la nueva API en vez de a Apps Script.

## Stack

- **DB**: Supabase (Postgres gestionado en la nube, plan free)
- **Backend**: NestJS + TypeORM, conectado a Supabase vía connection string
- **Frontend**: Angular (dashboard visual: balance, gráficos por categoría,
  totales por mes)
- **Deploy backend**: Render (Web Service free tier — duerme tras 15 min
  de inactividad, cold start ~20-30s al despertar; aceptable para este caso
  de uso)
- **Deploy frontend**: Vercel

## Estructura del repo

```
app-gastos/
├── backend/                 # API NestJS
│   └── src/
│       ├── gastos/
│       │   ├── entities/    # Entity de TypeORM: Gasto
│       │   ├── dto/         # DTOs de creación/consulta
│       │   ├── gastos.controller.ts
│       │   ├── gastos.service.ts
│       │   └── gastos.module.ts
│       ├── config/          # Config de conexión a Supabase (env vars)
│       ├── common/          # Pipes, filtros, interceptores compartidos
│       ├── app.module.ts
│       └── main.ts
├── frontend/                 # Dashboard Angular
│   └── src/app/
│       ├── core/
│       │   ├── services/    # Cliente HTTP hacia la API
│       │   └── models/      # Interfaces TS (Gasto, ResumenMensual, etc.)
│       ├── features/
│       │   ├── dashboard/   # Vista principal: balance, gráficos
│       │   └── gastos/      # Listado/detalle de gastos
│       └── shared/          # Componentes reutilizables (cards, etc.)
└── AGENTS.md                 # este archivo
```

## Modelo de datos — tabla `gastos`

| Campo         | Tipo                | Notas                                  |
|---------------|----------------------|-----------------------------------------|
| id            | uuid (PK)            | generado por Postgres                   |
| descripcion   | text                 |                                          |
| fecha         | date                 | fecha real, no texto                    |
| monto         | numeric(12,2)        |                                          |
| categoria     | text                 | Comida, Transporte, Casa, Entretenimiento, Salud, Compras, Otro |
| metodo_pago   | text                 | Efectivo, Débito, Transferencia, etc.   |
| created_at    | timestamptz          | default now()                           |

Origen del listado de categorías/métodos: son los mismos que ya están
cargados como opciones fijas en el Shortcut de iOS existente — mantener
los mismos valores para no romper la migración de datos históricos.

## Endpoints planeados

- `POST /gastos` — crea un gasto (usado por el Shortcut de iOS)
- `GET /gastos` — lista gastos (con filtros opcionales por rango de fecha/categoría)
- `GET /gastos/resumen` — total general + total por categoría
- `GET /gastos/resumen/mensual` — histórico de totales agrupados por año/mes
  (equivalente al QUERY que se usaba en la hoja de Google Sheets)

## Variables de entorno (backend)

```
DATABASE_URL=            # connection string de Supabase (Postgres)
PORT=3000
```

## Convenciones

- Seguir el mismo estilo que el proyecto Dimundo (NestJS + Angular +
  Postgres) del mismo autor: TypeORM para el ORM, DTOs con
  class-validator, módulos por dominio.
- El backend es la única fuente de verdad para los cálculos de resumen
  (no replicar lógica de agregación en el frontend).
- Mantener compatibilidad de nombres de campo con lo que ya manda el
  Shortcut (`descripcion`, `fecha`, `monto`, `categoria`, `metodo_pago`)
  para no tener que rehacer esa parte.

## Estado actual / próximos pasos

1. [x] SQL de la tabla `gastos` listo en `backend/database/migrations/001_create_gastos.sql`
   (falta: crear el proyecto en Supabase y ejecutar ese SQL)
2. [x] Scaffolding del proyecto NestJS real (`nest new backend`) sobre esta carpeta
3. [x] Entity + módulo + endpoints de `gastos`
4. [ ] Migrar el Shortcut de iOS para que apunte a la nueva API
5. [x] Scaffolding del proyecto Angular (`ng new frontend`) sobre esta carpeta
6. [x] Dashboard: balance, gráfico por categoría, histórico mensual
7. [ ] Deploy backend en Render, frontend en Vercel

Nota: el backend no arranca hasta tener `DATABASE_URL` válido en `backend/.env`.
El frontend apunta a `http://localhost:3000/gastos` en `frontend/src/app/core/services/gastos.service.ts`
(sustituir por la URL de Render en producción).
