interface ExportData {
    [key: string]: unknown;
  }
  
  export interface ExportOptions {
    filename: string;
    title?: string;
    subtitle?: string;
    metadata?: {
      createdBy?: string;
      createdAt?: Date;
      version?: string;
      totalStudents?: number;
      period?: string;
      institution?: string;
    };
    customFields?: Record<string, string | number | Date>;
  }
  
  /**
   * Dicionário de normalização de unidades
   */
  const UNIT_NORMALIZATION: Record<string, string> = {
    'Pct(s)': 'Unid.',
    'Pct': 'Unid.',
    'Pacote(s)': 'Unid.',
    'Pacote': 'Unid.',
    'Molho': 'Unid.',
    'Unid.': 'Unid.',
    'Unidade': 'Unid.',
    'Unidades': 'Unid.',
    'kg': 'Kg',
    'Kg': 'Kg',
    'KG': 'Kg',
    'quilograma': 'Kg',
    'quilogramas': 'Kg',
    'g': 'g',
    'grama': 'g',
    'gramas': 'g',
    'L': 'L',
    'l': 'L',
    'litro': 'L',
    'litros': 'L',
    'ml': 'ml',
    'mL': 'ml',
    'mililitro': 'ml',
    'mililitros': 'ml'
  };
  

  export function normalizeUnit(unit: string | undefined): string {
    if (!unit) return 'Unid.';
    
    const normalized = UNIT_NORMALIZATION[unit.trim()];
    return normalized || unit.trim();
  }
  

  export function formatNumber(value: number, decimals: number = 2): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  

  export function formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
  }
  

  export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
    return `${formatDate(startDate)} a ${formatDate(endDate)}`;
  }
  

  export function categorizeFood(foodName: string): 'abastecimento' | 'hortifrutis' {
    const hortifrutis = [
      'alho', 'cebola', 'chuchu', 'batata', 'pimentão', 'tomate', 'cenoura',
      'melancia', 'melão', 'abacaxi', 'alface', 'coentro', 'cebolinha',
      'repolho', 'banana', 'mandioca', 'polpa de suco', 'polpa',
      // Adicionar mais conforme necessário
    ];
    
    const lowerName = foodName.toLowerCase();
    const isHortifruit = hortifrutis.some(item => 
      lowerName.includes(item) || item.includes(lowerName)
    );
    
    return isHortifruit ? 'hortifrutis' : 'abastecimento';
  }
  

  export interface FoodItem {
    name: string;
    quantity: number;
    unit: string;
    weight?: number; 
  }
  

  export function groupFoodsByCategory(foods: FoodItem[]): {
    abastecimento: FoodItem[];
    hortifrutis: FoodItem[];
  } {
    const abastecimento: FoodItem[] = [];
    const hortifrutis: FoodItem[] = [];
    
    foods.forEach(food => {
      const category = categorizeFood(food.name);
      const normalizedFood = {
        ...food,
        unit: normalizeUnit(food.unit)
      };
      
      if (category === 'hortifrutis') {
        hortifrutis.push(normalizedFood);
      } else {
        abastecimento.push(normalizedFood);
      }
    });
    
    return { abastecimento, hortifrutis };
  }
  

  export function generateFilename(baseName: string, extension: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedBaseName = baseName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    return `${sanitizedBaseName}-${timestamp}.${extension}`;
  }
  

  export function prepareExportData(
    rawData: ExportData[],
    options: ExportOptions
  ): {
    metadata: Required<ExportOptions>['metadata'] & { filename: string };
    data: ExportData[];
  } {
    const defaultMetadata = {
      createdBy: 'Sistema NutriGestão',
      createdAt: new Date(),
      version: '1.0',
      totalStudents: 0,
      period: '',
      institution: '',
      ...options.metadata
    };
  
    return {
      metadata: {
        ...defaultMetadata,
        filename: options.filename
      },
      data: rawData
    };
  }
  

  export function validateExportData(data: unknown[]): boolean {
    return Array.isArray(data) && data.length > 0;
  }

  export function createExportError(message: string, details?: unknown): Error {
    const error = new Error(`Erro na exportação: ${message}`);
    if (details) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).details = details;
    }
    return error;
  }
  
  export function formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
  
  export function createDocumentHeader(options: ExportOptions) {
    return {
      title: options.title || 'Guia de Abastecimento',
      subtitle: options.subtitle || 'Sistema NutriGestão',
      generatedAt: formatDate(new Date()),
      generatedBy: options.metadata?.createdBy || 'Sistema',
      ...options.customFields
    };
  }