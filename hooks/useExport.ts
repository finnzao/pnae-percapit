import { useState, useCallback } from 'react';
import { GuiaAbastecimento } from '@/types';
import { ExportOptions, ExportResult, FormatoExport, ExportProgress, ExportProgressCallback } from '@/types/export';

// Remover CSV das opções de formato
const FORMATOS_SUPORTADOS = {
  TXT: {
    nome: 'Texto',
    extensao: '.txt',
    descricao: 'Arquivo de texto simples, compatível universalmente',
    vantagens: ['Universal', 'Leve', 'Rápido'],
    limitacoes: ['Sem formatação', 'Básico']
  },
  XLSX: {
    nome: 'Excel',
    extensao: '.xlsx',
    descricao: 'Planilha do Excel com formatação e fórmulas',
    vantagens: ['Formatação rica', 'Fórmulas', 'Gráficos'],
    limitacoes: ['Maior tamanho', 'Requer software']
  },
  DOCX: {
    nome: 'Word',
    extensao: '.docx',
    descricao: 'Documento do Word com layout profissional',
    vantagens: ['Layout profissional', 'Formatação avançada'],
    limitacoes: ['Tamanho médio', 'Requer software']
  },
  PDF: {
    nome: 'PDF',
    extensao: '.pdf',
    descricao: 'Documento PDF pronto para impressão',
    vantagens: ['Preserva layout', 'Universal', 'Impressão'],
    limitacoes: ['Não editável', 'Tamanho maior']
  }
} as const;

export interface UseExportReturn {
  isExporting: boolean;
  progress: ExportProgress | null;
  error: string | null;
  exportGuia: (
    guia: GuiaAbastecimento,
    options: ExportOptions,
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

  const updateProgress = useCallback((newProgress: ExportProgress) => {
    setProgress(newProgress);
  }, []);

  const exportGuia = useCallback(async (
    guia: GuiaAbastecimento,
    options: ExportOptions,
    onProgress?: ExportProgressCallback
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setError(null);
    setProgress(null);

    try {
      // Validar formato
      if (!FORMATOS_SUPORTADOS[options.formato as keyof typeof FORMATOS_SUPORTADOS]) {
        throw new Error(`Formato ${options.formato} não é suportado`);
      }

      // Progresso inicial
      const initialProgress: ExportProgress = {
        etapa: 'Iniciando exportação',
        progresso: 0,
        mensagem: 'Preparando dados para exportação...'
      };
      updateProgress(initialProgress);
      onProgress?.(initialProgress);

      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 500));

      // Progresso: processando dados
      const processingProgress: ExportProgress = {
        etapa: 'Processando dados',
        progresso: 25,
        mensagem: 'Organizando alimentos por categoria...'
      };
      updateProgress(processingProgress);
      onProgress?.(processingProgress);

      await new Promise(resolve => setTimeout(resolve, 300));

      // Progresso: formatando
      const formattingProgress: ExportProgress = {
        etapa: 'Formatando documento',
        progresso: 60,
        mensagem: `Gerando arquivo ${options.formato}...`
      };
      updateProgress(formattingProgress);
      onProgress?.(formattingProgress);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Chamar o serviço de exportação apropriado
      const result = await callExportService(guia, options, updateProgress, onProgress);

      // Progresso final
      const finalProgress: ExportProgress = {
        etapa: 'Concluído',
        progresso: 100,
        mensagem: 'Arquivo gerado com sucesso!'
      };
      updateProgress(finalProgress);
      onProgress?.(finalProgress);

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na exportação';
      setError(errorMessage);
      
      const errorProgress: ExportProgress = {
        etapa: 'Erro',
        progresso: 0,
        mensagem: errorMessage,
        erro: errorMessage
      };
      updateProgress(errorProgress);
      onProgress?.(errorProgress);

      return {
        sucesso: false,
        erro: errorMessage
      };
    } finally {
      setIsExporting(false);
      // Limpar progresso após 3 segundos
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

// Função auxiliar para chamar o serviço de exportação correto
async function callExportService(
  guia: GuiaAbastecimento,
  options: ExportOptions,
  updateProgress: (progress: ExportProgress) => void,
  onProgress?: ExportProgressCallback
): Promise<ExportResult> {
  
  const { ExportService } = await import('@/utils/exportService');
  
  switch (options.formato) {
    case 'TXT':
      return ExportService.exportarTXT(guia, options);
    
    case 'XLSX':
      return ExportService.exportarXLSX(guia, options);
    
    case 'PDF':
      return ExportService.exportarPDF(guia, options);
    
    case 'DOCX':
      return ExportService.exportarDOCX(guia, options);
    
    default:
      throw new Error(`Formato ${options.formato} não implementado`);
  }
}