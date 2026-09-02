import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gasto } from './entities/gasto.entity';
import { GastosService } from './gastos.service';
import { GastosController } from './gastos.controller';
import { AhorrosModule } from '../ahorros/ahorros.module';

@Module({
  imports: [TypeOrmModule.forFeature([Gasto]), AhorrosModule],
  controllers: [GastosController],
  providers: [GastosService],
})
export class GastosModule {}
