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
    const ahorro = this.ahorrosRepo.create({
      nombre: dto.nombre,
      monto_inicial: dto.monto_inicial,
      saldo: dto.monto_inicial,
      tna: dto.tna,
      fecha_ultimo_interes: new Date(),
    });
    return this.ahorrosRepo.save(ahorro);
  }

  async findAll(): Promise<AhorroConInteres[]> {
    const ahorros = await this.ahorrosRepo.find({
      order: { created_at: 'DESC' },
    });

    const modificados: Ahorro[] = [];
    const resultado = ahorros.map((a) => {
      const dias = this.diasTranscurridos(a.fecha_ultimo_interes);
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
      const dias = this.diasTranscurridos(a.fecha_ultimo_interes);
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
    if (dto.tna !== undefined) ahorro.tna = dto.tna;
    if (dto.saldo !== undefined) ahorro.saldo = dto.saldo;

    return this.ahorrosRepo.save(ahorro);
  }

  async remove(id: string): Promise<{ id: string }> {
    const ahorro = await this.ahorrosRepo.findOneByOrFail({ id }).catch(() => {
      throw new NotFoundException('Ahorro no encontrado');
    });
    await this.ahorrosRepo.remove(ahorro);
    return { id };
  }

  /* ---- Interés compuesto diario ---- */

  private acreditarIntereses(ahorro: Ahorro): Ahorro {
    const dias = this.diasTranscurridos(ahorro.fecha_ultimo_interes);
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

  private diasTranscurridos(fecha: Date): number {
    const ultimo = new Date(fecha);
    const ahora = new Date();
    const inicio =
      Date.UTC(ultimo.getUTCFullYear(), ultimo.getUTCMonth(), ultimo.getUTCDate());
    const fin =
      Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate());
    return Math.floor((fin - inicio) / UN_DIA_MS);
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