import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gasto } from './entities/gasto.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { QueryGastosDto } from './dto/query-gastos.dto';

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
}

@Injectable()
export class GastosService {
  constructor(
    @InjectRepository(Gasto)
    private readonly gastosRepo: Repository<Gasto>,
  ) {}

  create(dto: CreateGastoDto): Promise<Gasto> {
    const gasto = this.gastosRepo.create(dto);
    return this.gastosRepo.save(gasto);
  }

  async findAll(query: QueryGastosDto): Promise<Gasto[]> {
    const qb = this.gastosRepo.createQueryBuilder('g');

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

    qb.orderBy('g.fecha', 'DESC');
    return qb.getMany();
  }

  async getResumen(query: QueryGastosDto) {
    const qb = this.gastosRepo.createQueryBuilder('g');

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
      .groupBy("TO_CHAR(g.fecha, 'YYYY-MM')")
      .orderBy("TO_CHAR(g.fecha, 'YYYY-MM')", 'ASC')
      .getRawMany<MensualRaw>();

    return resultados.map((r) => ({
      mes: r.mes,
      total: Number(r.total),
    }));
  }
}
