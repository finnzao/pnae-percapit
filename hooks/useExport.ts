import { useState, useCallback } from 'react';
import { 
  ExportOptions, 
  ExportResult, 
  ExportProgress,
  ExportProgressCallback,
  FormatoExport,
  ItemExport,
  CategoriaAlimento,
  DocumentTemplate
} from '@/types/export';
import { GuiaAbastecimento } from '@/types';
import { USUARIO_PADRAO, EXPORT_CONFIG } from '@/constants/exportConfig';
import * as XLSX from 'xlsx';
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

  // Função para processar itens da guia para exportação
  const processarItensExport = useCallback((
    calculosDistribuicao: GuiaAbastecimento['calculosDistribuicao'],
    options: ExportOptions
  ): ItemExport[] => {
    return calculosDistribuicao.map(calculo => {
      const unidadeNormalizada = options.normalizarUnidades 
        ? normalizarUnidade(calculo.unidadeMedida)
        : calculo.unidadeMedida;

      const categoria = determinarCategoria(calculo.alimentoNome);

      return {
        nome: calculo.alimentoNome,
        quantidade: calculo.quantidadeTotal,
        unidadeOriginal: calculo.unidadeMedida,
        unidadeNormalizada,
        categoria
      };
    });
  }, []);

  // Função para agrupar itens por categoria
  const agruparPorCategoria = useCallback((itens: ItemExport[]) => {
    const agrupados: Record<CategoriaAlimento, ItemExport[]> = {
      'Abastecimento': [],
      'Hortifrútis': [],
      'Proteínas': [],
      'Grãos e Cereais': [],
      'Laticínios': [],
      'Outros': []
    };

    itens.forEach(item => {
      agrupados[item.categoria].push(item);
    });

    return agrupados;
  }, []);

  // Função para criar template do documento
  const criarTemplateDocumento = useCallback((
    guia: GuiaAbastecimento,
    itensAgrupados: Record<CategoriaAlimento, ItemExport[]>,
    options: ExportOptions
  ): DocumentTemplate => {
    const dataInicio = new Date(guia.dataInicio);
    const dataFim = new Date(guia.dataFim);
    
    return {
      cabecalho: {
        titulo: `GUIA ESCOLA ${guia.instituicaoNome || 'NÃO INFORMADA'}`,
        instituicao: guia.instituicaoNome,
        periodo: `${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}`,
        usuario: options.usuario?.nome,
        data: new Date().toLocaleDateString('pt-BR')
      },
      secoes: itensAgrupados,
      rodape: {
        assinatura: options.incluirAssinatura,
        observacoes: options.incluirObservacoes ? guia.observacoes : undefined,
        totalItens: Object.values(itensAgrupados).flat().length,
        dataGeracao: new Date().toLocaleDateString('pt-BR')
      }
    };
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

      await new Promise(resolve => setTimeout(resolve, 300));

      // Etapa 2: Normalização de unidades
      updateProgress({
        etapa: 'Normalizando unidades',
        progresso: 30,
        mensagem: 'Padronizando unidades de medida...'
      }, onProgress);

      const itensProcessados = processarItensExport(guia.calculosDistribuicao, finalOptions);

      // Etapa 3: Agrupamento por categoria
      updateProgress({
        etapa: 'Organizando por categoria',
        progresso: 50,
        mensagem: 'Classificando alimentos por categoria...'
      }, onProgress);

      const itensAgrupados = agruparPorCategoria(itensProcessados);

      // Etapa 4: Criação do template
      updateProgress({
        etapa: 'Gerando documento',
        progresso: 70,
        mensagem: 'Montando estrutura do documento...'
      }, onProgress);

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
          resultado = await exportarTXT(template, guia, finalOptions);
          break;
        case 'XLSX':
          resultado = await exportarXLSX(template, guia, finalOptions);
          break;
        case 'DOCX':
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
  }, [processarItensExport, agruparPorCategoria, criarTemplateDocumento, updateProgress]);

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

// Funções auxiliares
function normalizarUnidade(unidade: string): string {
  const unidades = EXPORT_CONFIG.unidades;
  
  // Busca em todas as categorias de unidades
  for (const categoria of Object.values(unidades)) {
    const unidadeEncontrada = categoria.find(u => u.original === unidade);
    if (unidadeEncontrada) {
      return unidadeEncontrada.normalizada;
    }
  }
  
  return unidade; // Retorna original se não encontrar
}

function determinarCategoria(nomeAlimento: string): CategoriaAlimento {
  const nomeUpper = nomeAlimento.toUpperCase();
  
  // Busca no mapeamento de categorias
  if (EXPORT_CONFIG.categorias[nomeUpper]) {
    return EXPORT_CONFIG.categorias[nomeUpper];
  }
  
  // Busca por palavras-chave
  for (const [palavra, categoria] of Object.entries(EXPORT_CONFIG.categorias)) {
    if (nomeUpper.includes(palavra)) {
      return categoria;
    }
  }
  
  return 'Outros';
}

