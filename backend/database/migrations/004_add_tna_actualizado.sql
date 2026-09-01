-- Registra cuándo se actualizó el TNA manualmente (para recordatorios).
ALTER TABLE ahorros ADD COLUMN IF NOT EXISTS tna_actualizado TIMESTAMPTZ NULL;

-- Backfill: si nunca se actualizó manualmente, usar la fecha de creación.
UPDATE ahorros SET tna_actualizado = created_at WHERE tna_actualizado IS NULL;