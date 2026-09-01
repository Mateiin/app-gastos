import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Ahorro, AhorroTotal } from '../models/ahorro.model';

export interface CrearAhorro {
  nombre: string;
  monto_inicial: number;
  tna: number;
}

export interface ActualizarAhorro {
  nombre?: string;
  tna?: number;
  saldo?: number;
}

@Injectable({ providedIn: 'root' })
export class AhorrosService {
  private readonly baseUrl = 'https://app-gastos-un8v.onrender.com/ahorros';

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Ahorro[]> {
    return this.http.get<Ahorro[]>(this.baseUrl);
  }

  total(): Observable<AhorroTotal> {
    return this.http.get<AhorroTotal>(`${this.baseUrl}/total`);
  }

  crear(dto: CrearAhorro): Observable<Ahorro> {
    return this.http.post<Ahorro>(this.baseUrl, dto);
  }

  actualizar(id: string, dto: ActualizarAhorro): Observable<Ahorro> {
    return this.http.patch<Ahorro>(`${this.baseUrl}/${id}`, dto);
  }

  eliminar(id: string): Observable<{ id: string }> {
    return this.http.delete<{ id: string }>(`${this.baseUrl}/${id}`);
  }
}