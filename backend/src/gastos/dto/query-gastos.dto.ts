import { IsOptional, IsDateString, IsString } from 'class-validator';

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
}
