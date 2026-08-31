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

## Git / GitHub

- Repo público: https://github.com/Mateiin/app-gastos
- Rama por defecto: `main`. Git local configurado con usuario `Mateiin`
  y email noreply `185133342+Mateiin@users.noreply.github.com`.
- **IMPORTANTE**: `backend/.env` (con el `DATABASE_URL` real de Supabase,
  incluye contraseña) NO se sube a GitHub (está en `.gitignore`).
  Solo se versiona `backend/.env.example` como plantilla. Nunca commitear/envair el `.env`.

## Estado actual / próximos pasos

1. [x] SQL de la tabla `gastos` listo y **ejecutado** en Supabase
   (`backend/database/migrations/001_create_gastos.sql`). Verificado: tabla con
   7 columnas + índices `gastos_pkey`, `idx_gastos_fecha`, `idx_gastos_categoria`.
   El SQL es idempotente (`IF NOT EXISTS`) — correrlo varias veces es inofensivo.
2. [x] Scaffolding del proyecto NestJS real sobre esta carpeta
3. [x] Entity + módulo + endpoints de `gastos`
4. [ ] Migrar el Shortcut de iOS para que apunte a la nueva API
5. [x] Scaffolding del proyecto Angular
6. [x] Dashboard: balance, gráfico por categoría, histórico mensual
7. [~] Deploy backend en **Render** (en curso), frontend en **Vercel** (pendiente)

## Trabajo verificado (funcionando contra Supabase real)

- Conexión a la DB OK vía `DATABASE_URL` (pooler de Supabase, SSL).
- Todos los endpoints del backend responden:
  - `POST /gastos` crea y devuelve el gasto con `id` + `created_at` generados.
  - `GET /gastos` lista (ordenado por fecha desc).
  - `GET /gastos/resumen` → `{ total, por_categoria: [...] }`.
  - `GET /gastos/resumen/mensual` → `[{ mes: 'YYYY-MM', total }]`.
- Se probó end-to-end creando un gasto de prueba y limpiándolo después.

## Configuración de deploy — Render (backend)

Ya se arrancó la configuración en el dashboard de Render. Valores a completar:
- **Repository**: `Mateiin/app-gastos`
- **Root Directory**: `backend`  ← (el usuario ya lo configuró)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`
- **Runtime**: Node
- **Environment / Env vars**: definir `DATABASE_URL` = connection string real
  de Supabase (el mismo de `backend/.env`). Render NO tiene el `.env` local,
  así que hay que setearla manualmente en Render. También definir `PORT` si hiciera falta
  (Render inyecta el suyo; el app usa `process.env.PORT ?? 3000`).

Pendiente para la próxima sesión:
- Terminar de configurar/desplegar el backend en Render y anotar la URL pública
  (ej. `https://xxx.onrender.com`).
- Sustituir `http://localhost:3000/gastos` por la URL de Render en
  `frontend/src/app/core/services/gastos.service.ts` (línea `baseUrl`).
- Deploy del frontend en Vercel (root `frontend`, build `npm run build`, output `dist/...`).
- Migrar el Shortcut de iOS a la nueva URL de Render.

Nota: el backend no arranca hasta tener `DATABASE_URL` válido en `backend/.env`.
En Render se apunta directamente a su variable de entorno (no usa `.env`).