// Funções de exportação que devem ser implementadas
async function exportarTXT(
  template: DocumentTemplate,
  guia: GuiaAbastecimento,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    let conteudo = '';
    
    // Cabeçalho
    if (options.incluirCabecalho) {
      conteudo += `${template.cabecalho.titulo}\n`;
      conteudo += `===============================\n\n`;
      if (template.cabecalho.instituicao) {
        conteudo += `Instituição: ${template.cabecalho.instituicao}\n`;
      }
      if (template.cabecalho.periodo) {
        conteudo += `Período: ${template.cabecalho.periodo}\n`;
      }
      conteudo += `\n`;
    }
    
    // Seções por categoria
    for (const [categoria, itens] of Object.entries(template.secoes)) {
      if (itens.length > 0) {
        conteudo += `${categoria.toUpperCase()}\n`;
        conteudo += `${'-'.repeat(categoria.length)}\n`;
        
        itens.forEach(item => {
          conteudo += `${item.nome}: ${item.quantidade.toFixed(2)} ${item.unidadeNormalizada}\n`;
        });
        
        conteudo += `\n`;
      }
    }
    
    // Rodapé
    if (options.incluirRodape) {
      conteudo += `\nEntregue em ___/___/${new Date().getFullYear()} Horário As___:___Min\n`;
      conteudo += `Recebido por: _________________________________\n`;
      conteudo += `Entregador: __________________________________\n`;
    }
    
    // Criar blob e URL para download
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Criar elemento de download
    const link = document.createElement('a');
    link.href = url;
    link.download = `guia-abastecimento-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      sucesso: true,
      nomeArquivo: link.download,
      tamanhoArquivo: blob.size
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro na exportação TXT'
    };
  }
}

async function exportarXLSX(
  template: DocumentTemplate,
  guia: GuiaAbastecimento,
  options: ExportOptions
): Promise<ExportResult> {
  try {

    const workbook = XLSX.utils.book_new();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheetData: any[][] = [];
    
    if (options.incluirCabecalho) {
      sheetData.push([template.cabecalho.titulo]);
      sheetData.push([]);
      if (template.cabecalho.instituicao) {
        sheetData.push([`Instituição: ${template.cabecalho.instituicao}`]);
      }
      if (template.cabecalho.periodo) {
        sheetData.push([`Período: ${template.cabecalho.periodo}`]);
      }
      sheetData.push([]);
    }
    
    sheetData.push(['Item', 'Quantidade', 'Unidade', 'Categoria']);
    
    for (const [categoria, itens] of Object.entries(template.secoes)) {
      itens.forEach(item => {
        sheetData.push([
          item.nome,
          item.quantidade,
          item.unidadeNormalizada,
          categoria
        ]);
      });
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Guia de Abastecimento');
    
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guia-abastecimento-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      sucesso: true,
      nomeArquivo: link.download,
      tamanhoArquivo: blob.size
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro na exportação XLSX'
    };
  }
}

async function exportarDOCX(
  template: DocumentTemplate,
  guia: GuiaAbastecimento,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    // HTML -> DOCX
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 18px; font-weight: bold; }
          .section { margin: 15px 0; }
          .section-title { font-weight: bold; margin-bottom: 10px; }
          .item { margin: 5px 0; }
          .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; }
        </style>
      </head>
      <body>
    `;
    
    // Cabeçalho
    if (options.incluirCabecalho) {
      htmlContent += `
        <div class="header">
          <div class="title">${template.cabecalho.titulo}</div>
          ${template.cabecalho.instituicao ? `<p>Instituição: ${template.cabecalho.instituicao}</p>` : ''}
          ${template.cabecalho.periodo ? `<p>Período: ${template.cabecalho.periodo}</p>` : ''}
        </div>
      `;
    }
    
    // Seções
    for (const [categoria, itens] of Object.entries(template.secoes)) {
      if (itens.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">${categoria.toUpperCase()}</div>
        `;
        
        itens.forEach(item => {
          htmlContent += `
            <div class="item">${item.nome}: ${item.quantidade.toFixed(2)} ${item.unidadeNormalizada}</div>
          `;
        });
        
        htmlContent += `</div>`;
      }
    }
    
    // Rodapé
    if (options.incluirRodape) {
      htmlContent += `
        <div class="footer">
          <p>Entregue em ___/___/${new Date().getFullYear()} Horário As___:___Min</p>
          <p>Recebido por: _________________________________</p>
          <p>Entregador: __________________________________</p>
        </div>
      `;
    }
    
    htmlContent += `</body></html>`;
    
    // Criar blob
    const blob = new Blob([htmlContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guia-abastecimento-${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      sucesso: true,
      nomeArquivo: link.download,
      tamanhoArquivo: blob.size
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro na exportação DOCX'
    };
  }
}