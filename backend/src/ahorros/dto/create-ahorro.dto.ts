import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreateAhorroDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @Min(0.01)
  monto_inicial: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  tna: number;
}