import { useState, useCallback } from 'react';
import { 
  ExportOptions, 
  ExportResult, 
  ExportProgress,
  ExportProgressCallback,
  FormatoExport,

} from '@/types/export';
import { GuiaAbastecimento } from '@/types';
import { USUARIO_PADRAO } from '@/constants/exportConfig';

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
        usuario: {
          ...USUARIO_PADRAO,
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

      await new Promise(resolve => setTimeout(resolve, 300)); // Simula processamento

      // Etapa 2: Normalização de unidades
      updateProgress({
        etapa: 'Normalizando unidades',
        progresso: 30,
        mensagem: 'Padronizando unidades de medida...'
      }, onProgress);

      const { processarItensExport } = await import('@/utils/exportUtils');
      const itensProcessados = processarItensExport(guia.calculosDistribuicao, finalOptions);

      // Etapa 3: Agrupamento por categoria
      updateProgress({
        etapa: 'Organizando por categoria',
        progresso: 50,
        mensagem: 'Classificando alimentos por categoria...'
      }, onProgress);

      const { agruparPorCategoria } = await import('@/utils/exportUtils');
      const itensAgrupados = agruparPorCategoria(itensProcessados);

      // Etapa 4: Criação do template
      updateProgress({
        etapa: 'Gerando documento',
        progresso: 70,
        mensagem: 'Montando estrutura do documento...'
      }, onProgress);

      const { criarTemplateDocumento } = await import('@/utils/exportUtils');
      const template = criarTemplateDocumento(guia, itensAgrupados, finalOptions);

      // Etapa 5: Exportação no formato desejado
      updateProgress({
        etapa: 'Convertendo para formato',
        progresso: 90,
        mensagem: `Gerando arquivo ${finalOptions.formato}...`
      }, onProgress);

      let resultado: ExportResult;

      switch (finalOptions.formato) {
        case 'TXT':
          const { exportarTXT } = await import('@/utils/exportFormats');
          resultado = await exportarTXT(template, guia, finalOptions);
          break;
        case 'XLSX':
          const { exportarXLSX } = await import('@/utils/exportFormats');
          resultado = await exportarXLSX(template, guia, finalOptions);
          break;
        case 'DOCX':
          const { exportarDOCX } = await import('@/utils/exportFormats');
          resultado = await exportarDOCX(template, guia, finalOptions);
          break;
        default:
          throw new Error(`Formato ${finalOptions.formato} não suportado`);
      }

      // Etapa 6: Finalização
      updateProgress({
        etapa: 'Concluído',
        progresso: 100,
        mensagem: 'Export realizado com sucesso!'
      }, onProgress);

      await new Promise(resolve => setTimeout(resolve, 500)); // Mostra 100% por um momento

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
      // Limpa o progresso após 3 segundos
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

    return errors;
  }, []);

  const isFormatSupported = useCallback((formato: FormatoExport): boolean => {
    return ['TXT', 'XLSX', 'DOCX'].includes(formato);
  }, []);

  return {
    validateOptions,
    isFormatSupported
  };
}