import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ahorro } from './entities/ahorro.entity';
import { AhorrosService } from './ahorros.service';
import { AhorrosController } from './ahorros.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ahorro])],
  controllers: [AhorrosController],
  providers: [AhorrosService],
  exports: [AhorrosService],
})
export class AhorrosModule {}