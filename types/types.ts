import { Etapa } from "./zodSchemas";
import { RestricaoAlimentar } from "./zodSchemas";

export type StatusDisponibilidade =
    | { status: 'disponivel'; valor: number }
    | { status: 'indisponivel' }
    | { status: 'Depende da preparação da receita' };

export enum CategoriaAlimento {
    ABASTECIMENTO = 'Abastecimento',
    HORTIFRUTI = 'Hortifrútis',
    PROTEINAS = 'Proteínas',
    GRAOS_CEREAIS = 'Grãos e Cereais',
    LATICINIOS = 'Laticínios',
    BEBIDAS = 'Bebidas',
    CONDIMENTOS = 'Condimentos e Temperos',
    DOCES_SOBREMESAS = 'Doces e Sobremesas',
    PANIFICACAO = 'Panificação',
    CONSERVAS = 'Conservas e Enlatados',
    CONGELADOS = 'Congelados',
    OUTROS = 'Outros'
}

export const CategoriaAlimentoDescricao: Record<CategoriaAlimento, string> = {
    [CategoriaAlimento.ABASTECIMENTO]: 'Alimentos básicos não perecíveis (arroz, feijão, açúcar, etc.)',
    [CategoriaAlimento.HORTIFRUTI]: 'Frutas, verduras e legumes frescos',
    [CategoriaAlimento.PROTEINAS]: 'Carnes, peixes, ovos e proteínas em geral',
    [CategoriaAlimento.GRAOS_CEREAIS]: 'Grãos, cereais, farinhas e derivados',
    [CategoriaAlimento.LATICINIOS]: 'Leite, queijos, iogurtes e derivados',
    [CategoriaAlimento.BEBIDAS]: 'Sucos, refrigerantes, água e bebidas em geral',
    [CategoriaAlimento.CONDIMENTOS]: 'Temperos, especiarias e condimentos',
    [CategoriaAlimento.DOCES_SOBREMESAS]: 'Doces, sobremesas e guloseimas',
    [CategoriaAlimento.PANIFICACAO]: 'Pães, bolos, biscoitos e produtos de padaria',
    [CategoriaAlimento.CONSERVAS]: 'Alimentos em conserva e enlatados',
    [CategoriaAlimento.CONGELADOS]: 'Alimentos congelados e ultracongelados',
    [CategoriaAlimento.OUTROS]: 'Outros alimentos não classificados acima'
};

// NOVO: Mapeamento automático de nomes para categorias (para migração)
export const MAPEAMENTO_CATEGORIA_AUTOMATICO: Record<string, CategoriaAlimento> = {
    // Abastecimento
    'COLORAU': CategoriaAlimento.ABASTECIMENTO,
    'AÇÚCAR': CategoriaAlimento.ABASTECIMENTO,
    'MACARRÃO': CategoriaAlimento.ABASTECIMENTO,
    'MACARRÃO ESPAGUETE': CategoriaAlimento.ABASTECIMENTO,
    'FEIJÃO': CategoriaAlimento.ABASTECIMENTO,
    'FEIJÃO CARIOCA': CategoriaAlimento.ABASTECIMENTO,
    'ARROZ': CategoriaAlimento.ABASTECIMENTO,
    'BISCOITO SALGADO': CategoriaAlimento.ABASTECIMENTO,
    'FLOCOS DE MILHO': CategoriaAlimento.ABASTECIMENTO,
    'FARINHA DE MANDIOCA': CategoriaAlimento.ABASTECIMENTO,
    'CAFÉ': CategoriaAlimento.ABASTECIMENTO,
    'TAPIOCA SECA': CategoriaAlimento.ABASTECIMENTO,
    'LEITE EM PÓ': CategoriaAlimento.ABASTECIMENTO,
    'SARDINHA': CategoriaAlimento.ABASTECIMENTO,
    'PROTEÍNA DE SOJA': CategoriaAlimento.ABASTECIMENTO,
    'ÓLEO': CategoriaAlimento.ABASTECIMENTO,
    'SAL': CategoriaAlimento.ABASTECIMENTO,
    'VINAGRE': CategoriaAlimento.ABASTECIMENTO,
    
    // Proteínas
    'CARNE BOVINA': CategoriaAlimento.PROTEINAS,
    'CARNE BOVINA (MUSCULO)': CategoriaAlimento.PROTEINAS,
    'MÚSCULO': CategoriaAlimento.PROTEINAS,
    'LINGUIÇA': CategoriaAlimento.PROTEINAS,
    'LINGUIÇA CALABRESA': CategoriaAlimento.PROTEINAS,
    'FRANGO': CategoriaAlimento.PROTEINAS,
    'FRANGO INTEIRO': CategoriaAlimento.PROTEINAS,
    'PEIXE': CategoriaAlimento.PROTEINAS,
    'OVO': CategoriaAlimento.PROTEINAS,
    'OVOS': CategoriaAlimento.PROTEINAS,
    
    // Hortifrútis
    'ALHO': CategoriaAlimento.HORTIFRUTI,
    'CEBOLA': CategoriaAlimento.HORTIFRUTI,
    'TOMATE': CategoriaAlimento.HORTIFRUTI,
    'PIMENTÃO': CategoriaAlimento.HORTIFRUTI,
    'BATATA': CategoriaAlimento.HORTIFRUTI,
    'BATATA INGLESA': CategoriaAlimento.HORTIFRUTI,
    'CENOURA': CategoriaAlimento.HORTIFRUTI,
    'ABOBRINHA': CategoriaAlimento.HORTIFRUTI,
    'ABÓBORA': CategoriaAlimento.HORTIFRUTI,
    'COUVE': CategoriaAlimento.HORTIFRUTI,
    'ALFACE': CategoriaAlimento.HORTIFRUTI,
    'LIMÃO': CategoriaAlimento.HORTIFRUTI,
    'BANANA': CategoriaAlimento.HORTIFRUTI,
    'MAÇÃ': CategoriaAlimento.HORTIFRUTI,
    'LARANJA': CategoriaAlimento.HORTIFRUTI,
    
    // Grãos e cereais
    'MILHO': CategoriaAlimento.GRAOS_CEREAIS,
    'AVEIA': CategoriaAlimento.GRAOS_CEREAIS,
    'QUINOA': CategoriaAlimento.GRAOS_CEREAIS,
    'LENTILHA': CategoriaAlimento.GRAOS_CEREAIS,
    'GRÃO DE BICO': CategoriaAlimento.GRAOS_CEREAIS,
    
    // Laticínios
    'LEITE': CategoriaAlimento.LATICINIOS,
    'QUEIJO': CategoriaAlimento.LATICINIOS,
    'IOGURTE': CategoriaAlimento.LATICINIOS,
    'MANTEIGA': CategoriaAlimento.LATICINIOS,
    'MARGARINA': CategoriaAlimento.LATICINIOS,
    
    // Panificação
    'BISCOITO': CategoriaAlimento.PANIFICACAO,
    'PÃO': CategoriaAlimento.PANIFICACAO,
    'BOLO': CategoriaAlimento.PANIFICACAO,
    
    // Condimentos
    'TEMPERO': CategoriaAlimento.CONDIMENTOS,
    'PIMENTA': CategoriaAlimento.CONDIMENTOS,
    'COMINHO': CategoriaAlimento.CONDIMENTOS,
    'ORÉGANO': CategoriaAlimento.CONDIMENTOS
};

export interface RawAlimento {
    id?: string; 
    _createdAt?: string; 
    nome: string;
    fc: number | string;
    fcc: number | string;
    categoria?: CategoriaAlimento | string;
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