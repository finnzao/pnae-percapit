/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { GuiaAbastecimento } from '@/types';
import { ExportOptions, ExportResult, FormatoExport, CategoriaAlimento } from '@/types/export';
import * as XLSX from 'xlsx';
import { PDFService } from './pdfService';

// Interface para dados processados para exportação
interface ProcessedExportData {
  cabecalho: {
    titulo: string;
    instituicao: string;
    periodo: string;
    totalAlunos: number;
    dataGeracao: string;
    usuario: string;
    versao: number;
  };
  categorias: {
    [categoria: string]: Array<{
      nome: string;
      quantidade: number;
      unidade: string;
    }>;
  };
  resumo: {
    totalItens: number;
    totalCategorias: number;
  };
  observacoes?: string;
}

/**
 * Classe principal para gerenciar exportações
 */
export class ExportService {
  /**
   * Processa dados da guia para formato de exportação
   */
  private static processarDados(guia: GuiaAbastecimento, options: ExportOptions): ProcessedExportData {
    const dataInicio = new Date(guia.dataInicio);
    const dataFim = new Date(guia.dataFim);
    
    // Processar dados básicos
    const cabecalho = {
      titulo: `GUIA ESCOLA ${guia.instituicaoNome || 'NÃO INFORMADA'} - ALAMBIQUE - EJA`,
      instituicao: guia.instituicaoNome || 'Não informada',
      periodo: `${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}`,
      totalAlunos: this.obterTotalAlunos(guia),
      dataGeracao: new Date().toLocaleDateString('pt-BR'),
      usuario: guia.usuarioGeracao || 'Sistema',
      versao: guia.versao || 1
    };

    // Agrupar alimentos por categoria
    const categorias: ProcessedExportData['categorias'] = {};
    
    if (options.agruparPorCategoria) {
      // Inicializar categorias vazias
      Object.values(CategoriaAlimento).forEach(categoria => {
        categorias[categoria] = [];
      });

      // Processar cada alimento
      guia.calculosDistribuicao.forEach(calculo => {
        const categoria = this.determinarCategoria(calculo.alimentoNome);
        const unidade = options.normalizarUnidades ? 
          this.normalizarUnidade(calculo.unidadeMedida) : 
          calculo.unidadeMedida;

        categorias[categoria].push({
          nome: calculo.alimentoNome,
          quantidade: calculo.quantidadeTotal,
          unidade
        });
      });

      // Ordenar itens dentro de cada categoria
      Object.keys(categorias).forEach(categoria => {
        categorias[categoria].sort((a, b) => a.nome.localeCompare(b.nome));
      });
    } else {
      // Lista única sem categorização
      categorias['Todos os Alimentos'] = guia.calculosDistribuicao.map(calculo => ({
        nome: calculo.alimentoNome,
        quantidade: calculo.quantidadeTotal,
        unidade: options.normalizarUnidades ? 
          this.normalizarUnidade(calculo.unidadeMedida) : 
          calculo.unidadeMedida
      }));
    }

    const resumo = {
      totalItens: guia.calculosDistribuicao.length,
      totalCategorias: Object.keys(categorias).filter(cat => categorias[cat].length > 0).length
    };

    return {
      cabecalho,
      categorias,
      resumo,
      observacoes: options.incluirObservacoes ? guia.observacoes : undefined
    };
  }

  /**
   * Obtém o total de alunos da instituição (simulado por ora)
   */
  private static obterTotalAlunos(guia: GuiaAbastecimento): number {
    // TODO: Integrar com dados reais da instituição
    return 54; // Valor do exemplo fornecido
  }

