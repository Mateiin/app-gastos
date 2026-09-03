# AGENTS.md — App de Gastos

Contexto para cualquier agente de código que trabaje en este repo.

## Qué es esto

App personal de control de finanzas personales (ingresos y gastos). Reemplaza
un flujo previo de "Shortcut de iOS → Google Apps Script → Google Sheets" (que
ya funciona) por una arquitectura propia. El Shortcut se va a mantener del
lado del usuario, pero apuntando a la nueva API en vez de a Apps Script.

Además de gastos, ahora soporta **ingresos** y calcula un **saldo** (balance =
ingresos − gastos). El modelo de datos usa una sola tabla `gastos` con una
columna `tipo` (`'gasto' | 'ingreso'`) para ambos conceptos.

## Stack

- **DB**: Supabase (Postgres gestionado en la nube, plan free)
- **Backend**: NestJS + TypeORM, conectado a Supabase vía connection string
- **Frontend**: Angular (dashboard visual: saldo, KPIs, gráficos por categoría,
  histórico mensual, últimos movimientos). **Tema oscuro**.
- **Deploy backend**: Render (Web Service free tier — duerme tras 15 min
  de inactividad, cold start ~20-30s al despertar; aceptable para este caso
  de uso). URL pública: `https://app-gastos-un8v.onrender.com`
- **Deploy frontend**: Vercel (root `frontend`, output `dist/app-gastos-frontend/browser`,
  ver `frontend/vercel.json`)

## Estructura del repo

```
app-gastos/
├── backend/                 # API NestJS
│   ├── database/migrations/ # SQL ejecutado en Supabase (001, 002, 003, 004)
│   └── src/
│       ├── gastos/
│       │   ├── entities/    # Entity de TypeORM: Gasto (incluye tipo)
│       │   ├── dto/         # DTOs de creación/consulta
│       │   ├── gastos.controller.ts
│       │   ├── gastos.service.ts
│       │   └── gastos.module.ts
│       ├── ahorros/
│       │   ├── entities/    # Entity de TypeORM: Ahorro (billetera con TNA)
│       │   ├── dto/         # DTOs de creación/actualización
│       │   ├── ahorros.controller.ts
│       │   ├── ahorros.service.ts  # interés compuesto diario (TNA/365)
│       │   └── ahorros.module.ts
│       ├── app.module.ts
│       └── main.ts          # enableCors + listen(process.env.PORT ?? 3000)
├── frontend/                 # SPA Angular (tema oscuro)
│   ├── vercel.json          # build/output de Vercel (dist/.../browser)
│   └── src/app/
│       ├── app.ts/html/scss # Shell: sidebar oscuro + topbar (estilo Athlos)
│       ├── core/
│       │   ├── services/    # GastosService (baseUrl API de Render)
│       │   └── models/      # Interfaces TS (Gasto, Resumen, Saldo, ...)
│       ├── features/
│       │   ├── dashboard/   # KPIs, gráficos, movimientos, saldo
│       │   └── gastos/      # Listado + alta (sirve para /gastos y /ingresos)
│       └── shared/          # Componentes reutilizables (card)
└── AGENTS.md                 # este archivo
```

## Modelo de datos — tabla `gastos`

| Campo         | Tipo                | Notas                                  |
|---------------|----------------------|-----------------------------------------|
| id            | uuid (PK)            | generado por Postgres                   |
| descripcion   | text                 |                                          |
| fecha         | date                 | fecha real, no texto                    |
| monto         | numeric(12,2)        | siempre positivo (el signo lo da `tipo`)|
| categoria     | text                 | Comida, Transporte, Casa, Entretenimiento, Salud, Compras, Otro |
| metodo_pago   | text                 | Efectivo, Débito, Transferencia, etc.   |
| tipo          | text                 | `'gasto'` (default) o `'ingreso'` (migración 002) |
| created_at    | timestamptz          | default now()                           |

- Saldo = SUM(ingresos) − SUM(gastos). El cálculo siempre vive en el backend.
- Origen del listado de categorías/métodos: son los mismos que ya están
  cargados como opciones fijas en el Shortcut de iOS existente — mantener
  los mismos valores para no romper la migración de datos históricos.
  El formulario del frontend usa `CATEGORIAS`/`METODOS` hardcodeados en
  `gastos-list.component.ts`.

## Modelo de datos — tabla `ahorros`

Billeteras virtuales / cuentas remuneradas que crecen solas con interés.

