/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Usuario {
    id: string;
    nome: string;
    email: string;
    cargo: string;
    avatar?: string;
    telefone?: string;
    dataUltimoLogin: Date;
    dataCadastro: Date;
    dataAtualizacao: Date;
    ativo: boolean;
    emailVerificado: boolean;
    configuracoes: ConfiguracoesUsuario;
    permissoes: PermissaoUsuario[];
    sessoes: SessaoUsuario[];
  }
  
  export interface ConfiguracoesUsuario {

    notificacoesEmail: boolean;
    notificacoesPush: boolean;
    notificacoesDesktop: boolean;
    
    temaEscuro: boolean;
    idiomaPreferido: string;
    fusoHorario: string;
    formatoData: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    formatoHora: '12h' | '24h';
    

    autoSave: boolean;
    autoLogout: number; // em minutos
    confirmacaoAcoes: boolean;
    

    perfilPublico: boolean;
    compartilharAtividade: boolean;
    analytics: boolean;
    
    autenticacaoDoisFatores: boolean;
    sessaoUnica: boolean;
    tentativasLoginMax: number;
    logAcessos: boolean;
  }
  
  export interface PermissaoUsuario {
    id: string;
    nome: string;
    descricao: string;
    categoria: 'leitura' | 'escrita' | 'admin' | 'especial';
    ativa: boolean;
  }
  
  export interface SessaoUsuario {
    id: string;
    dispositivoNome: string;
    dispositivoTipo: 'desktop' | 'mobile' | 'tablet';
    navegador: string;
    ip: string;
    localizacao?: string;
    dataLogin: Date;
    ultimaAtividade: Date;
    ativa: boolean;
  }
  
  export interface AlterarSenhaRequest {
    senhaAtual: string;
    novaSenha: string;
    confirmarSenha: string;
    forcarLogoutOutrosSessoes?: boolean;
  }
  
  export interface AtualizarPerfilRequest {
    nome?: string;
    email?: string;
    telefone?: string;
    cargo?: string;
    configuracoes?: Partial<ConfiguracoesUsuario>;
  }
  
  export interface ExportarDadosResponse {
    perfil: Omit<Usuario, 'configuracoes'>;
    configuracoes: ConfiguracoesUsuario;
    atividades: AtividadeUsuario[];
    estatisticas: EstatisticasUsuario;
    metadados: {
      versaoExport: string;
      dataExport: Date;
      tipoExport: 'completo' | 'basico';
    };
  }
  
  export interface AtividadeUsuario {
    id: string;
    tipo: 'login' | 'logout' | 'criar_cardapio' | 'gerar_guia' | 'calcular_percapita' | 'alterar_perfil';
    descricao: string;
    data: Date;
    ip?: string;
    dispositivo?: string;
    detalhes?: Record<string, any>;
  }
  
  export interface EstatisticasUsuario {
    totalLogins: number;
    cardapiosCriados: number;
    guiasGeradas: number;
    calculosRealizados: number;
    tempoTotalUso: number; // em minutos
    ultimosPeriodos: {
      periodo: string;
      atividades: number;
    }[];
  }
  
  export interface ConfiguracaoSeguranca {
    autenticacaoDoisFatores: {
      ativa: boolean;
      metodo: 'sms' | 'app' | 'email';
      configuradoEm?: Date;
    };
    sessaoUnica: boolean;
    logoutAutomatico: number;
    tentativasLogin: number;
    logAcessos: boolean;
    bloqueioTemporario: {
      ativo: boolean;
      tentativasRestantes: number;
      desbloqueioEm?: Date;
    };
  }
  
  export interface NotificacaoUsuario {
    id: string;
    tipo: 'info' | 'aviso' | 'erro' | 'sucesso';
    titulo: string;
    mensagem: string;
    data: Date;
    lida: boolean;
    acao?: {
      texto: string;
      url: string;
    };
  }
  
  // Tipos para validação e formulários
  export interface ValidacaoPerfil {
    nome: {
      valido: boolean;
      erro?: string;
    };
    email: {
      valido: boolean;
      erro?: string;
    };
    telefone: {
      valido: boolean;
      erro?: string;
    };
  }
  
  export interface ValidacaoSenha {
    senha: {
      valida: boolean;
      forca: 'fraca' | 'media' | 'forte';
      criterios: {
        tamanhoMinimo: boolean;
        letraMaiuscula: boolean;
        letraMinuscula: boolean;
        numero: boolean;
        caracterEspecial: boolean;
      };
    };
    confirmacao: {
      valida: boolean;
      erro?: string;
    };
  }
  
  // Tipos para preferências de sistema
  export interface PreferenciasInterface {
    tema: 'claro' | 'escuro' | 'auto';
    idioma: string;
    fusoHorario: string;
    moeda: string;
    unidadeMedida: 'metric' | 'imperial';
    formatoNumero: string;
  }
  
  // Tipos para auditoria e logs
  export interface LogAuditoria {
    id: string;
    usuarioId: string;
    acao: string;
    recurso: string;
    dadosAnteriores?: Record<string, any>;
    dadosNovos?: Record<string, any>;
    ip: string;
    userAgent: string;
    data: Date;
    sucesso: boolean;
    erro?: string;
  }
  
  // Tipos para API responses
  export interface ApiResponse<T> {
    sucesso: boolean;
    dados?: T;
    erro?: {
      codigo: string;
      mensagem: string;
      detalhes?: Record<string, any>;
    };
    metadados?: {
      timestamp: Date;
      versao: string;
      requestId: string;
    };
  }
  
  export type PerfilApiResponse = ApiResponse<Usuario>;
  export type AtualizarPerfilResponse = ApiResponse<Usuario>;
  export type AlterarSenhaResponse = ApiResponse<{ sucesso: boolean }>;
  export type ExportarDadosApiResponse = ApiResponse<ExportarDadosResponse>;
  
  // Enums para facilitar o uso
  export enum TipoNotificacao {
    EMAIL = 'email',
    PUSH = 'push',
    DESKTOP = 'desktop',
    SMS = 'sms'
  }
  
  export enum TipoPermissao {
    LEITURA = 'leitura',
    ESCRITA = 'escrita',
    ADMIN = 'admin',
    ESPECIAL = 'especial'
  }
  
  export enum StatusUsuario {
    ATIVO = 'ativo',
    INATIVO = 'inativo',
    SUSPENSO = 'suspenso',
    BLOQUEADO = 'bloqueado'
  }
  
  export enum TipoDispositivo {
    DESKTOP = 'desktop',
    MOBILE = 'mobile',
    TABLET = 'tablet'
  }
  
  // Tipos utilitários
  export type CamposEditaveis = Pick<Usuario, 'nome' | 'email' | 'telefone' | 'cargo'>;
  export type ConfiguracoesEditaveis = Partial<ConfiguracoesUsuario>;
  export type DadosExportacao = Omit<Usuario, 'senha' | 'configuracoes'> & {
    configuracoes: ConfiguracoesUsuario;
    atividades: AtividadeUsuario[];
  };