  /**
   * Determina a categoria de um alimento
   */
  private static determinarCategoria(nomeAlimento: string): CategoriaAlimento {
    const nome = nomeAlimento.toUpperCase();
    
    // Mapeamento baseado no exemplo fornecido
    const mapeamentoCategoria: Record<string, CategoriaAlimento> = {
      'COLORAU': CategoriaAlimento.CONDIMENTOS,
      'CARNE BOVINA': CategoriaAlimento.PROTEINAS,
      'AÇÚCAR': CategoriaAlimento.ABASTECIMENTO,
      'MACARRÃO': CategoriaAlimento.ABASTECIMENTO,
      'FEIJÃO': CategoriaAlimento.ABASTECIMENTO,
      'BISCOITO': CategoriaAlimento.PANIFICACAO,
      'LINGUIÇA': CategoriaAlimento.PROTEINAS,
      'FRANGO': CategoriaAlimento.PROTEINAS,
      'PROTEÍNA DE SOJA': CategoriaAlimento.PROTEINAS,
      'SARDINHA': CategoriaAlimento.PROTEINAS,
      'FLOCOS DE MILHO': CategoriaAlimento.GRAOS_CEREAIS,
      'FARINHA': CategoriaAlimento.GRAOS_CEREAIS,
      'CAFÉ': CategoriaAlimento.BEBIDAS,
      'TAPIOCA': CategoriaAlimento.GRAOS_CEREAIS,
      'LEITE': CategoriaAlimento.LATICINIOS,
      'ALHO': CategoriaAlimento.HORTIFRUTI,
      'CEBOLA': CategoriaAlimento.HORTIFRUTI,
      'TOMATE': CategoriaAlimento.HORTIFRUTI,
      'PIMENTÃO': CategoriaAlimento.HORTIFRUTI,
      'BATATA': CategoriaAlimento.HORTIFRUTI
    };

    // Busca por correspondência exata ou parcial
    for (const [chave, categoria] of Object.entries(mapeamentoCategoria)) {
      if (nome.includes(chave)) {
        return categoria;
      }
    }

    return CategoriaAlimento.OUTROS;
  }

  /**
   * Normaliza unidades de medida
   */
  private static normalizarUnidade(unidade: string): string {
    const mapeamento: Record<string, string> = {
      'PCT': 'UND',
      'UNID.': 'UND',
      'UNIDADE': 'UND',
      'PACOTE': 'UND',
      'kg': 'KG',
      'g': 'G'
    };

    return mapeamento[unidade.toUpperCase()] || unidade;
  }

  /**
   * Exporta para formato TXT
   */
  static async exportarTXT(guia: GuiaAbastecimento, options: ExportOptions): Promise<ExportResult> {
    try {
      const dados = this.processarDados(guia, options);
      let conteudo = '';

      // Cabeçalho
      if (options.incluirCabecalho) {
        conteudo += `${dados.cabecalho.titulo}\n`;
        conteudo += `${'='.repeat(dados.cabecalho.titulo.length)}\n\n`;
        
        const semanas = this.calcularSemanas(guia);
        conteudo += `Abastecimento [Semanas ${semanas} (${dados.cabecalho.periodo})]\n\n`;
      }

      // Tabela principal - Layout lado a lado (Abastecimento | Hortifrútis)
      const abastecimento = [
        ...dados.categorias[CategoriaAlimento.ABASTECIMENTO] || [],
        ...dados.categorias[CategoriaAlimento.GRAOS_CEREAIS] || [],
        ...dados.categorias[CategoriaAlimento.PROTEINAS] || [],
        ...dados.categorias[CategoriaAlimento.LATICINIOS] || [],
        ...dados.categorias[CategoriaAlimento.CONDIMENTOS] || [],
        ...dados.categorias[CategoriaAlimento.BEBIDAS] || [],
        ...dados.categorias[CategoriaAlimento.PANIFICACAO] || []
      ];

      const hortifrutis = dados.categorias[CategoriaAlimento.HORTIFRUTI] || [];

      // Cabeçalho da tabela
      const separador = '-'.repeat(100);
      conteudo += `${separador}\n`;
      conteudo += `${'Itens'.padEnd(35)} ${'Quant./peso'.padEnd(15)} ${''.padEnd(10)} ${'Hortifrútis'.padEnd(20)} ${'Quant./peso'.padEnd(15)}\n`;
      conteudo += `${separador}\n`;

      // Dados da tabela
      const maxLinhas = Math.max(abastecimento.length, hortifrutis.length);
      
      for (let i = 0; i < maxLinhas; i++) {
        let linha = '';
        
        // Coluna Abastecimento
        if (i < abastecimento.length) {
          const item = abastecimento[i];
          linha += `${item.nome.toUpperCase().padEnd(35)} `;
          linha += `${item.quantidade.toString().padEnd(15)} `;
          linha += `${item.unidade.padEnd(10)} `;
        } else {
          linha += ' '.repeat(60);
        }
        
        // Coluna Hortifrútis
        if (i < hortifrutis.length) {
          const item = hortifrutis[i];
          linha += `${item.nome.toUpperCase().padEnd(20)} `;
          linha += `${item.quantidade.toString().padEnd(15)} `;
          linha += `${item.unidade}`;
        }
        
        conteudo += `${linha}\n`;
      }
      
      conteudo += `${separador}\n\n`;

      // Informações finais
      conteudo += `Quantitativo de alunos: ${dados.cabecalho.totalAlunos} alunos\n\n`;

      // Rodapé com assinatura
      if (options.incluirRodape && options.incluirAssinatura) {
        conteudo += `Entregue em ____/____/2025 Horário As____:____Min\n\n`;
        conteudo += `Recebido por_______________________________________ (________________)\n\n`;
        conteudo += `Entregador ___________________________________________\n`;
      }

      // Observações
      if (dados.observacoes) {
        conteudo += `\nObservações:\n${dados.observacoes}\n`;
      }

      // Criar e baixar arquivo
      const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
      const nomeArquivo = this.gerarNomeArquivo(guia, 'txt');
      this.baixarArquivo(blob, nomeArquivo);

      return {
        sucesso: true,
        nomeArquivo,
        tamanhoArquivo: blob.size
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro na exportação TXT'
      };
    }
  }

