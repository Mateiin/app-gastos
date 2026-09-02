import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class UpdateAhorroDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tna?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saldo?: number;

  @IsOptional()
  @IsIn(['virtual', 'efectivo', 'otro'])
  rol?: 'virtual' | 'efectivo' | 'otro';
}