| Campo                 | Tipo           | Notas                                  |
|-----------------------|----------------|-----------------------------------------|
| id                    | uuid (PK)      | generado por Postgres                   |
| nombre                | text           | ej: "Naranja X"                         |
| monto_inicial         | numeric(12,2)  | saldo al momento de crear               |
| saldo                 | numeric(12,2)  | saldo actual (crece con interés)        |
| tna                   | numeric(5,2)   | tasa nominal anual en % (ej 40.5)       |
| fecha_ultimo_interes  | timestamptz    | se actualiza al capitalizar             |
| tna_actualizado       | timestamptz    | última vez que el usuario editó el TNA  |
| created_at            | timestamptz    | default now()                           |

- El interés se calcula siempre en el backend: compuesto diario
  `saldo × (TNA/100/365)`. Se acredita por cada "hito de las 04:00 hora
  Argentina" (07:00 UTC) transcurrido desde `fecha_ultimo_interes`:
  replicar cómo las billeteras virtuales te pagan el interés a la madrugada
  (antes de las 4 AM el día de hoy aún no cuenta). Se capitaliza (persiste)
  al consultar `GET /ahorros` o `GET /ahorros/total`. Solo crece el saldo:
  NO genera filas en la tabla `gastos`.
- Todo se compara en UTC (07:00 UTC = 04:00 AR fijo, Argentina no usa DST),
  así el interés no depende de la zona horaria del servidor.
- El TNA NO se puede leer de Naranja X (no hay API pública): lo carga el
  usuario (se registra en `tna_actualizado`). Hay un recordatorio con forma
  de cuenta atrás semanal anclada al miércoles 23:59 hora Argentina
  (`core/utils/tna-countdown.ts`): cuando llega a 0 se queda en 0 hasta que
  se vuelve a actualizar el TNA (ahí recomienza hacia el próximo miércoles).
  El dashboard muestra el countdown en un cuadrado constante y la página de
  ahorros un chip por cuenta.

## Endpoints backend — ahorros

- `POST /ahorros` — crea un ahorro. Body: `nombre, monto_inicial, tna`.
  `saldo` inicia igual a `monto_inicial`, `fecha_ultimo_interes` = ahora.
- `GET /ahorros` — lista ahorros (capitaliza intereses primero). Cada item
  incluye `interes_diario` (lo que genera hoy).
- `GET /ahorros/total` — `{ total }` suma de todos los saldos (capitaliza
  primero).
- `PATCH /ahorros/:id` — actualiza `nombre`, `tna` y/o `saldo` (para
  correcciones manuales). Ruta `PATCH` (no `PUT`).
- `DELETE /ahorros/:id` — borra un ahorro.

## Endpoints backend

- `POST /gastos` — crea un movimiento. Body: `descripcion, fecha, monto,
  categoria, metodo_pago, tipo?`. `tipo` es opcional (default `'gasto'`), así
  el Shortcut de iOS sigue funcionando sin cambios. Usado por el Shortcut.
- **IMPORTANTE**: el Shortcut de iOS manda los métodos de pago **con emoji**
  (ej. `"🏦 Transferencia "`, `"💳 Debito"`, `"Efectivo"`), mientras el
  formulario del frontend usa strings limpios (`Efectivo`, `Débito`, ...).
  Cualquier mapeo de método → cuenta debe buscar la palabra clave con
  `includes()` sobre el string en minúsculas (`.trim().toLowerCase().includes('transferencia')`),
  NUNCA igualar el string exacto. Ver `rolPorMetodo` en
  `backend/src/ahorros/ahorros.service.ts` y `rolParaMetodo` en el frontend.
- `DELETE /gastos/:id` — borra un movimiento y **revierte la cuenta**: si era
  un gasto suma el monto de vuelta (porque al crear se descontó), si era un
  ingreso lo resta. La reversa usa el mapeo método→rol igual que el alta.
- `GET /gastos` — lista movimientos (filtros opcionales: `fecha_desde`,
  `fecha_hasta`, `categoria`, `tipo`). Ordenado por fecha desc.
- `GET /gastos/resumen` — `{ total, porCategoria: [{categoria, total}] }`.
  **Solo gastos** (`tipo='gasto'`) y `porCategoria` en **camelCase**.
- `GET /gastos/saldo` — `{ saldo, ingresos, gastos }` (acumulado de todo).
- `GET /gastos/resumen/mensual` — serie por mes:
  `[{ mes: 'YYYY-MM', total, ingresos, gastos }]`, ordenada asc por mes.

