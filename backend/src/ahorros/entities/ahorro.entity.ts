import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

const numericTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? value : Number(value)),
};

@Entity('ahorros')
export class Ahorro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  nombre: string;

  @Column('numeric', {
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  monto_inicial: number;

  @Column('numeric', {
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  saldo: number;

  @Column('numeric', {
    precision: 5,
    scale: 2,
    transformer: numericTransformer,
  })
  tna: number;

  @Column('timestamptz')
  fecha_ultimo_interes: Date;

  @Column('timestamptz', { nullable: true })
  tna_actualizado: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}