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
            suportado: false
        },
        CSV: {
            extensao: '.csv',
            mimeType: 'text/csv',
            suportado: true
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
        'COLORAU': CategoriaAlimento.ABASTECIMENTO,
        'AÇÚCAR': CategoriaAlimento.ABASTECIMENTO,
        'MACARRÃO': CategoriaAlimento.ABASTECIMENTO,
        'MACARRÃO ESPAGUETE': CategoriaAlimento.ABASTECIMENTO,
        'FEIJÃO': CategoriaAlimento.ABASTECIMENTO,
        'FEIJÃO CARIOCA': CategoriaAlimento.ABASTECIMENTO,
        'ARROZ': CategoriaAlimento.ABASTECIMENTO,
        'BISCOITO': CategoriaAlimento.ABASTECIMENTO,
        'BISCOITO SALGADO': CategoriaAlimento.ABASTECIMENTO,
        'FLOCOS DE MILHO': CategoriaAlimento.ABASTECIMENTO,
        'FARINHA DE MANDIOCA': CategoriaAlimento.ABASTECIMENTO,
        'CAFÉ': CategoriaAlimento.ABASTECIMENTO,
        'TAPIOCA SECA': CategoriaAlimento.ABASTECIMENTO,
        'LEITE EM PÓ': CategoriaAlimento.ABASTECIMENTO,
        'SARDINHA': CategoriaAlimento.ABASTECIMENTO,
        'PROTEÍNA DE SOJA': CategoriaAlimento.ABASTECIMENTO,
        'ÓLEO': CategoriaAlimento.ABASTECIMENTO,
        'SAL': CategoriaAlimento.ABASTECIMENTO,
        'VINAGRE': CategoriaAlimento.ABASTECIMENTO,

        // Carnes e proteínas
        'CARNE BOVINA': CategoriaAlimento.PROTEINAS,
        'CARNE BOVINA (MUSCULO)': CategoriaAlimento.PROTEINAS,
        'MÚSCULO': CategoriaAlimento.PROTEINAS,
        'LINGUIÇA': CategoriaAlimento.PROTEINAS,
        'LINGUIÇA CALABRESA': CategoriaAlimento.PROTEINAS,
        'FRANGO': CategoriaAlimento.PROTEINAS,
        'FRANGO INTEIRO': CategoriaAlimento.PROTEINAS,
        'PEIXE': CategoriaAlimento.PROTEINAS,
        'OVO': CategoriaAlimento.PROTEINAS,
        'OVOS': CategoriaAlimento.PROTEINAS,

        // Hortifrútis e verduras
        'ALHO': CategoriaAlimento.HORTIFRUTI,
        'CEBOLA': CategoriaAlimento.HORTIFRUTI,
        'TOMATE': CategoriaAlimento.HORTIFRUTI,
        'PIMENTÃO': CategoriaAlimento.HORTIFRUTI,
        'BATATA': CategoriaAlimento.HORTIFRUTI,
        'BATATA INGLESA': CategoriaAlimento.HORTIFRUTI,
        'CENOURA': CategoriaAlimento.HORTIFRUTI,
        'ABOBRINHA': CategoriaAlimento.HORTIFRUTI,
        'ABÓBORA': CategoriaAlimento.HORTIFRUTI,
        'COUVE': CategoriaAlimento.HORTIFRUTI,
        'ALFACE': CategoriaAlimento.HORTIFRUTI,
        'LIMÃO': CategoriaAlimento.HORTIFRUTI,
        'BANANA': CategoriaAlimento.HORTIFRUTI,
        'MAÇÃ': CategoriaAlimento.HORTIFRUTI,
        'LARANJA': CategoriaAlimento.HORTIFRUTI,

        // Grãos e cereais específicos
        'MILHO': CategoriaAlimento.GRAOS_CEREAIS,
        'AVEIA': CategoriaAlimento.GRAOS_CEREAIS,
        'QUINOA': CategoriaAlimento.GRAOS_CEREAIS,
        'LENTILHA': CategoriaAlimento.GRAOS_CEREAIS,
        'GRÃO DE BICO': CategoriaAlimento.GRAOS_CEREAIS,

        // Laticínios
        'LEITE': CategoriaAlimento.LATICINIOS,
        'QUEIJO': CategoriaAlimento.LATICINIOS,
        'IOGURTE': CategoriaAlimento.LATICINIOS,
        'MANTEIGA': CategoriaAlimento.LATICINIOS,
        'MARGARINA': CategoriaAlimento.LATICINIOS
    },

    templates: {
        TXT: {
            cabecalho: {
                incluir: true,
                template: '{TITULO}\n===============================\n\nInstituição: {INSTITUICAO}\nPeríodo: {PERIODO}\n\n',
                customizavel: true
            },
            corpo: {
                incluir: true,
                template: '{CATEGORIA}\n{SEPARADOR}\n{ITENS}\n\n',
                customizavel: true
            },
            rodape: {
                incluir: true,
                template: '\nEntregue em ___/___/{ANO} Horário As___:___Min\nRecebido por: _________________________________\nEntregador: __________________________________\n',
                customizavel: true
            }
        },
        XLSX: {
            cabecalho: {
                incluir: true,
                template: 'default_xlsx_header',
                customizavel: false
            },
            corpo: {
                incluir: true,
                template: 'default_xlsx_body',
                customizavel: false
            },
            rodape: {
                incluir: true,
                template: 'default_xlsx_footer',
                customizavel: false
            }
        },
        DOCX: {
            cabecalho: {
                incluir: true,
                template: 'default_docx_header',
                customizavel: false
            },
            corpo: {
                incluir: true,
                template: 'default_docx_body',
                customizavel: false
            },
            rodape: {
                incluir: true,
                template: 'default_docx_footer',
                customizavel: false
            }
        }
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
    CategoriaAlimento.ABASTECIMENTO,
    CategoriaAlimento.PROTEINAS,
    CategoriaAlimento.GRAOS_CEREAIS,
    CategoriaAlimento.LATICINIOS,
    CategoriaAlimento.HORTIFRUTI,
    CategoriaAlimento.PANIFICACAO,
    CategoriaAlimento.BEBIDAS,
    CategoriaAlimento.CONDIMENTOS,
    CategoriaAlimento.CONSERVAS,
    CategoriaAlimento.CONGELADOS,
    CategoriaAlimento.DOCES_SOBREMESAS,
    CategoriaAlimento.OUTROS
];

export const USUARIO_PADRAO = {
    nome: 'Ana Paula Silva',
    cargo: 'Nutricionista',
    email: 'ana.paula@nutrigestao.com'
};