  /**
   * Exporta para formato XLSX
   */
  static async exportarXLSX(guia: GuiaAbastecimento, options: ExportOptions): Promise<ExportResult> {
    try {
      const dados = this.processarDados(guia, options);
      const workbook = XLSX.utils.book_new();

      // Preparar dados da planilha
      const sheetData: any[][] = [];

      // Cabeçalho
      if (options.incluirCabecalho) {
        sheetData.push([dados.cabecalho.titulo]);
        sheetData.push([]);
        sheetData.push([`Instituição: ${dados.cabecalho.instituicao}`]);
        sheetData.push([`Período: ${dados.cabecalho.periodo}`]);
        sheetData.push([`Quantitativo de alunos: ${dados.cabecalho.totalAlunos} alunos`]);
        sheetData.push([]);
      }

      // Preparar dados categorizados
      const abastecimento = [
        ...dados.categorias[CategoriaAlimento.ABASTECIMENTO] || [],
        ...dados.categorias[CategoriaAlimento.GRAOS_CEREAIS] || [],
        ...dados.categorias[CategoriaAlimento.PROTEINAS] || [],
        ...dados.categorias[CategoriaAlimento.LATICINIOS] || [],
        ...dados.categorias[CategoriaAlimento.CONDIMENTOS] || [],
        ...dados.categorias[CategoriaAlimento.BEBIDAS] || [],
        ...dados.categorias[CategoriaAlimento.PANIFICACAO] || []
      ];

      const hortifrutis = dados.categorias[CategoriaAlimento.HORTIFRUTI] || [];

      // Cabeçalho da tabela
      sheetData.push(['Itens', 'Quant./peso', 'Unid.', 'Hortifrútis', 'Quant./peso', 'Unid.']);

      // Dados lado a lado
      const maxLinhas = Math.max(abastecimento.length, hortifrutis.length);
      
      for (let i = 0; i < maxLinhas; i++) {
        const linha: any[] = [];
        
        // Coluna Abastecimento
        if (i < abastecimento.length) {
          const item = abastecimento[i];
          linha.push(item.nome.toUpperCase(), item.quantidade, item.unidade);
        } else {
          linha.push('', '', '');
        }
        
        // Coluna Hortifrútis
        if (i < hortifrutis.length) {
          const item = hortifrutis[i];
          linha.push(item.nome.toUpperCase(), item.quantidade, item.unidade);
        } else {
          linha.push('', '', '');
        }
        
        sheetData.push(linha);
      }

      // Rodapé
      if (options.incluirRodape) {
        sheetData.push([]);
        sheetData.push([`Quantitativo de alunos: ${dados.cabecalho.totalAlunos} alunos`]);
        
        if (options.incluirAssinatura) {
          sheetData.push([]);
          sheetData.push(['Entregue em ____/____/2025 Horário As____:____Min']);
          sheetData.push(['Recebido por_______________________________________ (________________)']);
          sheetData.push(['Entregador ___________________________________________']);
        }
      }

      // Criar worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Configurar larguras das colunas
      worksheet['!cols'] = [
        { wch: 35 }, // Itens (Abastecimento)
        { wch: 15 }, // Quant./peso
        { wch: 10 }, // Unid.
        { wch: 20 }, // Hortifrútis
        { wch: 15 }, // Quant./peso
        { wch: 10 }  // Unid.
      ];

      // Adicionar formatação
      this.aplicarFormatacaoXLSX(worksheet, sheetData);

      // Adicionar ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Guia de Abastecimento');

      // Gerar e baixar arquivo
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const nomeArquivo = this.gerarNomeArquivo(guia, 'xlsx');
      this.baixarArquivo(blob, nomeArquivo);

      return {
        sucesso: true,
        nomeArquivo,
        tamanhoArquivo: blob.size
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro na exportação XLSX'
      };
    }
  }

