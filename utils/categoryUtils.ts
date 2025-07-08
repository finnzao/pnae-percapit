// utils/categoriaUtils.ts
import {
    CategoriaAlimento,
    CategoriaAlimentoDescricao,
    MAPEAMENTO_CATEGORIA_AUTOMATICO
} from '@/types/types';

/**
 * Retorna todas as categorias disponíveis em ordem de prioridade
 */
export function obterCategoriasDisponiveis(): Array<{
    value: CategoriaAlimento;
    label: string;
    description: string;
}> {
    return Object.values(CategoriaAlimento).map(categoria => ({
        value: categoria,
        label: categoria,
        description: CategoriaAlimentoDescricao[categoria]
    }));
}

/**
 * Determina automaticamente a categoria de um alimento baseado no nome
 */
export function determinarCategoriaAutomatica(nomeAlimento: string): CategoriaAlimento {
    const nomeNormalizado = nomeAlimento.toUpperCase().trim();

    // Busca correspondência exata primeiro
    if (MAPEAMENTO_CATEGORIA_AUTOMATICO[nomeNormalizado]) {
        return MAPEAMENTO_CATEGORIA_AUTOMATICO[nomeNormalizado];
    }

    // Busca por palavras-chave no nome
    for (const [palavra, categoria] of Object.entries(MAPEAMENTO_CATEGORIA_AUTOMATICO)) {
        if (nomeNormalizado.includes(palavra)) {
            return categoria;
        }
    }

    // Busca por padrões específicos
    if (nomeNormalizado.includes('CARNE') ||
        nomeNormalizado.includes('FRANGO') ||
        nomeNormalizado.includes('PEIXE') ||
        nomeNormalizado.includes('OVO')) {
        return CategoriaAlimento.PROTEINAS;
    }

    if (nomeNormalizado.includes('LEITE') ||
        nomeNormalizado.includes('QUEIJO') ||
        nomeNormalizado.includes('IOGURTE')) {
        return CategoriaAlimento.LATICINIOS;
    }

    if (nomeNormalizado.includes('SUCO') ||
        nomeNormalizado.includes('ÁGUA') ||
        nomeNormalizado.includes('REFRIGERANTE')) {
        return CategoriaAlimento.BEBIDAS;
    }

    if (nomeNormalizado.includes('PÃO') ||
        nomeNormalizado.includes('BOLO') ||
        nomeNormalizado.includes('BISCOITO')) {
        return CategoriaAlimento.PANIFICACAO;
    }

    if (nomeNormalizado.includes('DOCE') ||
        nomeNormalizado.includes('AÇÚCAR') ||
        nomeNormalizado.includes('MEL')) {
        return CategoriaAlimento.DOCES_SOBREMESAS;
    }

    // Categoria padrão
    return CategoriaAlimento.OUTROS;
}

/**
 * Sugere uma categoria baseada em palavras-chave
 */
export function sugerirCategoria(nomeAlimento: string): {
    categoria: CategoriaAlimento;
    confianca: 'alta' | 'media' | 'baixa';
    motivo: string;
} {
    const nomeNormalizado = nomeAlimento.toUpperCase().trim();

    // Correspondência exata = alta confiança
    if (MAPEAMENTO_CATEGORIA_AUTOMATICO[nomeNormalizado]) {
        return {
            categoria: MAPEAMENTO_CATEGORIA_AUTOMATICO[nomeNormalizado],
            confianca: 'alta',
            motivo: 'Correspondência exata encontrada'
        };
    }

    // Busca por palavras-chave = média confiança
    for (const [palavra, categoria] of Object.entries(MAPEAMENTO_CATEGORIA_AUTOMATICO)) {
        if (nomeNormalizado.includes(palavra)) {
            return {
                categoria,
                confianca: 'media',
                motivo: `Contém palavra-chave: ${palavra}`
            };
        }
    }

    // Padrões gerais = baixa confiança
    const categoria = determinarCategoriaAutomatica(nomeAlimento);
    if (categoria !== CategoriaAlimento.OUTROS) {
        return {
            categoria,
            confianca: 'baixa',
            motivo: 'Baseado em padrões gerais'
        };
    }

    return {
        categoria: CategoriaAlimento.OUTROS,
        confianca: 'baixa',
        motivo: 'Não foi possível determinar categoria específica'
    };
}

/**
 * Valida se uma categoria é válida
 */
