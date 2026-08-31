import { Component, OnInit } from '@angular/core';

import { GastosService } from '../../core/services/gastos.service';
import { Gasto } from '../../core/models/gasto.model';

@Component({
  selector: 'app-gastos-list',
  imports: [],
  templateUrl: './gastos-list.html',
  styleUrl: './gastos-list.scss',
})
export class GastosListComponent implements OnInit {
  gastos: Gasto[] = [];
  cargando = true;

  constructor(private readonly gastosService: GastosService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.gastosService.listar().subscribe({
      next: (res) => {
        this.gastos = res;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando gastos', err);
        this.cargando = false;
      },
    });
  }

  formatoNumero(valor: number): string {
    return valor.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    });
  }

  formatoFecha(fecha: string): string {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR');
  }
}
