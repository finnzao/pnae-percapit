// types/export.ts - Versão consolidada e melhorada

import { CategoriaAlimentoType } from '.';

// Re-exporta o enum principal de types.ts para evitar duplicação
export { CategoriaAlimento } from './types';
export type { CategoriaAlimento as CategoriaAlimentoType } from './types';

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

// Nova interface para configurar quais categorias incluir no export
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
  ordenacaoCustomizada?: string[]; // Array com ordem específica das categorias
}

// Configuração de ordenação dos itens
export interface OrdenacaoExport {
  tipo: 'alfabetica' | 'quantidade_desc' | 'quantidade_asc' | 'categoria' | 'custom';
  criterioSecundario?: 'alfabetica' | 'quantidade';
  ordenacaoCustomizada?: string[]; // Para ordenação manual de itens
}

// Configuração de formatação de números
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

// Filtros adicionais para o export
export interface ExportFiltros {
  quantidadeMinima?: number;
  quantidadeMaxima?: number;
  unidadesEspecificas?: string[];
  itensExcluidos?: string[];
  apenasItensComObservacoes?: boolean;
}

export interface UnidadeNormalizada {
  original: string;
  normalizada: string;
  categoria: 'peso' | 'volume' | 'unidade';
  fatorConversao?: number;
}

export interface ItemExport {
  nome: string;
  quantidade: number;
  unidadeOriginal: string;
  unidadeNormalizada: string;
  categoria: CategoriaAlimentoType;
  observacoes?: string;
  prioridade?: number; // Para ordenação custom
  subItens?: ItemExport[]; // Para itens com detalhamento
}

export interface ExportResult {
  sucesso: boolean;
  nomeArquivo?: string;
  urlDownload?: string;
  tamanhoArquivo?: number;
  tempoProcessamento?: number; // em millisegundos
  erro?: string;
  metadata?: ExportMetadata;
  estatisticas?: ExportEstatisticas;
}

// Estatísticas do export gerado
export interface ExportEstatisticas {
  totalItens: number;
  itensPorCategoria: Record<CategoriaAlimentoType, number>;
  quantidadeTotalPorUnidade: Record<string, number>;
  categoriaComMaisItens: CategoriaAlimentoType;
  itemComMaiorQuantidade: {
    nome: string;
    quantidade: number;
    unidade: string;
  };
}

export interface ExportConfig {
  formatos: {
    [K in FormatoExport]: {
      extensao: string;
      mimeType: string;
      suportado: boolean;
      tamanhoMaximo?: number; // em bytes
      observacoes?: string;
    };
  };
  unidades: {
    peso: UnidadeNormalizada[];
    volume: UnidadeNormalizada[];
    unidade: UnidadeNormalizada[];
  };
  categorias: {
    [key: string]: CategoriaAlimentoType;
  };
  templates: {
    [formato in FormatoExport]?: ExportTemplate;
  };
}

// Templates específicos por formato
export interface ExportTemplate {
  cabecalho: TemplateSecao;
  corpo: TemplateSecao;
  rodape: TemplateSecao;
  estilos?: ExportEstilos;
}

export interface TemplateSecao {
  incluir: boolean;
  template: string; // Template string com placeholders
  customizavel: boolean;
}

// Estilos para exports visuais (XLSX, DOCX)
export interface ExportEstilos {
  fontes: {
    titulo: FonteConfig;
    subtitulo: FonteConfig;
    cabecalho: FonteConfig;
    corpo: FonteConfig;
  };
  cores: {
    cabecalho: string;
    linhasAlternadas: boolean;
    bordas: string;
  };
  espacamento: {
    margens: MargenConfig;
    entreLinhas: number;
  };
}

export interface FonteConfig {
  familia: string;
  tamanho: number;
  negrito: boolean;
  italico: boolean;
  cor?: string;
}

export interface MargenConfig {
  superior: number;
  inferior: number;
  esquerda: number;
  direita: number;
}

export interface DocumentTemplate {
  cabecalho: {
    titulo: string;
    instituicao?: string;
    periodo?: string;
    usuario?: string;
    data?: string;
    logoPath?: string; // Para incluir logo da instituição
  };
  secoes: {
    [categoria: string]: ItemExport[];
  };
  rodape: {
    assinatura?: boolean;
    observacoes?: string;
    totalItens?: number;
    dataGeracao?: string;
    informacoesAdicionais?: string[];
  };
  configuracao: {
    mostrarIndices: boolean;
    mostrarTotaisPorCategoria: boolean;
    mostrarResumoFinal: boolean;
    incluirGraficos?: boolean; // Para XLSX
  };
}

