import { IsOptional, IsDateString, IsString, IsIn } from 'class-validator';

export class QueryGastosDto {
  @IsOptional()
  @IsDateString()
  fecha_desde?: string;

  @IsOptional()
  @IsDateString()
  fecha_hasta?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsIn(['gasto', 'ingreso'])
  tipo?: 'gasto' | 'ingreso';
}
