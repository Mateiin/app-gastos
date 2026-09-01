import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { GastosService } from '../../core/services/gastos.service';
import {
  Gasto,
  Resumen,
  ResumenCategoria,
  ResumenMensual,
  Saldo,
} from '../../core/models/gasto.model';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  saldo: Saldo | null = null;
  resumen: Resumen | null = null;
  mensual: ResumenMensual[] = [];
  movimientos: Gasto[] = [];

  maxMensual = 1;
  maxCategoria = 1;
  gastosHoy = 0;
  ingresosMes = 0;
  gastosMes = 0;

  constructor(
    private readonly gastosService: GastosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const hoy = this.fechaISO(new Date());

    this.gastosService.saldo().subscribe({
      next: (res) => {
        this.saldo = res;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando saldo', err),
    });

    this.gastosService.resumen().subscribe({
      next: (res) => {
        this.resumen = res;
        this.maxCategoria =
          res.porCategoria.length > 0
            ? Math.max(...res.porCategoria.map((c) => c.total))
            : 1;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando resumen', err),
    });

    this.gastosService.resumenMensual().subscribe({
      next: (res) => {
        this.mensual = res;
        this.maxMensual =
          res.length > 0
            ? Math.max(
                1,
                ...res.flatMap((m) => [m.ingresos, m.gastos]),
              )
            : 1;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando resumen mensual', err),
    });

    this.gastosService.listar({ tipo: 'gasto', fecha_desde: hoy }).subscribe({
      next: (res) => {
        this.gastosHoy = res.reduce((acc, g) => acc + g.monto, 0);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando gastos de hoy', err),
    });

    this.gastosService.listar().subscribe({
      next: (res) => {
        this.movimientos = res.slice(0, 8);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando movimientos', err),
    });

    const primerDiaMes = this.primerDiaMesISO();
    this.gastosService.listar({ tipo: 'ingreso', fecha_desde: primerDiaMes }).subscribe({
      next: (res) => {
        this.ingresosMes = res.reduce((acc, g) => acc + g.monto, 0);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando ingresos del mes', err),
    });

    this.gastosService.listar({ tipo: 'gasto', fecha_desde: primerDiaMes }).subscribe({
      next: (res) => {
        this.gastosMes = res.reduce((acc, g) => acc + g.monto, 0);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando gastos del mes', err),
    });
  }

  topCategorias(): ResumenCategoria[] {
    return (this.resumen?.porCategoria ?? []).slice(0, 5);
  }

  formatoNumero(valor: number): string {
    return valor.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    });
  }

  porcentajeCategoria(total: number): number {
    return Math.round((total / this.maxCategoria) * 100);
  }

  porcentajeMensual(valor: number): number {
    return Math.round((valor / this.maxMensual) * 100);
  }

  esPositivo(valor: number): boolean {
    return valor >= 0;
  }

  formatoFecha(fecha: string): string {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    });
  }

  mesCorto(mes: string): string {
    const [anio, mesNum] = mes.split('-');
    const fecha = new Date(Number(anio), Number(mesNum) - 1, 1);
    return fecha.toLocaleDateString('es-AR', { month: 'short' });
  }

  private fechaISO(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
  }

  private primerDiaMesISO(): string {
    const ahora = new Date();
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`;
  }
}
