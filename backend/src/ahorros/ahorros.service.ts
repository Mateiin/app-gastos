import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ahorro } from './entities/ahorro.entity';
import { CreateAhorroDto } from './dto/create-ahorro.dto';
import { UpdateAhorroDto } from './dto/update-ahorro.dto';

const UN_DIA_MS = 86_400_000;

export interface AhorroConInteres extends Ahorro {
  interes_diario: number;
}

@Injectable()
export class AhorrosService {
  constructor(
    @InjectRepository(Ahorro)
    private readonly ahorrosRepo: Repository<Ahorro>,
  ) {}

  create(dto: CreateAhorroDto): Promise<Ahorro> {
    const ahora = new Date();
    const ahorro = this.ahorrosRepo.create({
      nombre: dto.nombre,
      monto_inicial: dto.monto_inicial,
      saldo: dto.monto_inicial,
      tna: dto.tna,
      rol: dto.rol ?? 'virtual',
      fecha_ultimo_interes: ahora,
      tna_actualizado: ahora,
    });
    return this.ahorrosRepo.save(ahorro);
  }

  async findAll(): Promise<AhorroConInteres[]> {
    const ahorros = await this.ahorrosRepo.find({
      order: { created_at: 'DESC' },
    });

    const modificados: Ahorro[] = [];
    const resultado = ahorros.map((a) => {
      const dias = this.hitos4Am(a.fecha_ultimo_interes);
      const conInteres = this.acreditarIntereses(a);
      if (dias > 0) modificados.push(conInteres);
      return {
        ...conInteres,
        interes_diario: this.interesDiario(conInteres.saldo, conInteres.tna),
      };
    });

    if (modificados.length > 0) await this.ahorrosRepo.save(modificados);
    return resultado;
  }

  async getTotal(): Promise<{ total: number }> {
    const ahorros = await this.ahorrosRepo.find();

    const modificados: Ahorro[] = [];
    let total = 0;
    for (const a of ahorros) {
      const dias = this.hitos4Am(a.fecha_ultimo_interes);
      const conInteres = this.acreditarIntereses(a);
      if (dias > 0) modificados.push(conInteres);
      total += conInteres.saldo;
    }

    if (modificados.length > 0) await this.ahorrosRepo.save(modificados);
    return { total: this.redondear(total) };
  }

  async update(id: string, dto: UpdateAhorroDto): Promise<Ahorro> {
    const ahorro = await this.ahorrosRepo.findOneByOrFail({ id }).catch(() => {
      throw new NotFoundException('Ahorro no encontrado');
    });

    this.acreditarIntereses(ahorro);

    if (dto.nombre !== undefined) ahorro.nombre = dto.nombre;
    if (dto.tna !== undefined) {
      ahorro.tna = dto.tna;
      ahorro.tna_actualizado = new Date();
    }
    if (dto.saldo !== undefined) ahorro.saldo = dto.saldo;
    if (dto.rol !== undefined) ahorro.rol = dto.rol;

    return this.ahorrosRepo.save(ahorro);
  }

  async remove(id: string): Promise<{ id: string }> {
    const ahorro = await this.ahorrosRepo.findOneByOrFail({ id }).catch(() => {
      throw new NotFoundException('Ahorro no encontrado');
    });
    await this.ahorrosRepo.remove(ahorro);
    return { id };
  }

  /**
   * Aplica un movimiento (gasto/ingreso) al saldo de la cuenta según el
   * método de pago. Primero capitaliza el interés hasta ahora para no perderlo,
   * luego ajusta el saldo y reinicia la capitalización.
   * Si no existe una cuenta con el rol adecuado, no ajusta nada (solo registro).
   */
  async aplicarMovimiento(
    metodo: string,
    monto: number,
    tipo: 'gasto' | 'ingreso',
  ): Promise<void> {
    const rol = this.rolPorMetodo(metodo);
    if (!rol) return;

    const cuenta = await this.ahorrosRepo.findOne({ where: { rol } });
    if (!cuenta) return;

    this.acreditarIntereses(cuenta);
    const signo = tipo === 'ingreso' ? 1 : -1;
    cuenta.saldo = this.redondear(cuenta.saldo + signo * monto);
    cuenta.fecha_ultimo_interes = new Date();
    await this.ahorrosRepo.save(cuenta);
  }

  private rolPorMetodo(metodo: string): 'efectivo' | 'virtual' | null {
    const normalizado = metodo.trim().toLowerCase();
    // El Shortcut de iOS manda métodos con emoji (ej. "🏦 Transferencia",
    // "💳 Debito"), así que buscamos la palabra clave en lugar de igualar exacto.
    if (normalizado.includes('efectivo')) return 'efectivo';
    if (normalizado.includes('debito') || normalizado.includes('débito')) return 'virtual';
    if (normalizado.includes('transferencia')) return 'virtual';
    if (normalizado.includes('credito') || normalizado.includes('crédito')) return 'virtual';
    return null;
  }

  /* ---- Interés compuesto diario ---- */

  private acreditarIntereses(ahorro: Ahorro): Ahorro {
    const dias = this.hitos4Am(ahorro.fecha_ultimo_interes);
    if (dias <= 0) return ahorro;

    const tasa = this.tasaDiaria(ahorro.tna);
    let saldo = ahorro.saldo;

    for (let i = 0; i < dias; i++) {
      saldo = saldo * (1 + tasa);
    }

    ahorro.saldo = this.redondear(saldo);
    ahorro.fecha_ultimo_interes = new Date();
    return ahorro;
  }

  /**
   * Cuenta cuántas veces ha pasado el hito de las 04:00 hora Argentina
   * (07:00 UTC, ya que Argentina es UTC-3) desde la última capitalización.
   * Replica cómo las billeteras virtuales acreditan el interés a la madrugada.
   */
  private hitos4Am(fecha: Date): number {
    const HITO_UTC_HORA = 7; // 04:00 AR = 07:00 UTC

    const ultimo = new Date(fecha);
    let ahora = new Date();

    // Normalizar al "hito" más reciente anterior a cada instante.
    const hitoAnteriorOIgual = (d: Date): Date => {
      const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      const horaUtc = d.getUTCHours();
      // Si la hora actual UTC ya pasó (o es) 07:00, el hito del día ya pasó.
      // Tomamos la fecha del día actual a las 07:00 UTC.
      if (horaUtc >= HITO_UTC_HORA) {
        return new Date(base + HITO_UTC_HORA * 3600_000);
      }
      // Si no pasó, el último hito fue ayer a las 07:00 UTC.
      return new Date(base - 24 * 3600_000 + HITO_UTC_HORA * 3600_000);
    };

    const hitoFin = hitoAnteriorOIgual(ahora).getTime();
    const hitoInicio = hitoAnteriorOIgual(ultimo).getTime();

    const dias = (hitoFin - hitoInicio) / UN_DIA_MS;
    return Math.max(0, Math.floor(dias));
  }

  private tasaDiaria(tna: number): number {
    return tna / 100 / 365;
  }

  private interesDiario(saldo: number, tna: number): number {
    return this.redondear(saldo * this.tasaDiaria(tna));
  }

  private redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }
}