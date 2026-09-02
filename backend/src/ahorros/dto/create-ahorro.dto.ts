import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateAhorroDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @Min(0)
  monto_inicial: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  tna: number;

  @IsOptional()
  @IsIn(['virtual', 'efectivo', 'otro'])
  rol?: 'virtual' | 'efectivo' | 'otro';
}