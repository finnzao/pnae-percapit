// constants/exportConfig.ts
import { ExportConfig, CategoriaAlimento } from "@/types/export";

export const EXPORT_CONFIG: ExportConfig = {
    formatos: {
        TXT: {
            extensao: '.txt',
            mimeType: 'text/plain',
            suportado: true
        },
        XLSX: {
            extensao: '.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            suportado: true
        },
        DOCX: {
            extensao: '.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            suportado: true
        },
        PDF: {
            extensao: '.pdf',
            mimeType: 'application/pdf',
            suportado: false // Implementar futuramente
        }
    },

    unidades: {
        peso: [
            { original: 'KG', normalizada: 'Kg', categoria: 'peso', fatorConversao: 1 },
            { original: 'kg', normalizada: 'Kg', categoria: 'peso', fatorConversao: 1 },
            { original: 'G', normalizada: 'g', categoria: 'peso', fatorConversao: 0.001 },
            { original: 'g', normalizada: 'g', categoria: 'peso', fatorConversao: 0.001 },
            { original: 'GRAMAS', normalizada: 'g', categoria: 'peso', fatorConversao: 0.001 },
            { original: 'QUILOS', normalizada: 'Kg', categoria: 'peso', fatorConversao: 1 }
        ],
        volume: [
            { original: 'L', normalizada: 'L', categoria: 'volume', fatorConversao: 1 },
            { original: 'l', normalizada: 'L', categoria: 'volume', fatorConversao: 1 },
            { original: 'ML', normalizada: 'mL', categoria: 'volume', fatorConversao: 0.001 },
            { original: 'ml', normalizada: 'mL', categoria: 'volume', fatorConversao: 0.001 },
            { original: 'LITROS', normalizada: 'L', categoria: 'volume', fatorConversao: 1 }
        ],
        unidade: [
            { original: 'UND', normalizada: 'Unid.', categoria: 'unidade' },
            { original: 'UNID', normalizada: 'Unid.', categoria: 'unidade' },
            { original: 'UNIDADE', normalizada: 'Unid.', categoria: 'unidade' },
            { original: 'PCT', normalizada: 'Unid.', categoria: 'unidade' },
            { original: 'PACOTE', normalizada: 'Unid.', categoria: 'unidade' },
            { original: 'MOLHO', normalizada: 'Unid.', categoria: 'unidade' },
            { original: 'MAÇO', normalizada: 'Unid.', categoria: 'unidade' },
            { original: 'DÚZIA', normalizada: 'Dz', categoria: 'unidade' },
            { original: 'DUZIA', normalizada: 'Dz', categoria: 'unidade' }
        ]
    },

    categorias: {
        // Alimentos básicos e não perecíveis
        'COLORAU': 'Abastecimento',
        'AÇÚCAR': 'Abastecimento',
        'MACARRÃO': 'Abastecimento',
        'MACARRÃO ESPAGUETE': 'Abastecimento',
        'FEIJÃO': 'Abastecimento',
        'FEIJÃO CARIOCA': 'Abastecimento',
        'ARROZ': 'Abastecimento',
        'BISCOITO': 'Abastecimento',
        'BISCOITO SALGADO': 'Abastecimento',
        'FLOCOS DE MILHO': 'Abastecimento',
        'FARINHA DE MANDIOCA': 'Abastecimento',
        'CAFÉ': 'Abastecimento',
        'TAPIOCA SECA': 'Abastecimento',
        'LEITE EM PÓ': 'Abastecimento',
        'SARDINHA': 'Abastecimento',
        'PROTEÍNA DE SOJA': 'Abastecimento',
        'ÓLEO': 'Abastecimento',
        'SAL': 'Abastecimento',
        'VINAGRE': 'Abastecimento',

        // Carnes e proteínas
        'CARNE BOVINA': 'Proteínas',
        'CARNE BOVINA (MUSCULO)': 'Proteínas',
        'MÚSCULO': 'Proteínas',
        'LINGUIÇA': 'Proteínas',
        'LINGUIÇA CALABRESA': 'Proteínas',
        'FRANGO': 'Proteínas',
        'FRANGO INTEIRO': 'Proteínas',
        'PEIXE': 'Proteínas',
        'OVO': 'Proteínas',
        'OVOS': 'Proteínas',

        // Hortifrútis e verduras
        'ALHO': 'Hortifrútis',
        'CEBOLA': 'Hortifrútis',
        'TOMATE': 'Hortifrútis',
        'PIMENTÃO': 'Hortifrútis',
        'BATATA': 'Hortifrútis',
        'BATATA INGLESA': 'Hortifrútis',
        'CENOURA': 'Hortifrútis',
        'ABOBRINHA': 'Hortifrútis',
        'ABÓBORA': 'Hortifrútis',
        'COUVE': 'Hortifrútis',
        'ALFACE': 'Hortifrútis',
        'LIMÃO': 'Hortifrútis',
        'BANANA': 'Hortifrútis',
        'MAÇÃ': 'Hortifrútis',
        'LARANJA': 'Hortifrútis',

        // Grãos e cereais específicos
        'MILHO': 'Grãos e Cereais',
        'AVEIA': 'Grãos e Cereais',
        'QUINOA': 'Grãos e Cereais',
        'LENTILHA': 'Grãos e Cereais',
        'GRÃO DE BICO': 'Grãos e Cereais',

        // Laticínios
        'LEITE': 'Laticínios',
        'QUEIJO': 'Laticínios',
        'IOGURTE': 'Laticínios',
        'MANTEIGA': 'Laticínios',
        'MARGARINA': 'Laticínios'
    }
};

export const TEMPLATE_ABASTECIMENTO = {
    titulo: 'GUIA ESCOLA {NOME_INSTITUICAO} - {PERIODO}',
    subtitulo: 'Abastecimento [Semanas {SEMANAS} ({DATA_INICIO} a {DATA_FIM})]',
    quantitativoAlunos: 'Quantitativo de alunos: {TOTAL_ALUNOS} alunos',
    camposAssinatura: {
        entregue: 'Entregue em ____/____/2025 Horário As____:____Min',
        recebido: 'Recebido por_______________________________________ (________________)',
        entregador: 'Entregador ___________________________________________'
    }
};

export const CATEGORIA_ORDEM: CategoriaAlimento[] = [
    'Abastecimento',
    'Hortifrútis',
    'Proteínas',
    'Grãos e Cereais',
    'Laticínios',
    'Outros'
];

export const USUARIO_PADRAO = {
    nome: 'Ana Paula Silva',
    cargo: 'Nutricionista',
    email: 'ana.paula@nutrigestao.com'
};