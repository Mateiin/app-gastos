const HORA_MS = 3_600_000;
const DIA_MS = 86_400_000;
const ART_A_UTC_HORAS = 3; // Argentina es UTC-3 (sin DST): 23:59 AR = 02:59 UTC+1d
const HITO_ART_MS = 23 * HORA_MS + 59 * 60 * 1000; // 23:59 hora local Argentina
const DIA_OBJETIVO_UTC = 3; // miércoles (JS getUTCDay(): 0=domingo, 3=miércoles)

/**
 * Devuelve los ms que faltan para la próxima meta de revisión de TNA:
 * miércoles 23:59 hora Argentina. La meta queda "anclada" a la última
 * vez que se actualizó el TNA: si esa meta ya pasó, devuelve 0 y se queda
 * en 0 hasta que el usuario vuelva a actualizar el TNA (ahí recomienza).
 */
export function proximaMetaTna(tnaActualizado: string | null | undefined): number {
  if (!tnaActualizado) return 0;

  const ahora = Date.now();
  const t = new Date(tnaActualizado).getTime();

  // Convertir el instante a "hora pizarra de Argentina" (UTC-3).
  const argMs = t - ART_A_UTC_HORAS * HORA_MS;
  const d = new Date(argMs);

  const inicioDiaArg = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
  );

  // Primer miércoles a las 23:59 AR que sea estrictamente posterior a t.
  let dias = (DIA_OBJETIVO_UTC - d.getUTCDay() + 7) % 7;
  const msDelDia = argMs - inicioDiaArg;
  if (dias === 0 && msDelDia >= HITO_ART_MS) dias = 7;

  const meta = inicioDiaArg + dias * DIA_MS + HITO_ART_MS + ART_A_UTC_HORAS * HORA_MS;

  return Math.max(0, meta - ahora);
}

/** Formatea un countdown en "Xd HHh MMm" (o "0" si ya venció). */
export function formatoCuentaAtras(ms: number): string {
  const totalSeg = Math.floor(ms / 1000);
  if (totalSeg <= 0) return '0';

  const d = Math.floor(totalSeg / 86_400);
  const h = Math.floor((totalSeg % 86_400) / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(m, 1)}m`;
}

export function tnaVencido(ms: number): boolean {
  return ms <= 0;
}