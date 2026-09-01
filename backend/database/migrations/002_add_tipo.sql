-- Agrega columna tipo ('gasto' | 'ingreso') a la tabla gastos.
-- Default 'gasto' para no romper el Shortcut de iOS que solo manda gastos.
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'gasto';

CREATE INDEX IF NOT EXISTS idx_gastos_tipo ON gastos (tipo);
