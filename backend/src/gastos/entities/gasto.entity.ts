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

@Entity('gastos')
export class Gasto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  descripcion: string;

  @Column('date')
  fecha: string;

  @Column('numeric', {
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  monto: number;

  @Column('text')
  categoria: string;

  @Column('text')
  metodo_pago: string;

  @Column('text', { default: 'gasto' })
  tipo: 'gasto' | 'ingreso';

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
