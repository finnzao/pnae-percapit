import { Etapa } from "./zodSchemas";

export type StatusDisponibilidade =
    | { status: 'disponivel'; valor: number }
    | { status: 'indisponivel' }
    | { status: 'Depende da preparação da receita' };

// Tipo que representa como o dado vem cru do JSON
export interface RawAlimento {
    nome: string;
    fc: number | string;
    fcc: number | string;
    perCapita: {
        creche: RawStatusDisponibilidade;
        pre: RawStatusDisponibilidade;
        fundamental: RawStatusDisponibilidade;
        medio: RawStatusDisponibilidade;
    };
    limitada_menor3?: boolean;
    limitada_todas?: boolean;
    unidade_medida?: string;
}

export type RawStatusDisponibilidade = {
    status: string;
    valor?: unknown;
};

export interface AlimentoSelecionado {
    nome: string;
    pesoPacote: number | null;
}

export interface Refeicao {
    nome: string;
    horario: string;
    alimentos: AlimentoSelecionado[];
}

export enum UnidadePeso {
    MG = 'mg',
    G = 'g',
    KG = 'kg',
    TON = 'ton'
}

export enum UnidadeVolume {
    ML = 'ml',
    L = 'l',
    M3 = 'm³'
}

export type UnidadeMedida = UnidadePeso | UnidadeVolume;

export type CategoriaUnidade = 'peso' | 'volume';

// Tipo de retorno do cálculo per capita
export interface ResultadoCalculo {
    alimento: string;
    etapa: Etapa;
    alunos: number;
    brutoPorAluno: number;
    totalBruto: number;
    totalFinal: number;
}