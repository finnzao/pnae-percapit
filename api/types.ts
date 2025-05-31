export type Etapa = 'creche' | 'pre' | 'fundamental' | 'medio';

export interface Alimento {
  nome: string;
  fc: number;
  fcc: number;
  perCapita: {
    creche: string;
    pre: string;
    fundamental: string;
    medio: string;
  };
  limitada_menor3?: boolean;
  limitada_todas?: string;
}

export interface ResultadoCalculo {
  alimento: string;
  etapa: Etapa;
  alunos: number;
  brutoPorAluno: number;
  totalBruto: number;
  totalFinal: number;
}
