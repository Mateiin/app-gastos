export interface Gasto {
  id: string;
  descripcion: string;
  fecha: string;
  monto: number;
  categoria: string;
  metodo_pago: string;
  created_at: string;
}

export interface ResumenCategoria {
  categoria: string;
  total: number;
}

export interface Resumen {
  total: number;
  por_categoria: ResumenCategoria[];
}

export interface ResumenMensual {
  mes: string;
  total: number;
}