export interface ExportProgress {
  etapa: string;
  progresso: number; // 0-100
  mensagem: string;
  tempoEstimado?: number; // em segundos
  itensProcessados?: number;
  totalItens?: number;
  erro?: string;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

// Preset de configurações para exports comuns
export interface ExportPreset {
  id: string;
  nome: string;
  descricao: string;
  configuracao: Partial<ExportOptions>;
  isDefault?: boolean;
  isFavorito?: boolean;
}

// Configurações específicas por tipo de instituição
export interface ConfiguracaoInstituicional {
  tipoInstituicao: 'creche' | 'escola_municipal' | 'escola_estadual' | 'cei';
  configuracoesPadrao: ExportOptions;
  templatePersonalizado?: Partial<DocumentTemplate>;
  categoriasObrigatorias: CategoriaAlimentoType[];
  categoriasOpcionais: CategoriaAlimentoType[];
}

// Validação de export
export interface ExportValidationResult {
  valido: boolean;
  avisos: ExportValidationMessage[];
  erros: ExportValidationMessage[];
  sugestoes: ExportValidationMessage[];
}

export interface ExportValidationMessage {
  tipo: 'erro' | 'aviso' | 'sugestao';
  campo?: string;
  mensagem: string;
  codigoErro?: string;
}

// Histórico de exports
export interface ExportHistorico {
  id: string;
  dataExport: Date;
  usuario: string;
  configuracao: ExportOptions;
  resultado: Pick<ExportResult, 'sucesso' | 'nomeArquivo' | 'tamanhoArquivo'>;
  guiaId: string;
  instituicaoNome: string;
}

// Configurações de sistema para exports
export interface ExportSystemConfig {
  limiteTamanhoArquivo: number;
  limiteConcorrencia: number;
  tempoTimeoutExport: number;
  formatsDisponiveis: FormatoExport[];
  presetsDisponiveis: ExportPreset[];
  validacaoObrigatoria: boolean;
}

// Utilitários para trabalhar com categorias
export namespace CategoriaUtils {
  export const TODAS_CATEGORIAS: CategoriaAlimentoType[] = [
    'Abastecimento',
    'Hortifrútis', 
    'Proteínas',
    'Grãos e Cereais',
    'Laticínios',
    'Bebidas',
    'Condimentos e Temperos',
    'Doces e Sobremesas',
    'Panificação',
    'Conservas e Enlatados',
    'Congelados',
    'Outros'
  ];

  export const CATEGORIAS_ESSENCIAIS: CategoriaAlimentoType[] = [
    'Abastecimento',
    'Hortifrútis',
    'Proteínas',
    'Laticínios'
  ];

  export const ORDEM_PADRAO: CategoriaAlimentoType[] = [
    'Abastecimento',
    'Proteínas',
    'Grãos e Cereais',
    'Laticínios',
    'Hortifrútis',
    'Panificação',
    'Bebidas',
    'Condimentos e Temperos',
    'Conservas e Enlatados',
    'Congelados',
    'Doces e Sobremesas',
    'Outros'
  ];
}

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

// Presets comuns
export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: 'padrao_completo',
    nome: 'Completo (Todas as categorias)',
    descricao: 'Export completo com todas as categorias organizadas',
    configuracao: EXPORT_DEFAULTS,
    isDefault: true
  },
  {
    id: 'apenas_abastecimento',
    nome: 'Apenas Abastecimento',
    descricao: 'Somente itens de abastecimento (não perecíveis)',
    configuracao: {
      ...EXPORT_DEFAULTS,
      categoriasIncluidas: {
        incluirTodas: false,
        categoriasEspecificas: {
          abastecimento: true,
          hortifrutis: false,
          proteinas: false,
          graos_cereais: false,
          laticinios: false,
          bebidas: false,
          condimentos: false,
          doces_sobremesas: false,
          panificacao: false,
          conservas: false,
          congelados: false,
          outros: false
        }
      }
    }
  },
  {
    id: 'pereciveis',
    nome: 'Produtos Perecíveis',
    descricao: 'Hortifrútis, proteínas e laticínios',
    configuracao: {
      ...EXPORT_DEFAULTS,
      categoriasIncluidas: {
        incluirTodas: false,
        categoriasEspecificas: {
          abastecimento: false,
          hortifrutis: true,
          proteinas: true,
          graos_cereais: false,
          laticinios: true,
          bebidas: false,
          condimentos: false,
          doces_sobremesas: false,
          panificacao: false,
          conservas: false,
          congelados: false,
          outros: false
        }
      }
    }
  }
];