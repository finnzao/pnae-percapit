import { useState, useCallback } from 'react';
import { 
  ExportOptions, 
  ExportResult, 
  ExportProgress,
  ExportProgressCallback,
  FormatoExport
} from '@/types/export';
import { GuiaAbastecimento } from '@/types';
import { ExportService } from '@/utils/exportService';

interface UseExportReturn {
  isExporting: boolean;
  progress: ExportProgress | null;
  error: string | null;
  exportGuia: (
    guia: GuiaAbastecimento,
    options: Partial<ExportOptions>,
    onProgress?: ExportProgressCallback
  ) => Promise<ExportResult>;
  clearError: () => void;
}

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateProgress = useCallback((newProgress: ExportProgress, onProgress?: ExportProgressCallback) => {
    setProgress(newProgress);
    onProgress?.(newProgress);
  }, []);

  const exportGuia = useCallback(async (
    guia: GuiaAbastecimento,
    options: Partial<ExportOptions> = {},
    onProgress?: ExportProgressCallback
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setError(null);
    
    try {
      // Configurações padrão
      const defaultOptions: ExportOptions = {
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
        },
        usuario: {
          nome: 'Ana Paula Silva',
          cargo: 'Nutricionista',
          email: 'ana.paula@nutrigestao.com',
          dataExport: new Date()
        }
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Etapa 1: Preparação dos dados
      updateProgress({
        etapa: 'Preparando dados',
        progresso: 10,
        mensagem: 'Processando informações da guia...'
      }, onProgress);

      await new Promise(resolve => setTimeout(resolve, 300));

      // Etapa 2: Validação
      updateProgress({
        etapa: 'Validando dados',
        progresso: 25,
        mensagem: 'Verificando integridade dos dados...'
      }, onProgress);

      if (!guia.calculosDistribuicao || guia.calculosDistribuicao.length === 0) {
        throw new Error('Guia não possui alimentos para exportar');
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      // Etapa 3: Processamento por formato
      updateProgress({
        etapa: 'Processando formato',
        progresso: 50,
        mensagem: `Preparando exportação ${finalOptions.formato}...`
      }, onProgress);

      await new Promise(resolve => setTimeout(resolve, 400));

      // Etapa 4: Geração do arquivo
      updateProgress({
        etapa: 'Gerando arquivo',
        progresso: 75,
        mensagem: 'Criando documento final...'
      }, onProgress);

      const resultado = await ExportService.exportar(guia, finalOptions.formato, finalOptions);

      // Etapa 5: Finalização
      updateProgress({
        etapa: 'Concluído',
        progresso: 100,
        mensagem: 'Exportação realizada com sucesso!'
      }, onProgress);

      await new Promise(resolve => setTimeout(resolve, 500));

      return resultado;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido durante a exportação';
      
      setError(errorMessage);
      updateProgress({
        etapa: 'Erro',
        progresso: 0,
        mensagem: 'Falha na exportação',
        erro: errorMessage
      }, onProgress);

      return {
        sucesso: false,
        erro: errorMessage
      };
    } finally {
      setIsExporting(false);
      setTimeout(() => setProgress(null), 3000);
    }
  }, [updateProgress]);

  return {
    isExporting,
    progress,
    error,
    exportGuia,
    clearError
  };
}

// Hook específico para validação de formatos
export function useExportValidation() {
  const validateOptions = useCallback((options: Partial<ExportOptions>): string[] => {
    const errors: string[] = [];

    if (options.formato && !['TXT', 'XLSX', 'DOCX'].includes(options.formato)) {
      errors.push(`Formato ${options.formato} não é suportado`);
    }

    if (options.usuario) {
      if (!options.usuario.nome?.trim()) {
        errors.push('Nome do usuário é obrigatório');
      }
      if (!options.usuario.cargo?.trim()) {
        errors.push('Cargo do usuário é obrigatório');
      }
    }

    if (options.formatoNumeros) {
      if (options.formatoNumeros.decimais < 0 || options.formatoNumeros.decimais > 10) {
        errors.push('Número de decimais deve estar entre 0 e 10');
      }
    }

    return errors;
  }, []);

  const isFormatSupported = useCallback((formato: FormatoExport): boolean => {
    return ['TXT', 'XLSX', 'DOCX'].includes(formato);
  }, []);

  const getFormatInfo = useCallback((formato: FormatoExport) => {
    const formatInfo = {
      'TXT': {
        nome: 'Texto',
        extensao: '.txt',
        descricao: 'Formato simples, compatível com qualquer sistema',
        vantagens: ['Compatibilidade universal', 'Tamanho pequeno', 'Edição fácil'],
        limitacoes: ['Sem formatação avançada', 'Sem gráficos ou cores']
      },
      'XLSX': {
        nome: 'Excel',
        extensao: '.xlsx',
        descricao: 'Planilha do Excel com formatação e cálculos',
        vantagens: ['Formatação avançada', 'Cálculos automáticos', 'Filtros e ordenação'],
        limitacoes: ['Requer software compatível', 'Arquivo maior']
      },
      'DOCX': {
        nome: 'Word',
        extensao: '.docx',
        descricao: 'Documento do Word com layout profissional',
        vantagens: ['Layout profissional', 'Formatação rica', 'Fácil impressão'],
        limitacoes: ['Requer software compatível', 'Menos flexível para dados']
      }
    };

    return formatInfo[formato] || null;
  }, []);

  return {
    validateOptions,
    isFormatSupported,
    getFormatInfo
  };
}