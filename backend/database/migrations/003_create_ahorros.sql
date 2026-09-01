-- Tabla de ahorros/cuentas remuneradas (ej: billetera virtual con TNA).
-- El saldo va creciendo solo con interés compuesto diario (TNA/365).
CREATE TABLE IF NOT EXISTS ahorros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  monto_inicial NUMERIC(12,2) NOT NULL,
  saldo NUMERIC(12,2) NOT NULL,
  tna NUMERIC(5,2) NOT NULL,
  fecha_ultimo_interes TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ahorros_nombre ON ahorros (nombre);