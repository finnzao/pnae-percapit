import { Etapa } from "./zodSchemas";
import { RestricaoAlimentar } from "./zodSchemas";

export type StatusDisponibilidade =
    | { status: 'disponivel'; valor: number }
    | { status: 'indisponivel' }
    | { status: 'Depende da preparação da receita' };

// Tipo que representa como o dado vem cru do JSON
export interface RawAlimento {
    id?: string; // Permitir undefined no raw
    _createdAt?: string; // Permitir undefined no raw
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
    restricoesAlimentares?: RestricaoAlimentar[];
}

export type RawStatusDisponibilidade = {
    status: string;
    valor?: unknown;
};

export interface AlimentoSelecionado {
    id: string;
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

// Novos tipos para Instituições
export interface Endereco {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}

export interface AlunoAtipico {
    restricaoId: string;
    restricaoNome: string;
    quantidade: number;
}

export interface Instituicao {
    id: string;
    nome: string;
    tipo: TipoInstituicao;
    endereco: Endereco;
    totalAlunos: number;
    alunosAtipicos: AlunoAtipico[];
    dataCadastro: Date;
    dataAtualizacao: Date;
    ativo: boolean;
}

export type TipoInstituicao = 'Escola Municipal' | 'Creche' | 'Escola Estadual' | 'Centro de Educação Infantil';

export enum RestricaoAlimentarEnum {
    ALERGICO_GLUTEN = "ALERGICO_GLUTEN",
    ALERGICO_LACTOSE = "ALERGICO_LACTOSE",
    ALERGICO_FRUTOS_MAR = "ALERGICO_FRUTOS_MAR",
    ALERGICO_AMENDOIM = "ALERGICO_AMENDOIM",
    ALERGICO_SOJA = "ALERGICO_SOJA",
    ALERGICO_OVOS = "ALERGICO_OVOS",
    INTOLERANTE_LACTOSE = "INTOLERANTE_LACTOSE",
    INTOLERANTE_FRUTOSE = "INTOLERANTE_FRUTOSE",
    CELIACO = "CELIACO",
    DIABETES = "DIABETES",
    FENILCETONURIA = "FENILCETONURIA",
    RESTRICAO_CUSTOM = "RESTRICAO_CUSTOM"
}

export const RestricaoAlimentarDescricao: Record<RestricaoAlimentarEnum, string> = {
    [RestricaoAlimentarEnum.ALERGICO_GLUTEN]: "Alérgico a Glúten",
    [RestricaoAlimentarEnum.ALERGICO_LACTOSE]: "Alérgico a Lactose",
    [RestricaoAlimentarEnum.ALERGICO_FRUTOS_MAR]: "Alérgico a Frutos do Mar",
    [RestricaoAlimentarEnum.ALERGICO_AMENDOIM]: "Alérgico a Amendoim",
    [RestricaoAlimentarEnum.ALERGICO_SOJA]: "Alérgico a Soja",
    [RestricaoAlimentarEnum.ALERGICO_OVOS]: "Alérgico a Ovos",
    [RestricaoAlimentarEnum.INTOLERANTE_LACTOSE]: "Intolerante a Lactose",
    [RestricaoAlimentarEnum.INTOLERANTE_FRUTOSE]: "Intolerante a Frutose",
    [RestricaoAlimentarEnum.CELIACO]: "Celíaco",
    [RestricaoAlimentarEnum.DIABETES]: "Diabetes",
    [RestricaoAlimentarEnum.FENILCETONURIA]: "Fenilcetonúria",
    [RestricaoAlimentarEnum.RESTRICAO_CUSTOM]: "Restrição Personalizada"
};

// Tipo para Cardápio completo
export interface Cardapio {
    id: string;
    nome: string;
    descricao: string;
    refeicoes: RefeicaoCardapio[];
    dataCadastro: Date;
    dataAtualizacao: Date;
    ativo: boolean;
}

export interface RefeicaoCardapio {
    id: string;
    nome: string;
    horario?: string;
    alimentos: AlimentoCardapio[];
    ordem: number;
}

export interface AlimentoCardapio {
    nome?: string;
    alimentoId: string;
    quantidade: number;
}

// Tipos para Guia de Abastecimento
export interface GuiaAbastecimento {
    id: string;
    instituicaoId: string;
    instituicaoNome?: string;
    dataInicio: Date;
    dataFim: Date;
    cardapiosDiarios: CardapioDiario[];
    calculosDistribuicao: CalculoDistribuicao[];
    observacoes: string;
    versao: number;
    dataGeracao: Date;
    usuarioGeracao: string;
    status: 'Rascunho' | 'Finalizado' | 'Distribuído';
}

export interface CardapioDiario {
    data: Date;
    cardapioId: string;
    cardapioNome?: string;
}

export interface CalculoDistribuicao {
    alimentoId: string;
    alimentoNome: string;
    quantidadeTotal: number;
    unidadeMedida: string;
    detalhamentoRefeicoes: DetalhamentoRefeicao[];
}

export interface DetalhamentoRefeicao {
    refeicaoId: string;
    refeicaoNome: string;
    quantidade: number;
}