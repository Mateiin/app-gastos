import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { GastosService } from './gastos.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { QueryGastosDto } from './dto/query-gastos.dto';

@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Post()
  create(@Body() dto: CreateGastoDto) {
    return this.gastosService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryGastosDto) {
    return this.gastosService.findAll(query);
  }

  @Get('resumen')
  getResumen(@Query() query: QueryGastosDto) {
    return this.gastosService.getResumen(query);
  }

  @Get('saldo')
  getSaldo() {
    return this.gastosService.getSaldo();
  }

  @Get('resumen/mensual')
  getResumenMensual() {
    return this.gastosService.getResumenMensual();
  }
}
