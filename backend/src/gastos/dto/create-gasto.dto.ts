import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateGastoDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsDateString()
  fecha: string;

  @IsNumber()
  @Min(0.01)
  monto: number;

  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsString()
  @IsNotEmpty()
  metodo_pago: string;
}
