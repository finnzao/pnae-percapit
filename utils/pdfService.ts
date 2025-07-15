import { GuiaAbastecimento } from '@/types';
import { ExportOptions, ExportResult } from '@/types/export';

/**
 * Serviço de exportação para PDF usando jsPDF
 * Este serviço cria PDFs profissionais com layout otimizado para impressão
 */
export class PDFExportService {
  private static readonly FONTS = {
    normal: 'helvetica',
    bold: 'helvetica-bold'
  };

  private static readonly COLORS = {
    primary: '#4C6E5D',
    secondary: '#6B7F66',
    text: '#333333',
    lightGray: '#E7E5DF',
    border: '#CCCCCC'
  };

  private static readonly MARGINS = {
    top: 20,
    left: 20,
    right: 20,
    bottom: 20
  };

  /**
   * Exporta guia para PDF
   */
  static async exportarPDF(guia: GuiaAbastecimento, options: ExportOptions): Promise<ExportResult> {
    try {
      // Importação dinâmica do jsPDF
      const { jsPDF } = await import('jspdf');
      
      // Criar documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Configurar propriedades do documento
      doc.setProperties({
        title: `Guia de Abastecimento - ${guia.instituicaoNome}`,
        subject: 'Guia de Abastecimento',
        author: options.usuario?.nome || 'Sistema NutriGestão',
        creator: 'Sistema NutriGestão',
        producer: 'Sistema NutriGestão'
      });

      // Adicionar conteúdo ao PDF
      await this.adicionarConteudo(doc, guia, options);

      // Gerar nome do arquivo
      const nomeArquivo = this.gerarNomeArquivo(guia);

      // Salvar PDF
      doc.save(nomeArquivo);

      return {
        sucesso: true,
        nomeArquivo,
        tamanhoArquivo: this.calcularTamanhoEstimado(guia)
      };

    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro na exportação PDF'
      };
    }
  }

  /**
   * Adiciona todo o conteúdo ao documento PDF
   */
  private static async adicionarConteudo(
    doc: any, 
    guia: GuiaAbastecimento, 
    options: ExportOptions
  ): Promise<void> {
    let yPosition = this.MARGINS.top;

    // Cabeçalho
    if (options.incluirCabecalho) {
      yPosition = this.adicionarCabecalho(doc, guia, yPosition);
      yPosition += 10; // Espaçamento
    }

    // Informações da guia
    yPosition = this.adicionarInformacoesGuia(doc, guia, yPosition);
    yPosition += 8;

    // Tabela de alimentos
    yPosition = await this.adicionarTabelaAlimentos(doc, guia, options, yPosition);

    // Rodapé
    if (options.incluirRodape) {
      this.adicionarRodape(doc, guia, options);
    }
  }

  /**
   * Adiciona cabeçalho do documento
   */
  private static adicionarCabecalho(doc: any, guia: GuiaAbastecimento, yPosition: number): number {
    const pageWidth = doc.internal.pageSize.width;
    const centerX = pageWidth / 2;

    // Título principal
    doc.setFontSize(16);
    doc.setFont(this.FONTS.bold);
    doc.setTextColor(this.COLORS.primary);
    
    const titulo = `GUIA ESCOLA ${guia.instituicaoNome?.toUpperCase() || 'NÃO INFORMADA'} - ALAMBIQUE - EJA`;
    const tituloWidth = doc.getTextWidth(titulo);
    doc.text(titulo, centerX - (tituloWidth / 2), yPosition);
    yPosition += 8;

    // Linha decorativa
    doc.setDrawColor(this.COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(this.MARGINS.left, yPosition, pageWidth - this.MARGINS.right, yPosition);
    yPosition += 8;

    // Subtítulo
    doc.setFontSize(12);
    doc.setFont(this.FONTS.normal);
    doc.setTextColor(this.COLORS.text);
    
    const dataInicio = new Date(guia.dataInicio).toLocaleDateString('pt-BR');
    const dataFim = new Date(guia.dataFim).toLocaleDateString('pt-BR');
    const subtitulo = `Abastecimento [Semanas 2 E 3 (${dataInicio} a ${dataFim})]`;
    const subtituloWidth = doc.getTextWidth(subtitulo);
    doc.text(subtitulo, centerX - (subtituloWidth / 2), yPosition);
    
    return yPosition + 5;
  }

  /**
   * Adiciona informações básicas da guia
   */
  private static adicionarInformacoesGuia(doc: any, guia: GuiaAbastecimento, yPosition: number): number {
    doc.setFontSize(10);
    doc.setFont(this.FONTS.normal);
    doc.setTextColor(this.COLORS.text);

    const infos = [
      `Instituição: ${guia.instituicaoNome}`,
      `Período: ${new Date(guia.dataInicio).toLocaleDateString('pt-BR')} a ${new Date(guia.dataFim).toLocaleDateString('pt-BR')}`,
      `Gerado em: ${new Date(guia.dataGeracao).toLocaleDateString('pt-BR')} por ${guia.usuarioGeracao}`,
      `Versão: ${guia.versao} | Status: ${guia.status}`
    ];

    infos.forEach(info => {
      doc.text(info, this.MARGINS.left, yPosition);
      yPosition += 4;
    });

    return yPosition;
  }

  /**
   * Adiciona tabela principal de alimentos
   */
  private static async adicionarTabelaAlimentos(
    doc: any, 
    guia: GuiaAbastecimento, 
    options: ExportOptions, 
    yPosition: number
  ): Promise<number> {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const tableWidth = pageWidth - (this.MARGINS.left + this.MARGINS.right);
    
    // Processar e categorizar alimentos
    const { abastecimento, hortifrutis } = this.processarAlimentos(guia, options);
    
    // Configurações da tabela
    const colWidths = {
      item1: tableWidth * 0.32,      // 32% - Itens (Abastecimento)
      quant1: tableWidth * 0.13,     // 13% - Quant./peso
      unit1: tableWidth * 0.10,      // 10% - Unid.
      item2: tableWidth * 0.25,      // 25% - Hortifrútis
      quant2: tableWidth * 0.13,     // 13% - Quant./peso
      unit2: tableWidth * 0.07       // 7% - Unid.
    };

    // Desenhar cabeçalho da tabela
    yPosition = this.desenharCabecalhoTabela(doc, yPosition, colWidths);

    // Desenhar dados da tabela
    const maxLinhas = Math.max(abastecimento.length, hortifrutis.length);
    let linhaAtual = 0;

    for (let i = 0; i < maxLinhas; i++) {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = this.MARGINS.top;
        yPosition = this.desenharCabecalhoTabela(doc, yPosition, colWidths);
      }

      yPosition = this.desenharLinhaTabela(
        doc, 
        yPosition, 
        colWidths, 
        abastecimento[i], 
        hortifrutis[i], 
        i % 2 === 0
      );
      linhaAtual++;
    }

    // Linha final da tabela
    this.desenharLinhaBorda(doc, yPosition, colWidths);

    return yPosition + 10;
  }

  /**
   * Desenha cabeçalho da tabela
   */
  private static desenharCabecalhoTabela(doc: any, yPosition: number, colWidths: any): number {
    const startX = this.MARGINS.left;
    const rowHeight = 8;

    // Fundo do cabeçalho
    doc.setFillColor(this.COLORS.lightGray);
    doc.rect(startX, yPosition - 6, Object.values(colWidths).reduce((a: number, b: number) => a + b, 0), rowHeight, 'F');

    // Bordas
    this.desenharBordasCabecalho(doc, yPosition - 6, colWidths, rowHeight);

    // Texto do cabeçalho
    doc.setFontSize(10);
    doc.setFont(this.FONTS.bold);
    doc.setTextColor(this.COLORS.text);

    let currentX = startX;

    // Cabeçalhos das seções principais
    doc.text('ABASTECIMENTO', currentX + 2, yPosition - 1);
    doc.text('HORTIFRÚTIS', currentX + colWidths.item1 + colWidths.quant1 + colWidths.unit1 + 2, yPosition - 1);

    yPosition += 2;

    // Subcabeçalhos
    doc.setFontSize(9);
    doc.setFont(this.FONTS.normal);

    currentX = startX;
    doc.text('Itens', currentX + 2, yPosition);
    currentX += colWidths.item1;
    
    doc.text('Quant./peso', currentX + 2, yPosition);
    currentX += colWidths.quant1;
    
    doc.text('Unid.', currentX + 2, yPosition);
    currentX += colWidths.unit1;
    
    doc.text('Hortifrútis', currentX + 2, yPosition);
    currentX += colWidths.item2;
    
    doc.text('Quant./peso', currentX + 2, yPosition);
    currentX += colWidths.quant2;
    
    doc.text('Unid.', currentX + 2, yPosition);

    // Linha inferior do cabeçalho
    this.desenharLinhaBorda(doc, yPosition + 2, colWidths);

    return yPosition + 6;
  }

  /**
   * Desenha uma linha da tabela
   */
  private static desenharLinhaTabela(
    doc: any, 
    yPosition: number, 
    colWidths: any, 
    itemAbastecimento: any, 
    itemHortifruti: any, 
    linhaAlternada: boolean
  ): number {
    const startX = this.MARGINS.left;
    const rowHeight = 6;

    // Fundo alternado
    if (linhaAlternada) {
      doc.setFillColor(248, 249, 250); // Cinza muito claro
      doc.rect(startX, yPosition - 4, Object.values(colWidths).reduce((a: number, b: number) => a + b, 0), rowHeight, 'F');
    }

    // Configurar fonte
    doc.setFontSize(9);
    doc.setFont(this.FONTS.normal);
    doc.setTextColor(this.COLORS.text);

    let currentX = startX;

    // Coluna Abastecimento
    if (itemAbastecimento) {
      doc.text(this.truncarTexto(doc, itemAbastecimento.nome.toUpperCase(), colWidths.item1 - 4), currentX + 2, yPosition);
      currentX += colWidths.item1;
      
      doc.text(itemAbastecimento.quantidade.toString(), currentX + 2, yPosition);
      currentX += colWidths.quant1;
      
      doc.text(itemAbastecimento.unidade, currentX + 2, yPosition);
      currentX += colWidths.unit1;
    } else {
      currentX += colWidths.item1 + colWidths.quant1 + colWidths.unit1;
    }

    // Coluna Hortifrútis
    if (itemHortifruti) {
      doc.text(this.truncarTexto(doc, itemHortifruti.nome.toUpperCase(), colWidths.item2 - 4), currentX + 2, yPosition);
      currentX += colWidths.item2;
      
      doc.text(itemHortifruti.quantidade.toString(), currentX + 2, yPosition);
      currentX += colWidths.quant2;
      
      doc.text(itemHortifruti.unidade, currentX + 2, yPosition);
    }

    // Bordas laterais
    this.desenharBordasLinha(doc, yPosition - 4, colWidths, rowHeight);

    return yPosition + rowHeight;
  }

  /**
   * Desenha bordas do cabeçalho
   */
  private static desenharBordasCabecalho(doc: any, yPosition: number, colWidths: any, altura: number): void {
    const startX = this.MARGINS.left;
    let currentX = startX;

    doc.setDrawColor(this.COLORS.border);
    doc.setLineWidth(0.3);

    // Bordas verticais
    const positions = [
      currentX,
      currentX += colWidths.item1,
      currentX += colWidths.quant1,
      currentX += colWidths.unit1,
      currentX += colWidths.item2,
      currentX += colWidths.quant2,
      currentX += colWidths.unit2
    ];

    positions.forEach(x => {
      doc.line(x, yPosition, x, yPosition + altura);
    });

    // Bordas horizontais
    doc.line(startX, yPosition, currentX, yPosition);
    doc.line(startX, yPosition + altura, currentX, yPosition + altura);
  }

  /**
   * Desenha bordas de uma linha
   */
  private static desenharBordasLinha(doc: any, yPosition: number, colWidths: any, altura: number): void {
    const startX = this.MARGINS.left;
    let currentX = startX;

    doc.setDrawColor(this.COLORS.border);
    doc.setLineWidth(0.2);

    // Bordas verticais principais
    doc.line(startX, yPosition, startX, yPosition + altura);
    currentX += colWidths.item1 + colWidths.quant1 + colWidths.unit1;
    doc.line(currentX, yPosition, currentX, yPosition + altura);
    currentX += colWidths.item2 + colWidths.quant2 + colWidths.unit2;
    doc.line(currentX, yPosition, currentX, yPosition + altura);
  }

  /**
   * Desenha linha de borda inferior
   */
  private static desenharLinhaBorda(doc: any, yPosition: number, colWidths: any): void {
    const startX = this.MARGINS.left;
    const endX = startX + Object.values(colWidths).reduce((a: number, b: number) => a + b, 0);

    doc.setDrawColor(this.COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(startX, yPosition, endX, yPosition);
  }

  /**
   * Adiciona rodapé do documento
   */
  private static adicionarRodape(doc: any, guia: GuiaAbastecimento, options: ExportOptions): void {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = pageHeight - 40;

    // Total de alunos
    doc.setFontSize(11);
    doc.setFont(this.FONTS.bold);
    doc.setTextColor(this.COLORS.text);
    doc.text(`Quantitativo de alunos: 54 alunos`, this.MARGINS.left, yPosition);
    yPosition += 10;

    // Campos de assinatura (se habilitado)
    if (options.incluirAssinatura) {
      doc.setFontSize(10);
      doc.setFont(this.FONTS.normal);

      const campos = [
        'Entregue em ____/____/2025 Horário As____:____Min',
        '',
        'Recebido por_______________________________________ (________________)',
        '',
        'Entregador ___________________________________________'
      ];

      campos.forEach(campo => {
        if (campo) {
          doc.text(campo, this.MARGINS.left, yPosition);
        }
        yPosition += 5;
      });
    }

    // Observações
    if (options.incluirObservacoes && guia.observacoes) {
      yPosition += 5;
      doc.setFontSize(9);
      doc.setFont(this.FONTS.bold);
      doc.text('Observações:', this.MARGINS.left, yPosition);
      yPosition += 4;
      
      doc.setFont(this.FONTS.normal);
      const linhasObservacoes = this.quebrarTexto(doc, guia.observacoes, pageWidth - 40);
      linhasObservacoes.forEach(linha => {
        doc.text(linha, this.MARGINS.left, yPosition);
        yPosition += 4;
      });
    }
  }

  /**
   * Processa e categoriza alimentos
   */
  private static processarAlimentos(guia: GuiaAbastecimento, options: ExportOptions) {
    const abastecimento: any[] = [];
    const hortifrutis: any[] = [];

    guia.calculosDistribuicao.forEach(calc => {
      const item = {
        nome: calc.alimentoNome,
        quantidade: options.formatoNumeros?.decimais ? 
          calc.quantidadeTotal.toFixed(options.formatoNumeros.decimais) : 
          calc.quantidadeTotal.toString(),
        unidade: options.normalizarUnidades ? 
          this.normalizarUnidade(calc.unidadeMedida) : 
          calc.unidadeMedida
      };

      if (this.isHortifruti(calc.alimentoNome)) {
        hortifrutis.push(item);
      } else {
        abastecimento.push(item);
      }
    });

    // Ordenar alfabeticamente
    abastecimento.sort((a, b) => a.nome.localeCompare(b.nome));
    hortifrutis.sort((a, b) => a.nome.localeCompare(b.nome));

    return { abastecimento, hortifrutis };
  }

  /**
   * Verifica se um alimento é hortifrúti
   */
  private static isHortifruti(nomeAlimento: string): boolean {
    const hortifrutis = [
      'ALHO', 'CEBOLA', 'TOMATE', 'PIMENTÃO', 'BATATA', 'CENOURA',
      'COUVE', 'ALFACE', 'BANANA', 'MAÇÃ', 'LARANJA', 'LIMÃO'
    ];
    
    const nome = nomeAlimento.toUpperCase();
    return hortifrutis.some(h => nome.includes(h));
  }

  /**
   * Normaliza unidades de medida
   */
  private static normalizarUnidade(unidade: string): string {
    const mapeamento: Record<string, string> = {
      'PCT': 'UND',
      'UNID.': 'UND',
      'UNIDADE': 'UND',
      'PACOTE': 'UND'
    };

    return mapeamento[unidade.toUpperCase()] || unidade;
  }

  /**
   * Trunca texto para caber na largura especificada
   */
  private static truncarTexto(doc: any, texto: string, larguraMaxima: number): string {
    const larguraTexto = doc.getTextWidth(texto);
    
    if (larguraTexto <= larguraMaxima) {
      return texto;
    }

    // Truncar gradualmente até caber
    let textoTruncado = texto;
    while (doc.getTextWidth(textoTruncado + '...') > larguraMaxima && textoTruncado.length > 0) {
      textoTruncado = textoTruncado.slice(0, -1);
    }

    return textoTruncado + '...';
  }

  /**
   * Quebra texto em linhas
   */
  private static quebrarTexto(doc: any, texto: string, larguraMaxima: number): string[] {
    const palavras = texto.split(' ');
    const linhas: string[] = [];
    let linhaAtual = '';

    palavras.forEach(palavra => {
      const testeTexto = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
      
      if (doc.getTextWidth(testeTexto) <= larguraMaxima) {
        linhaAtual = testeTexto;
      } else {
        if (linhaAtual) {
          linhas.push(linhaAtual);
        }
        linhaAtual = palavra;
      }
    });

    if (linhaAtual) {
      linhas.push(linhaAtual);
    }

    return linhas;
  }

  /**
   * Gera nome do arquivo
   */
  private static gerarNomeArquivo(guia: GuiaAbastecimento): string {
    const instituicao = (guia.instituicaoNome || 'escola')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    const data = new Date().toISOString().split('T')[0];
    
    return `guia-abastecimento-${instituicao}-${data}.pdf`;
  }

  /**
   * Calcula tamanho estimado do arquivo
   */
  private static calcularTamanhoEstimado(guia: GuiaAbastecimento): number {
    // Estimativa básica baseada no número de itens
    const baseSize = 50 * 1024; // 50KB base
    const itemSize = guia.calculosDistribuicao.length * 200; // ~200 bytes por item
    
    return baseSize + itemSize;
  }
}