export function validarCategoria(categoria: string): categoria is CategoriaAlimento {
    return Object.values(CategoriaAlimento).includes(categoria as CategoriaAlimento);
}

/**
 * Retorna a cor associada a uma categoria (para UI)
 */
export function obterCorCategoria(categoria: CategoriaAlimento): string {
    const cores: Record<CategoriaAlimento, string> = {
        [CategoriaAlimento.ABASTECIMENTO]: '#8B4513', // Marrom
        [CategoriaAlimento.HORTIFRUTI]: '#228B22', // Verde
        [CategoriaAlimento.PROTEINAS]: '#DC143C', // Vermelho
        [CategoriaAlimento.GRAOS_CEREAIS]: '#DAA520', // Dourado
        [CategoriaAlimento.LATICINIOS]: '#4169E1', // Azul
        [CategoriaAlimento.BEBIDAS]: '#00CED1', // Turquesa
        [CategoriaAlimento.CONDIMENTOS]: '#FF8C00', // Laranja
        [CategoriaAlimento.DOCES_SOBREMESAS]: '#FF69B4', // Rosa
        [CategoriaAlimento.PANIFICACAO]: '#DEB887', // Bege
        [CategoriaAlimento.CONSERVAS]: '#9370DB', // Roxo
        [CategoriaAlimento.CONGELADOS]: '#87CEEB', // Azul claro
        [CategoriaAlimento.OUTROS]: '#808080' // Cinza
    };

    return cores[categoria] || cores[CategoriaAlimento.OUTROS];
}

/**
 * Retorna ícone sugerido para uma categoria
 */
export function obterIconeCategoria(categoria: CategoriaAlimento): string {
    const icones: Record<CategoriaAlimento, string> = {
        [CategoriaAlimento.ABASTECIMENTO]: '📦',
        [CategoriaAlimento.HORTIFRUTI]: '🥬',
        [CategoriaAlimento.PROTEINAS]: '🥩',
        [CategoriaAlimento.GRAOS_CEREAIS]: '🌾',
        [CategoriaAlimento.LATICINIOS]: '🥛',
        [CategoriaAlimento.BEBIDAS]: '🥤',
        [CategoriaAlimento.CONDIMENTOS]: '🧂',
        [CategoriaAlimento.DOCES_SOBREMESAS]: '🍰',
        [CategoriaAlimento.PANIFICACAO]: '🍞',
        [CategoriaAlimento.CONSERVAS]: '🥫',
        [CategoriaAlimento.CONGELADOS]: '🧊',
        [CategoriaAlimento.OUTROS]: '❓'
    };

    return icones[categoria] || icones[CategoriaAlimento.OUTROS];
}

/**
 * Agrupa alimentos por categoria
 */
export function agruparPorCategoria<T extends { categoria?: CategoriaAlimento; nome: string }>(
    alimentos: T[]
): Record<CategoriaAlimento, T[]> {
    const agrupados = {} as Record<CategoriaAlimento, T[]>;

    // Inicializa todas as categorias
    Object.values(CategoriaAlimento).forEach(categoria => {
        agrupados[categoria] = [];
    });

    // Agrupa os alimentos
    alimentos.forEach(alimento => {
        const categoria = alimento.categoria || determinarCategoriaAutomatica(alimento.nome);
        agrupados[categoria].push(alimento);
    });

    return agrupados;
}

/**
 * Migra alimentos antigos sem categoria
 */
export function migrarCategoria(alimento: { nome: string; categoria?: CategoriaAlimento }): CategoriaAlimento {
    if (alimento.categoria && validarCategoria(alimento.categoria)) {
        return alimento.categoria;
    }

    return determinarCategoriaAutomatica(alimento.nome);
}

/**
 * Estatísticas de categorias
 */
export function obterEstatisticasCategorias<T extends { categoria?: CategoriaAlimento; nome: string }>(
    alimentos: T[]
): Array<{
    categoria: CategoriaAlimento;
    total: number;
    percentual: number;
    icone: string;
    cor: string;
}> {
    const agrupados = agruparPorCategoria(alimentos);
    const total = alimentos.length;

    return Object.values(CategoriaAlimento).map(categoria => ({
        categoria,
        total: agrupados[categoria].length,
        percentual: total > 0 ? (agrupados[categoria].length / total) * 100 : 0,
        icone: obterIconeCategoria(categoria),
        cor: obterCorCategoria(categoria)
    })).filter(stat => stat.total > 0)
        .sort((a, b) => b.total - a.total);
}