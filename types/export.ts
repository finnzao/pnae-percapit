export interface ExportOptions {
  formato: FormatoExport;
  incluirCabecalho: boolean;
  incluirRodape: boolean;
  incluirAssinatura: boolean;
  incluirObservacoes: boolean;
  agruparPorCategoria: boolean;
  normalizarUnidades: boolean;
  mostrarDetalhamento: boolean;
  usuario?: UsuarioExport;
}

export type FormatoExport = 'TXT' | 'XLSX' | 'DOCX' | 'PDF';

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
  observacoes?: string;
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
  categoria: CategoriaAlimento;
  observacoes?: string;
}

export type CategoriaAlimento = 
  | 'Abastecimento' 
  | 'Hortifrútis' 
  | 'Proteínas' 
  | 'Grãos e Cereais' 
  | 'Laticínios' 
  | 'Outros';

export interface ExportResult {
  sucesso: boolean;
  nomeArquivo?: string;
  urlDownload?: string;
  tamanhoArquivo?: number;
  erro?: string;
  metadata?: ExportMetadata;
}

export interface ExportConfig {
  formatos: {
    [K in FormatoExport]: {
      extensao: string;
      mimeType: string;
      suportado: boolean;
    };
  };
  unidades: {
    peso: UnidadeNormalizada[];
    volume: UnidadeNormalizada[];
    unidade: UnidadeNormalizada[];
  };
  categorias: {
    [key: string]: CategoriaAlimento;
  };
}

export interface DocumentTemplate {
  cabecalho: {
    titulo: string;
    instituicao?: string;
    periodo?: string;
    usuario?: string;
    data?: string;
  };
  secoes: {
    [categoria: string]: ItemExport[];
  };
  rodape: {
    assinatura?: boolean;
    observacoes?: string;
    totalItens?: number;
    dataGeracao?: string;
  };
}

export interface ExportProgress {
  etapa: string;
  progresso: number; // 0-100
  mensagem: string;
  erro?: string;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;