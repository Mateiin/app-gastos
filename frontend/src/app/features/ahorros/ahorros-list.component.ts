import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AhorrosService } from '../../core/services/ahorros.service';
import { Ahorro } from '../../core/models/ahorro.model';

@Component({
  selector: 'app-ahorros-list',
  imports: [FormsModule],
  templateUrl: './ahorros-list.html',
  styleUrl: './ahorros-list.scss',
})
export class AhorrosListComponent implements OnInit {
  ahorros: Ahorro[] = [];
  cargando = true;

  form = {
    nombre: '',
    monto_inicial: null as number | null,
    saldo: null as number | null,
    tna: null as number | null,
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
        console.error('Error cargando ahorros', err);
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
    };
    this.mostrarForm = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  cancelarForm(): void {
    this.mostrarForm = false;
    this.error = '';
  }

  guardar(): void {
    if (!this.form.nombre.trim() || !this.form.tna) return;

    this.guardando = true;
    this.error = '';
    this.cdr.markForCheck();

    if (this.editandoId) {
      this.ahorrosService
        .actualizar(this.editandoId, {
          nombre: this.form.nombre.trim(),
          saldo: this.form.saldo ?? undefined,
          tna: this.form.tna,
        })
        .subscribe({
          next: () => {
            this.guardando = false;
            this.mostrarForm = false;
            this.cargar();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error actualizando ahorro', err);
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
          tna: this.form.tna,
        })
        .subscribe({
          next: () => {
            this.guardando = false;
            this.mostrarForm = false;
            this.cargar();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error creando ahorro', err);
            this.guardando = false;
            this.error = 'No se pudo guardar. Intentalo de nuevo.';
            this.cdr.markForCheck();
          },
        });
    }
  }

  borrar(a: Ahorro): void {
    if (!confirm(`¿Borrar el ahorro "${a.nombre}"?`)) return;
    this.ahorrosService.eliminar(a.id).subscribe({
      next: () => {
        this.cargar();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error borrando ahorro', err);
        alert('No se pudo borrar. Intentalo de nuevo.');
      },
    });
  }

  formatoNumero(valor: number): string {
    const parts = Math.abs(valor).toFixed(2).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${intPart},${parts[1]}`;
  }

  private resetForm(): void {
    this.form = {
      nombre: '',
      monto_inicial: null,
      saldo: null,
      tna: null,
    };
  }
}