import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AhorrosService } from '../../core/services/ahorros.service';
import { Ahorro } from '../../core/models/ahorro.model';
import {
  proximaMetaTna,
  formatoCuentaAtras,
} from '../../core/utils/tna-countdown';

@Component({
  selector: 'app-ahorros-list',
  imports: [FormsModule],
  templateUrl: './ahorros-list.html',
  styleUrl: './ahorros-list.scss',
})
export class AhorrosListComponent implements OnInit, OnDestroy {
  ahorros: Ahorro[] = [];
  cargando = true;

  now = Date.now();
  private timer: ReturnType<typeof setInterval> | null = null;

  form = {
    nombre: '',
    monto_inicial: null as number | null,
    saldo: null as number | null,
    tna: null as number | null,
    rol: 'virtual' as 'virtual' | 'efectivo' | 'otro',
  };
  editandoId: string | null = null;
  guardando = false;
  mostrarForm = false;
  error = '';

  constructor(
    private readonly ahorrosService: AhorrosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.timer = setInterval(() => {
      this.now = Date.now();
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  cargar(): void {
    this.cargando = true;
    this.cdr.markForCheck();
    this.ahorrosService.listar().subscribe({
      next: (res) => {
        this.ahorros = res;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando cuentas', err);
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  abrirNuevo(): void {
    this.editandoId = null;
    this.resetForm();
    this.mostrarForm = true;
    this.cdr.markForCheck();
  }

  abrirEdicion(a: Ahorro): void {
    this.editandoId = a.id;
    this.form = {
      nombre: a.nombre,
      monto_inicial: a.monto_inicial,
      saldo: a.saldo,
      tna: a.tna,
      rol: a.rol ?? 'virtual',
    };
    this.mostrarForm = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  cancelarForm(): void {
    this.mostrarForm = false;
    this.error = '';
  }

  onRolChange(): void {
    if (this.form.rol === 'efectivo') this.form.tna = 0;
  }

  guardar(): void {
    if (!this.form.nombre.trim() || this.form.tna === null) return;
    const tna = this.form.rol === 'efectivo' ? 0 : this.form.tna;

    this.guardando = true;
    this.error = '';
    this.cdr.markForCheck();

    if (this.editandoId) {
      this.ahorrosService
        .actualizar(this.editandoId, {
          nombre: this.form.nombre.trim(),
          saldo: this.form.saldo ?? undefined,
          tna,
          rol: this.form.rol,
        })
        .subscribe({
          next: () => {
            this.guardando = false;
            this.mostrarForm = false;
            this.cargar();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error actualizando cuenta', err);
            this.guardando = false;
            this.error = 'No se pudo actualizar. Intentalo de nuevo.';
            this.cdr.markForCheck();
          },
        });
    } else {
      this.ahorrosService
        .crear({
          nombre: this.form.nombre.trim(),
          monto_inicial: this.form.monto_inicial ?? 0,
          tna,
          rol: this.form.rol,
        })
        .subscribe({
          next: () => {
            this.guardando = false;
            this.mostrarForm = false;
            this.cargar();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error creando cuenta', err);
            this.guardando = false;
            this.error = 'No se pudo guardar. Intentalo de nuevo.';
            this.cdr.markForCheck();
          },
        });
    }
  }

  borrar(a: Ahorro): void {
    if (!confirm(`¿Borrar la cuenta "${a.nombre}"?`)) return;
    this.ahorrosService.eliminar(a.id).subscribe({
      next: () => {
        this.cargar();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error borrando cuenta', err);
        alert('No se pudo borrar. Intentalo de nuevo.');
      },
    });
  }

  formatoNumero(valor: number): string {
    const parts = Math.abs(valor).toFixed(2).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${intPart},${parts[1]}`;
  }

  formatoFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  restanteTna(a: Ahorro): number {
    return a.tna_actualizado ? proximaMetaTna(a.tna_actualizado) : 0;
  }

  cuentaTna(a: Ahorro): string {
    return formatoCuentaAtras(this.restanteTna(a));
  }

  private resetForm(): void {
    this.form = {
      nombre: '',
      monto_inicial: null,
      saldo: null,
      tna: null,
      rol: 'virtual',
    };
  }
}