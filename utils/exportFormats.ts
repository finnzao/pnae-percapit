// utils/exportFormats.ts
import { 
    ExportOptions, 
    FoodItem, 
    groupFoodsByCategory, 
    formatDate, 
    formatDateRange,
    normalizeUnit,
    formatNumber
  } from './exportUtils';
  
  export type ExportFormat = 'txt' | 'xlsx' | 'docx';
  
  export interface ExportResult {
    blob: Blob;
    filename: string;
    mimeType: string;
  }
  
  /**
   * Interface para dados de guia de abastecimento
   */
  export interface SupplyGuideData {
    institution: {
      name: string;
      totalStudents: number;
    };
    period: {
      startDate: Date | string;
      endDate: Date | string;
    };
    foods: FoodItem[];
    metadata: {
      generatedBy: string;
      generatedAt: Date;
      version: number;
      observations?: string;
    };
  }
  
  /**
   * Formatador para TXT (mantém compatibilidade)
   */
  export class TxtFormatter {
    static format(data: SupplyGuideData, options: ExportOptions): string {
      const { institution, period, foods, metadata } = data;
      const { abastecimento, hortifrutis } = groupFoodsByCategory(foods);
  
      let content = `GUIA DE ABASTECIMENTO\n`;
      content += `==================\n\n`;
      content += `Instituição: ${institution.name}\n`;
      content += `Período: ${formatDateRange(period.startDate, period.endDate)}\n`;
      content += `Quantidade de alunos: ${institution.totalStudents} alunos\n`;
      content += `Gerado em: ${formatDate(metadata.generatedAt)}\n`;
      content += `Por: ${metadata.generatedBy}\n`;
      if (metadata.observations) {
        content += `Observações: ${metadata.observations}\n`;
      }
      content += `\n`;
  
      // Seção Abastecimento
      if (abastecimento.length > 0) {
        content += `ABASTECIMENTO\n`;
        content += `-------------\n`;
        abastecimento.forEach(item => {
          content += `${item.name}: ${formatNumber(item.quantity)} ${item.unit}\n`;
        });
        content += `\n`;
      }
  
      // Seção Hortifrútis
      if (hortifrutis.length > 0) {
        content += `HORTIFRÚTIS\n`;
        content += `-----------\n`;
        hortifrutis.forEach(item => {
          content += `${item.name}: ${formatNumber(item.quantity)} ${item.unit}\n`;
        });
        content += `\n`;
      }
  
      content += `\nEntregue em ___/___/${new Date().getFullYear()} Horário As___:___Min\n`;
      content += `Recebido por: _________________________________\n`;
      content += `Entregador: __________________________________\n`;
  
      return content;
    }
  }
  
  /**
   * Formatador para XLSX
   */
  export class XlsxFormatter {
    static async format(data: SupplyGuideData, options: ExportOptions): Promise<Blob> {
      // Importação dinâmica do SheetJS
      const XLSX = await import('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
      
      const { institution, period, foods } = data;
      const { abastecimento, hortifrutis } = groupFoodsByCategory(foods);
  
      // Criar workbook
      const workbook = XLSX.utils.book_new();
  
      // Preparar dados da planilha principal
      const sheetData: any[][] = [
        // Cabeçalho
        ['GUIA DE ABASTECIMENTO'],
        [''],
        [`Instituição: ${institution.name}`],
        [`Período: ${formatDateRange(period.startDate, period.endDate)}`],
        [`Quantidade de alunos: ${institution.totalStudents} alunos`],
        [''],
        ['ABASTECIMENTO'],
        ['Itens', 'Quant./peso', 'Unid.', 'HORTIFRÚTIS', 'Quant./peso', 'Unid.']
      ];
  
      // Preencher dados lado a lado
      const maxRows = Math.max(abastecimento.length, hortifrutis.length);
      
      for (let i = 0; i < maxRows; i++) {
        const row: any[] = [];
        
        // Coluna Abastecimento
        if (i < abastecimento.length) {
          const item = abastecimento[i];
          row.push(item.name, formatNumber(item.quantity), item.unit);
        } else {
          row.push('', '', '');
        }
        
        // Coluna Hortifrútis
        if (i < hortifrutis.length) {
          const item = hortifrutis[i];
          row.push(item.name, formatNumber(item.quantity), item.unit);
        } else {
          row.push('', '', '');
        }
        
        sheetData.push(row);
      }
  
      // Adicionar rodapé
      sheetData.push(
        [''],
        [`Quantitativo de alunos: ${institution.totalStudents} alunos`],
        [''],
        [`Entregue em ___/___/${new Date().getFullYear()} Horário As___:___Min`],
        ['Recebido por: _________________________________'],
        ['Entregador: __________________________________']
      );
  
      // Criar worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  
      // Definir larguras das colunas
      worksheet['!cols'] = [
        { wch: 25 }, // Itens (Abastecimento)
        { wch: 15 }, // Quant./peso
        { wch: 8 },  // Unid.
        { wch: 25 }, // Hortifrútis
        { wch: 15 }, // Quant./peso
        { wch: 8 }   // Unid.
      ];
  
      // Adicionar formatação
      const range = XLSX.utils.decode_range(worksheet['!ref']!);
      
      // Cabeçalho principal
      if (worksheet['A1']) {
        worksheet['A1'].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: 'center' }
        };
      }
  
      // Cabeçalhos das seções
      if (worksheet['A7']) {
        worksheet['A7'].s = { font: { bold: true } };
      }
      if (worksheet['D7']) {
        worksheet['D7'].s = { font: { bold: true } };
      }
  
      // Cabeçalhos das colunas
      for (let col = 0; col < 6; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 7, c: col });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'E7E5DF' } },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          };
        }
      }
  
      // Adicionar bordas aos dados
      for (let row = 8; row < 8 + maxRows; row++) {
        for (let col = 0; col < 6; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = {
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              }
            };
          }
        }
      }
  
      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Guia de Abastecimento');
  
      // Gerar buffer
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      return new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
    }
  }
  
  /**
   * Formatador para DOCX
   */
  export class DocxFormatter {
    static async format(data: SupplyGuideData, options: ExportOptions): Promise<Blob> {
      const { institution, period, foods } = data;
      const { abastecimento, hortifrutis } = groupFoodsByCategory(foods);
  
      // Criar estrutura HTML que será convertida para DOCX
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .info { margin-bottom: 20px; }
            .section-title { font-weight: bold; margin: 15px 0 10px 0; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .table th { background-color: #E7E5DF; font-weight: bold; }
            .footer { margin-top: 30px; }
            .signature-line { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">GUIA DE ABASTECIMENTO</div>
          </div>
  
          <div class="info">
            <p><strong>Instituição:</strong> ${institution.name}</p>
            <p><strong>Período:</strong> ${formatDateRange(period.startDate, period.endDate)}</p>
            <p><strong>Quantidade de alunos:</strong> ${institution.totalStudents} alunos</p>
          </div>
  
          <table class="table">
            <thead>
              <tr>
                <th colspan="3">ABASTECIMENTO</th>
                <th colspan="3">HORTIFRÚTIS</th>
              </tr>
              <tr>
                <th>Itens</th>
                <th>Quant./peso</th>
                <th>Unid.</th>
                <th>Itens</th>
                <th>Quant./peso</th>
                <th>Unid.</th>
              </tr>
            </thead>
            <tbody>
      `;
  
      // Preencher dados da tabela
      const maxRows = Math.max(abastecimento.length, hortifrutis.length);
      
      for (let i = 0; i < maxRows; i++) {
        htmlContent += '<tr>';
        
        // Coluna Abastecimento
        if (i < abastecimento.length) {
          const item = abastecimento[i];
          htmlContent += `
            <td>${item.name}</td>
            <td>${formatNumber(item.quantity)}</td>
            <td>${item.unit}</td>
          `;
        } else {
          htmlContent += '<td></td><td></td><td></td>';
        }
        
        // Coluna Hortifrútis
        if (i < hortifrutis.length) {
          const item = hortifrutis[i];
          htmlContent += `
            <td>${item.name}</td>
            <td>${formatNumber(item.quantity)}</td>
            <td>${item.unit}</td>
          `;
        } else {
          htmlContent += '<td></td><td></td><td></td>';
        }
        
        htmlContent += '</tr>';
      }
  
      htmlContent += `
            </tbody>
          </table>
  
          <div class="info">
            <p><strong>Quantitativo de alunos:</strong> ${institution.totalStudents} alunos</p>
          </div>
  
          <div class="footer">
            <div class="signature-line">
              <strong>Entregue em</strong> ___/___/${new Date().getFullYear()} 
              <strong>Horário As</strong> ___:___ <strong>Min</strong>
            </div>
            <div class="signature-line">
              <strong>Recebido por:</strong> _________________________________
            </div>
            <div class="signature-line">
              <strong>Entregador:</strong> __________________________________
            </div>
          </div>
        </body>
        </html>
      `;
  
      // Converter HTML para DOCX usando uma biblioteca
      // Para uma implementação real, você precisaria usar uma biblioteca como docx ou mammoth
      // Por enquanto, criamos um blob HTML que pode ser aberto como documento
      
      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
  
      return blob;
    }
  }
  
  /**
   * Factory para criar formatadores
   */
  export class ExportFormatterFactory {
    static async createExport(
      format: ExportFormat,
      data: SupplyGuideData,
      options: ExportOptions
    ): Promise<ExportResult> {
      const mimeTypes = {
        txt: 'text/plain',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
  
      let blob: Blob;
      let filename: string;
  
      switch (format) {
        case 'txt':
          const txtContent = TxtFormatter.format(data, options);
          blob = new Blob([txtContent], { type: mimeTypes.txt });
          filename = `${options.filename}.txt`;
          break;
  
        case 'xlsx':
          blob = await XlsxFormatter.format(data, options);
          filename = `${options.filename}.xlsx`;
          break;
  
        case 'docx':
          blob = await DocxFormatter.format(data, options);
          filename = `${options.filename}.docx`;
          break;
  
        default:
          throw new Error(`Formato de exportação não suportado: ${format}`);
      }
  
      return {
        blob,
        filename,
        mimeType: mimeTypes[format]
      };
    }
  }