Respuestas en camelCase (ej. `porCategoria`). No mezclar snake_case.

## Variables de entorno (backend)

```
DATABASE_URL=            # connection string de Supabase (Postgres)
PORT=3000
```

## Convenciones

- Seguir el mismo estilo que el proyecto Dimundo (NestJS + Angular +
  Postgres) del mismo autor: TypeORM para el ORM, DTOs con
  class-validator, módulos por dominio.
- El backend es la única fuente de verdad para los cálculos de resumen/saldo
  (no replicar lógica de agregación en el frontend).
- Mantener compatibilidad de nombres de campo con lo que ya manda el
  Shortcut (`descripcion`, `fecha`, `monto`, `categoria`, `metodo_pago`).
- Respuestas del API en camelCase.
- **Frontend es Angular zoneless** (sin zone.js): todo `subscribe()` que
  asigne estado a una propiedad de clase debe llamar `this.cdr.markForCheck()`
  (inyectar `ChangeDetectorRef` en el constructor). Ya aplicado en
  `dashboard.component.ts` y `gastos-list.component.ts`. No olvidarlo en
  componentes nuevos.
- Tema oscuro: todas las variables de color viven en `src/styles.scss`
  (`:root`). Usar esas variables CSS (o `color-mix`) en vez de colores
  hardcodeados.
- Formato de montos: `formatoNumero()` en cada componente genera
  `$1.234,56` (miles con `.`, decimales con `,`). No usar `toLocaleString`
  de currency (daba resultados inconsistentes).

## Git / GitHub

- Repo público: https://github.com/Mateiin/app-gastos
- Rama por defecto: `main`. Git local configurado con usuario `Mateiin`
  y email noreply `185133342+Mateiin@users.noreply.github.com`.
- **IMPORTANTE**: `backend/.env` (con el `DATABASE_URL` real de Supabase,
  incluye contraseña) NO se sube a GitHub (está en `.gitignore`).
  Solo se versiona `backend/.env.example` como plantilla. Nunca commitear/enviar el `.env`.

## Estado actual / próximos pasos

1. [x] Tabla `gastos` creada en Supabase (migración `001_create_gastos.sql`).
2. [x] Scaffolding NestJS + entity + endpoints base.
3. [x] Ingresos + saldo: columna `tipo` (migración `002_add_tipo.sql`,
   **ya ejecutada en Supabase**) + endpoint `GET /gastos/saldo`.
4. [x] Dashboard profesional estilo Athlos/Seminario Integrador (tema oscuro,
   KPIs, evolución mensual, gastos por categoría, últimos movimientos, saldo).
5. [x] Páginas Gastos e Ingresos (`/gastos` y `/ingresos`) con alta de
   movimientos y filtro por tipo.
6. [x] Frontend deployado en Vercel, backend en Render
   (`https://app-gastos-un8v.onrender.com`), `baseUrl` ya apunta a Render.
7. [~] Migrar el Shortcut de iOS para que apunte a la nueva API de Render.
8. [x] Ahorros: módulo backend + tabla `ahorros` (migración 003) + página
   `/ahorros` en frontend (alta, editar TNA/saldo, borrar). Interés compuesto
   diario TNA/365 que se acredita según el hito de las 04:00 AR (07:00 UTC):
   el día de hoy suma recién pasadas las 4 AM, replicando a las billeteras
   virtuales (solo crece el saldo, no genera filas de movimientos). Dashboard:
   KPI "Ahorros" + "Patrimonio total" (saldo + ahorros) + cuenta atrás
   constante del TNA (migración 004, `tna_actualizado`).

## Notas de deploy

- Backend (Render): Root Directory `backend`, Build `npm install && npm run
  build`, Start `npm run start:prod`, runtime Node, env `DATABASE_URL` (real,
  la misma de `backend/.env`). Render no tiene el `.env` local: hay que
  setearlo manualmente en su dashboard. `PORT` lo inyecta Render
  (`process.env.PORT ?? 3000`).
- Frontend (Vercel): root `frontend`, build `npm run build`, output
  `dist/app-gastos-frontend/browser` (ver `frontend/vercel.json`). Angular 17+
  con builder `@angular/build:application` meté los bundles en `/browser`.
- CORS está abierto (`app.enableCors()` sin parámetros) en `main.ts`. Más
  adelante restringirlo solo al dominio de Vercel por seguridad.
- `angular.json`: budget `anyComponentStyle` subido a 8kB/16kB porque el
  dashboard SCSS es rico. Verificar que nuevas páginas no superen el warning.
