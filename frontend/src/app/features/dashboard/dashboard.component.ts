import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { GastosService } from '../../core/services/gastos.service';
import { Resumen, ResumenMensual } from '../../core/models/gasto.model';
import { CardComponent } from '../../shared/card/card.component';

@Component({
  selector: 'app-dashboard',
  imports: [CardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  resumen: Resumen | null = null;
  mensual: ResumenMensual[] = [];
  maxMensual = 1;

  constructor(
    private readonly gastosService: GastosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.gastosService.resumen().subscribe({
      next: (res) => {
        this.resumen = res;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando resumen', err),
    });

    this.gastosService.resumenMensual().subscribe({
      next: (res) => {
        this.mensual = res;
        this.maxMensual =
          res.length > 0 ? Math.max(...res.map((r) => r.total)) : 1;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando resumen mensual', err),
    });
  }

  get maximaCategoria(): number {
    const totales = this.resumen?.porCategoria.map((c) => c.total) ?? [];
    return totales.length > 0 ? Math.max(...totales) : 1;
  }

  formatoNumero(valor: number): string {
    return valor.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    });
  }

  porcentajeCategoria(total: number): number {
    return Math.round((total / this.maximaCategoria) * 100);
  }

  porcentajeMensual(total: number): number {
    return Math.round((total / this.maxMensual) * 100);
  }
}
