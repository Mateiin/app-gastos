CREATE TABLE IF NOT EXISTS gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  categoria TEXT NOT NULL,
  metodo_pago TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos (fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos (categoria);
