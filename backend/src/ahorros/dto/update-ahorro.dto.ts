import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
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
}