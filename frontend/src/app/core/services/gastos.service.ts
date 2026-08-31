import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Gasto, Resumen, ResumenMensual } from '../models/gasto.model';

export interface GastosFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  categoria?: string;
}

@Injectable({ providedIn: 'root' })
export class GastosService {
  private readonly baseUrl = 'https://app-gastos-un8v.onrender.com/gastos';

  constructor(private readonly http: HttpClient) {}

  listar(filtros: GastosFilters = {}): Observable<Gasto[]> {
    let params = new HttpParams();
    if (filtros.fecha_desde) params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params = params.set('fecha_hasta', filtros.fecha_hasta);
    if (filtros.categoria) params = params.set('categoria', filtros.categoria);
    return this.http.get<Gasto[]>(this.baseUrl, { params });
  }

  crear(gasto: Omit<Gasto, 'id' | 'created_at'>): Observable<Gasto> {
    return this.http.post<Gasto>(this.baseUrl, gasto);
  }

  resumen(): Observable<Resumen> {
    return this.http.get<Resumen>(`${this.baseUrl}/resumen`);
  }

  resumenMensual(): Observable<ResumenMensual[]> {
    return this.http.get<ResumenMensual[]>(`${this.baseUrl}/resumen/mensual`);
  }
}
