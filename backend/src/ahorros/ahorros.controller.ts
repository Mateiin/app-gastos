import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { AhorrosService } from './ahorros.service';
import { CreateAhorroDto } from './dto/create-ahorro.dto';
import { UpdateAhorroDto } from './dto/update-ahorro.dto';

@Controller('ahorros')
export class AhorrosController {
  constructor(private readonly ahorrosService: AhorrosService) {}

  @Post()
  create(@Body() dto: CreateAhorroDto) {
    return this.ahorrosService.create(dto);
  }

  @Get()
  findAll() {
    return this.ahorrosService.findAll();
  }

  @Get('total')
  getTotal() {
    return this.ahorrosService.getTotal();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAhorroDto) {
    return this.ahorrosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ahorrosService.remove(id);
  }
}