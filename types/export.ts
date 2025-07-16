import { CategoriaAlimento } from './types';

export { CategoriaAlimento } from './types';
export type CategoriaAlimentoType = CategoriaAlimento;

export interface ExportOptions {
  formato: FormatoExport;
  incluirCabecalho: boolean;
  incluirRodape: boolean;
  incluirAssinatura: boolean;
  incluirObservacoes: boolean;
  agruparPorCategoria: boolean;
  normalizarUnidades: boolean;
  mostrarDetalhamento: boolean;
  categoriasIncluidas: CategoriaExportConfig;
  ordenacaoItens: OrdenacaoExport;
  formatoNumeros: FormatoNumerosConfig;
  usuario?: UsuarioExport;
}

export type FormatoExport = 'TXT' | 'XLSX' | 'DOCX' | 'PDF' | 'CSV';

export interface CategoriaExportConfig {
  incluirTodas: boolean;
  categoriasEspecificas?: {
    abastecimento: boolean;
    hortifrutis: boolean;
    proteinas: boolean;
    graos_cereais: boolean;
    laticinios: boolean;
    bebidas: boolean;
    condimentos: boolean;
    doces_sobremesas: boolean;
    panificacao: boolean;
    conservas: boolean;
    congelados: boolean;
    outros: boolean;
  };
  ordenacaoCustomizada?: string[];
}

export interface OrdenacaoExport {
  tipo: 'alfabetica' | 'quantidade_desc' | 'quantidade_asc' | 'categoria' | 'custom';
  criterioSecundario?: 'alfabetica' | 'quantidade';
  ordenacaoCustomizada?: string[];
}

export interface FormatoNumerosConfig {
  decimais: number;
  separadorMilhar: '.' | ',' | ' ' | '';
  separadorDecimal: '.' | ',';
  mostrarZerosDecimais: boolean;
  formatoUnidade: 'antes' | 'depois' | 'linha_separada';
}

export interface UsuarioExport {
  nome: string;
  cargo: string;
  email?: string;
  dataExport: Date;
}

export interface ExportResult {
  sucesso: boolean;
  nomeArquivo?: string;
  urlDownload?: string;
  tamanhoArquivo?: number;
  tempoProcessamento?: number;
  erro?: string;
  metadata?: ExportMetadata;
  estatisticas?: ExportEstatisticas;
}

export interface ExportMetadata {
  nomeArquivo: string;
  dataGeracao: Date;
  usuario: UsuarioExport;
  versaoSistema: string;
  totalItens: number;
  totalCategorias: number;
  categoriasIncluidas: string[];
  filtrosAplicados?: ExportFiltros;
  observacoes?: string;
}

export interface ExportFiltros {
  quantidadeMinima?: number;
  quantidadeMaxima?: number;
  unidadesEspecificas?: string[];
  itensExcluidos?: string[];
  apenasItensComObservacoes?: boolean;
}

export interface ExportEstatisticas {
  totalItens: number;
  itensPorCategoria: Record<CategoriaAlimento, number>;
  quantidadeTotalPorUnidade: Record<string, number>;
  categoriaComMaisItens: CategoriaAlimento;
  itemComMaiorQuantidade: {
    nome: string;
    quantidade: number;
    unidade: string;
  };
}

export interface ExportProgress {
  etapa: string;
  progresso: number;
  mensagem: string;
  tempoEstimado?: number;
  itensProcessados?: number;
  totalItens?: number;
  erro?: string;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

// Configurações padrão para facilitar o uso
export const EXPORT_DEFAULTS: ExportOptions = {
  formato: 'TXT',
  incluirCabecalho: true,
  incluirRodape: true,
  incluirAssinatura: true,
  incluirObservacoes: true,
  agruparPorCategoria: true,
  normalizarUnidades: true,
  mostrarDetalhamento: false,
  categoriasIncluidas: {
    incluirTodas: true
  },
  ordenacaoItens: {
    tipo: 'categoria',
    criterioSecundario: 'alfabetica'
  },
  formatoNumeros: {
    decimais: 2,
    separadorMilhar: '.',
    separadorDecimal: ',',
    mostrarZerosDecimais: false,
    formatoUnidade: 'depois'
  }
};

// Mapeamento de formatos suportados
export const FORMATOS_SUPORTADOS: Record<FormatoExport, {
  nome: string;
  extensao: string;
  mimeType: string;
  icone: string;
  descricao: string;
}> = {
  TXT: {
    nome: 'Texto',
    extensao: '.txt',
    mimeType: 'text/plain',
    icone: 'FileText',
    descricao: 'Arquivo de texto simples, compatível universalmente'
  },
  XLSX: {
    nome: 'Excel',
    extensao: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    icone: 'Sheet',
    descricao: 'Planilha do Excel com formatação e fórmulas'
  },
  DOCX: {
    nome: 'Word',
    extensao: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    icone: 'FileText',
    descricao: 'Documento do Word com layout profissional'
  },
  PDF: {
    nome: 'PDF',
    extensao: '.pdf',
    mimeType: 'application/pdf',
    icone: 'File',
    descricao: 'Documento PDF pronto para impressão'
  },
  CSV: {
    nome: 'CSV',
    extensao: '.csv',
    mimeType: 'text/csv',
    icone: 'Table',
    descricao: 'Valores separados por vírgula'
  }
};

export const CategoriaUtils = {
  TODAS_CATEGORIAS: [
    CategoriaAlimento.ABASTECIMENTO,
    CategoriaAlimento.HORTIFRUTI,
    CategoriaAlimento.PROTEINAS,
    CategoriaAlimento.GRAOS_CEREAIS,
    CategoriaAlimento.LATICINIOS,
    CategoriaAlimento.BEBIDAS,
    CategoriaAlimento.CONDIMENTOS,
    CategoriaAlimento.DOCES_SOBREMESAS,
    CategoriaAlimento.PANIFICACAO,
    CategoriaAlimento.CONSERVAS,
    CategoriaAlimento.CONGELADOS,
    CategoriaAlimento.OUTROS
  ] as CategoriaAlimento[],

  ORDEM_PADRAO: [
    CategoriaAlimento.ABASTECIMENTO,
    CategoriaAlimento.PROTEINAS,
    CategoriaAlimento.GRAOS_CEREAIS,
    CategoriaAlimento.LATICINIOS,
    CategoriaAlimento.HORTIFRUTI,
    CategoriaAlimento.PANIFICACAO,
    CategoriaAlimento.BEBIDAS,
    CategoriaAlimento.CONDIMENTOS,
    CategoriaAlimento.CONSERVAS,
    CategoriaAlimento.CONGELADOS,
    CategoriaAlimento.DOCES_SOBREMESAS,
    CategoriaAlimento.OUTROS
  ] as CategoriaAlimento[]
} as const;