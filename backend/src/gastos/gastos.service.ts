import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gasto } from './entities/gasto.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { QueryGastosDto } from './dto/query-gastos.dto';
import { AhorrosService } from '../ahorros/ahorros.service';

interface ResumenRaw {
  total?: string;
}

interface CategoriaRaw {
  categoria: string;
  total: string;
}

interface MensualRaw {
  mes: string;
  total: string;
  tipo: string;
}

@Injectable()
export class GastosService {
  constructor(
    @InjectRepository(Gasto)
    private readonly gastosRepo: Repository<Gasto>,
    private readonly ahorrosService: AhorrosService,
  ) {}

  async create(dto: CreateGastoDto): Promise<Gasto> {
    const gasto = this.gastosRepo.create({ ...dto, tipo: dto.tipo ?? 'gasto' });
    const guardado = await this.gastosRepo.save(gasto);
    await this.ahorrosService.aplicarMovimiento(
      dto.metodo_pago,
      dto.monto,
      guardado.tipo,
    );
    return guardado;
  }

  async remove(id: string): Promise<{ id: string }> {
    const gasto = await this.gastosRepo.findOneByOrFail({ id }).catch(() => {
      throw new NotFoundException('Movimiento no encontrado');
    });
    await this.ahorrosService.revertirMovimiento(
      gasto.metodo_pago,
      gasto.monto,
      gasto.tipo,
    );
    await this.gastosRepo.remove(gasto);
    return { id };
  }

  async findAll(query: QueryGastosDto): Promise<Gasto[]> {
    const qb = this.gastosRepo.createQueryBuilder('g');

    this.aplicarFiltros(qb, query);

    qb.orderBy('g.fecha', 'DESC');
    return qb.getMany();
  }

  async getSaldo(): Promise<{ saldo: number; ingresos: number; gastos: number }> {
    const qb = this.gastosRepo.createQueryBuilder('g');
    const fila = await qb
      .select(
        "COALESCE(SUM(CASE WHEN g.tipo = 'ingreso' THEN g.monto ELSE 0 END), 0)",
        'ingresos',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN g.tipo = 'gasto' THEN g.monto ELSE 0 END), 0)",
        'gastos',
      )
      .getRawOne<{ ingresos: string; gastos: string }>();

    const ingresos = Number(fila?.ingresos ?? 0);
    const gastos = Number(fila?.gastos ?? 0);
    const { total } = await this.ahorrosService.getTotal();
    return { saldo: total, ingresos, gastos };
  }

  async getResumen(query: QueryGastosDto) {
    const qb = this.gastosRepo.createQueryBuilder('g');
    qb.where('g.tipo = :tipo', { tipo: 'gasto' });

    if (query.fecha_desde) {
      qb.andWhere('g.fecha >= :fecha_desde', {
        fecha_desde: query.fecha_desde,
      });
    }
    if (query.fecha_hasta) {
      qb.andWhere('g.fecha <= :fecha_hasta', {
        fecha_hasta: query.fecha_hasta,
      });
    }

    const total = await qb
      .select('SUM(g.monto)', 'total')
      .getRawOne<ResumenRaw>();

    const porCategoria = await qb
      .select('g.categoria', 'categoria')
      .addSelect('SUM(g.monto)', 'total')
      .groupBy('g.categoria')
      .orderBy('total', 'DESC')
      .getRawMany<CategoriaRaw>();

    return {
      total: Number(total?.total ?? 0),
      porCategoria: porCategoria.map((r) => ({
        categoria: r.categoria,
        total: Number(r.total),
      })),
    };
  }

  async getResumenMensual() {
    const resultados = await this.gastosRepo
      .createQueryBuilder('g')
      .select("TO_CHAR(g.fecha, 'YYYY-MM')", 'mes')
      .addSelect('SUM(g.monto)', 'total')
      .addSelect('g.tipo', 'tipo')
      .groupBy("TO_CHAR(g.fecha, 'YYYY-MM')")
      .addGroupBy('g.tipo')
      .orderBy("TO_CHAR(g.fecha, 'YYYY-MM')", 'ASC')
      .getRawMany<MensualRaw>();

    const mapa = new Map<
      string,
      { mes: string; ingresos: number; gastos: number }
    >();
    for (const r of resultados) {
      const actual = mapa.get(r.mes) ?? {
        mes: r.mes,
        ingresos: 0,
        gastos: 0,
      };
      if (r.tipo === 'ingreso') actual.ingresos += Number(r.total);
      else actual.gastos += Number(r.total);
      mapa.set(r.mes, actual);
    }

    return Array.from(mapa.values()).map((m) => ({
      mes: m.mes,
      total: m.ingresos - m.gastos,
      ingresos: m.ingresos,
      gastos: m.gastos,
    }));
  }

  private aplicarFiltros(
    qb: import('typeorm').SelectQueryBuilder<Gasto>,
    query: QueryGastosDto,
  ) {
    if (query.fecha_desde) {
      qb.andWhere('g.fecha >= :fecha_desde', {
        fecha_desde: query.fecha_desde,
      });
    }
    if (query.fecha_hasta) {
      qb.andWhere('g.fecha <= :fecha_hasta', {
        fecha_hasta: query.fecha_hasta,
      });
    }
    if (query.categoria) {
      qb.andWhere('g.categoria = :categoria', {
        categoria: query.categoria,
      });
    }
    if (query.tipo) {
      qb.andWhere('g.tipo = :tipo', { tipo: query.tipo });
    }
  }
}