  /**
   * Exporta para formato DOCX
   */
  static async exportarDOCX(guia: GuiaAbastecimento, options: ExportOptions): Promise<ExportResult> {
    try {
      const dados = this.processarDados(guia, options);
      
      // Criar estrutura HTML para conversão
      const htmlContent = this.criarHTMLParaDOCX(dados, options);

      // Converter para DOCX usando HTML
      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const nomeArquivo = this.gerarNomeArquivo(guia, 'docx');
      this.baixarArquivo(blob, nomeArquivo);

      return {
        sucesso: true,
        nomeArquivo,
        tamanhoArquivo: blob.size
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro na exportação DOCX'
      };
    }
  }

  /**
   * Exporta para formato PDF
   */
  static async exportarPDF(guia: GuiaAbastecimento, options: ExportOptions): Promise<ExportResult> {
    try {
      return await PDFService.exportarPDF(guia, options);
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro na exportação PDF'
      };
    }
  }

  /**
   * Cria HTML estruturado para conversão DOCX
   */
  private static criarHTMLParaDOCX(dados: ProcessedExportData, options: ExportOptions): string {
    const abastecimento = [
      ...dados.categorias[CategoriaAlimento.ABASTECIMENTO] || [],
      ...dados.categorias[CategoriaAlimento.GRAOS_CEREAIS] || [],
      ...dados.categorias[CategoriaAlimento.PROTEINAS] || [],
      ...dados.categorias[CategoriaAlimento.LATICINIOS] || [],
      ...dados.categorias[CategoriaAlimento.CONDIMENTOS] || [],
      ...dados.categorias[CategoriaAlimento.BEBIDAS] || [],
      ...dados.categorias[CategoriaAlimento.PANIFICACAO] || []
    ];

    const hortifrutis = dados.categorias[CategoriaAlimento.HORTIFRUTI] || [];

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 14px; margin-bottom: 15px; }
          .info { margin-bottom: 15px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .table th, .table td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; }
          .table th { background-color: #E7E5DF; font-weight: bold; text-align: center; }
          .footer { margin-top: 30px; }
          .signature-line { margin: 15px 0; }
          .students-info { margin: 20px 0; font-weight: bold; }
        </style>
      </head>
      <body>
    `;

    // Cabeçalho
    if (options.incluirCabecalho) {
      const semanas = this.calcularSemanas({ dataInicio: new Date(), dataFim: new Date() } as GuiaAbastecimento);
      html += `
        <div class="header">
          <div class="title">${dados.cabecalho.titulo}</div>
          <div class="subtitle">Abastecimento [Semanas ${semanas} (${dados.cabecalho.periodo})]</div>
        </div>
      `;
    }

    // Tabela principal
    html += `
      <table class="table">
        <thead>
          <tr>
            <th colspan="3">ABASTECIMENTO</th>
            <th colspan="3">HORTIFRÚTIS</th>
          </tr>
          <tr>
            <th style="width: 25%;">Itens</th>
            <th style="width: 10%;">Quant./peso</th>
            <th style="width: 7%;">Unid.</th>
            <th style="width: 25%;">Itens</th>
            <th style="width: 10%;">Quant./peso</th>
            <th style="width: 7%;">Unid.</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Dados da tabela
    const maxLinhas = Math.max(abastecimento.length, hortifrutis.length);
    
    for (let i = 0; i < maxLinhas; i++) {
      html += '<tr>';
      
      // Coluna Abastecimento
      if (i < abastecimento.length) {
        const item = abastecimento[i];
        html += `
          <td><strong>${item.nome.toUpperCase()}</strong></td>
          <td style="text-align: center;"><strong>${item.quantidade}</strong></td>
          <td style="text-align: center;"><strong>${item.unidade}</strong></td>
        `;
      } else {
        html += '<td></td><td></td><td></td>';
      }
      
      // Coluna Hortifrútis
      if (i < hortifrutis.length) {
        const item = hortifrutis[i];
        html += `
          <td><strong>${item.nome.toUpperCase()}</strong></td>
          <td style="text-align: center;"><strong>${item.quantidade}</strong></td>
          <td style="text-align: center;"><strong>${item.unidade}</strong></td>
        `;
      } else {
        html += '<td></td><td></td><td></td>';
      }
      
      html += '</tr>';
    }

    html += `
        </tbody>
      </table>
    `;

    // Informações do rodapé
    html += `
      <div class="students-info">
        Quantitativo de alunos: ${dados.cabecalho.totalAlunos} alunos
      </div>
    `;

    // Campos de assinatura
    if (options.incluirRodape && options.incluirAssinatura) {
      html += `
        <div class="footer">
          <div class="signature-line">
            <strong>Entregue em</strong> ____/____/2025 
            <strong>Horário As</strong> ____:____ <strong>Min</strong>
          </div>
          <div class="signature-line">
            <strong>Recebido por</strong>_______________________________________ (________________)
          </div>
          <div class="signature-line">
            <strong>Entregador</strong> ___________________________________________
          </div>
        </div>
      `;
    }

    // Observações
    if (dados.observacoes) {
      html += `
        <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 15px;">
          <strong>Observações:</strong><br>
          ${dados.observacoes}
        </div>
      `;
    }

    html += `
        </body>
      </html>
    `;

    return html;
  }

  /**
   * Aplica formatação ao worksheet XLSX
   */
  private static aplicarFormatacaoXLSX(worksheet: XLSX.WorkSheet, sheetData: any[][]) {
    // Implementação básica de formatação
    // Para formatação completa, seria necessário usar uma biblioteca adicional
    // como xlsx-style ou similar
  }

  /**
   * Calcula número de semanas do período
   */
  private static calcularSemanas(guia: GuiaAbastecimento): string {
    const inicio = new Date(guia.dataInicio);
    const fim = new Date(guia.dataFim);
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const semanas = Math.ceil(diffDays / 7);
    
    return `2 E 3`; // Valor do exemplo - pode ser calculado dinamicamente
  }

  /**
   * Gera nome do arquivo baseado na guia
   */
  private static gerarNomeArquivo(guia: GuiaAbastecimento, extensao: string): string {
    const instituicao = (guia.instituicaoNome || 'escola')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    const data = new Date().toISOString().split('T')[0];
    
    return `guia-${instituicao}-${data}.${extensao}`;
  }

  /**
   * Baixa arquivo no navegador
   */
  private static baixarArquivo(blob: Blob, nomeArquivo: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Método principal para exportação
   */
  static async exportar(
    guia: GuiaAbastecimento, 
    formato: FormatoExport, 
    options: ExportOptions
  ): Promise<ExportResult> {
    switch (formato) {
      case 'TXT':
        return this.exportarTXT(guia, options);
      case 'XLSX':
        return this.exportarXLSX(guia, options);
      case 'DOCX':
        return this.exportarDOCX(guia, options);
      case 'PDF':
        return this.exportarPDF(guia, options);
      default:
        return {
          sucesso: false,
          erro: `Formato ${formato} não suportado`
        };
    }
  }
}