import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { GastosService } from '../../core/services/gastos.service';
import {
  Gasto,
  TipoMovimiento,
} from '../../core/models/gasto.model';
import { AhorrosService } from '../../core/services/ahorros.service';
import { Ahorro } from '../../core/models/ahorro.model';

const CATEGORIAS_GASTO = [
  'Comida',
  'Transporte',
  'Casa',
  'Entretenimiento',
  'Salud',
  'Compras',
  'Otro',
];

const CATEGORIAS_INGRESO = [
  'Sueldo',
  'Freelance',
  'Inversiones',
  'Otros',
];

const METODOS = [
  'Efectivo',
  'Débito',
  'Transferencia',
  'Crédito',
];

@Component({
  selector: 'app-gastos-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './gastos-list.html',
  styleUrl: './gastos-list.scss',
})
export class GastosListComponent implements OnInit {
  gastos: Gasto[] = [];
  cuentas: Ahorro[] = [];
  cargando = true;

  tipo: TipoMovimiento = 'gasto';
  esIngresos = false;

  form = {
    descripcion: '',
    monto: null as number | null,
    categoria: CATEGORIAS_GASTO[0],
    metodo_pago: METODOS[0],
    fecha: this.hoyISO(),
  };
  guardando = false;
  mostrarForm = false;
  error = '';

  protected readonly categoriasGasto = CATEGORIAS_GASTO;
  protected readonly categoriasIngreso = CATEGORIAS_INGRESO;
  protected readonly metodos = METODOS;

  constructor(
    private readonly gastosService: GastosService,
    private readonly ahorrosService: AhorrosService,
    private readonly cdr: ChangeDetectorRef,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.cargarCuentas();
    this.route.url.subscribe({
      next: (seg) => {
        this.esIngresos = seg[0]?.path === 'ingresos';
        this.tipo = this.esIngresos ? 'ingreso' : 'gasto';
        this.cargar();
        this.cdr.markForCheck();
      },
    });
  }

  cargarCuentas(): void {
    this.ahorrosService.listar().subscribe({
      next: (res) => {
        this.cuentas = res;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando cuentas', err),
    });
  }

  cargar(): void {
    this.cargando = true;
    this.cdr.markForCheck();
    this.gastosService.listar({ tipo: this.tipo }).subscribe({
      next: (res) => {
        this.gastos = res;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando movimientos', err);
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  abrirForm(): void {
    this.mostrarForm = true;
    this.resetForm();
    this.cdr.markForCheck();
  }

  cancelarForm(): void {
    this.mostrarForm = false;
    this.error = '';
  }

  rolParaMetodo(metodo: string): 'efectivo' | 'virtual' | null {
    const m = metodo.trim().toLowerCase();
    if (m === 'efectivo') return 'efectivo';
    if (m === 'débito' || m === 'debito') return 'virtual';
    if (m === 'transferencia') return 'virtual';
    if (m === 'crédito' || m === 'credito') return 'virtual';
    return null;
  }

  cuentaVinculada(): Ahorro | null {
    const rol = this.rolParaMetodo(this.form.metodo_pago);
    if (!rol) return null;
    return this.cuentas.find((c) => c.rol === rol) ?? null;
  }

  guardar(): void {
    if (!this.form.descripcion.trim() || !this.form.monto) return;

    this.guardando = true;
    this.error = '';
    this.cdr.markForCheck();

    this.gastosService
      .crear({
        descripcion: this.form.descripcion.trim(),
        monto: this.form.monto,
        categoria: this.form.categoria,
        metodo_pago: this.form.metodo_pago,
        fecha: this.form.fecha,
        tipo: this.tipo,
      })
      .subscribe({
        next: () => {
          this.guardando = false;
          this.mostrarForm = false;
          this.resetForm();
          this.cargar();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error creando movimiento', err);
          this.guardando = false;
          this.error = 'No se pudo guardar. Intentalo de nuevo.';
          this.cdr.markForCheck();
        },
      });
  }

  formatoNumero(valor: number): string {
    const num = Number(valor);
    const parts = num.toFixed(2).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${intPart},${parts[1]}`;
  }

  formatoFecha(fecha: string): string {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR');
  }

  private resetForm(): void {
    const cats = this.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;
    this.form = {
      descripcion: '',
      monto: null,
      categoria: cats[0],
      metodo_pago: METODOS[0],
      fecha: this.hoyISO(),
    };
  }

  private hoyISO(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
