-- 005: las cuentas (tabla ahorros) pasan a representar TU plata real.
-- Se agrega un rol para vincular movimientos automáticamente:
--   'virtual'  -> se descuenta con Débito / Transferencia / Crédito (bancos)
--   'efectivo' -> se descuenta con el método Efectivo
--   NULL       -> cuenta manual, sin vínculo automático
ALTER TABLE ahorros ADD COLUMN IF NOT EXISTS rol TEXT NULL;

-- Si existía una cuenta Naranja X sin rol, marcarla como virtual.
UPDATE ahorros SET rol = 'virtual'
WHERE rol IS NULL AND (nombre ILIKE '%naranja%' OR nombre ILIKE '%brubank%' OR nombre ILIKE '%virtual%');

-- Seed: cuenta Efectivo arranca con el saldo histórico (ingresos - gastos).
-- Solo se crea si todavía no hay ninguna cuenta de rol 'efectivo'.
INSERT INTO ahorros (nombre, monto_inicial, saldo, tna, fecha_ultimo_interes, tna_actualizado, rol)
SELECT
  'Efectivo',
  COALESCE(hist.saldo, 0),
  COALESCE(hist.saldo, 0),
  0,
  now(),
  now(),
  'efectivo'
FROM (
  SELECT
    COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END), 0) AS saldo
  FROM gastos
) hist
WHERE NOT EXISTS (SELECT 1 FROM ahorros WHERE rol = 'efectivo');

CREATE INDEX IF NOT EXISTS idx_ahorros_rol ON ahorros (rol);
