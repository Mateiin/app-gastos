export interface Ahorro {
  id: string;
  nombre: string;
  monto_inicial: number;
  saldo: number;
  tna: number;
  fecha_ultimo_interes: string;
  interes_diario: number;
  created_at?: string;
}

export interface AhorroTotal {
  total: number;
}