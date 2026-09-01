export type TipoMovimiento = 'gasto' | 'ingreso';

export interface Gasto {
  id: string;
  descripcion: string;
  fecha: string;
  monto: number;
  categoria: string;
  metodo_pago: string;
  tipo: TipoMovimiento;
  created_at?: string;
}

export interface ResumenCategoria {
  categoria: string;
  total: number;
}

export interface Resumen {
  total: number;
  porCategoria: ResumenCategoria[];
}

export interface Saldo {
  saldo: number;
  ingresos: number;
  gastos: number;
}

export interface ResumenMensual {
  mes: string;
  total: number;
  ingresos: number;
  gastos: number;
}
