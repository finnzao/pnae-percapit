import { promises as fs } from 'fs';
import path from 'path';
import { CategoriaAlimento, MAPEAMENTO_CATEGORIA_AUTOMATICO } from '../types/types';

interface AlimentoComCategoria {
  id?: string;
  nome: string;
  categoria: CategoriaAlimento;
  fc: number;
  fcc: number;
  perCapita: {
    creche: { status: string; valor?: unknown };
    pre: { status: string; valor?: unknown };
    fundamental: { status: string; valor?: unknown };
    medio: { status: string; valor?: unknown };
  };
  limitada_menor3?: boolean;
  limitada_todas?: boolean;
  unidade_medida?: string;
  restricoesAlimentares?: string[];
  _createdAt?: string;
}

/**
 * Aplicar categoria automaticamente baseada no mapeamento
 */
export function aplicarCategoriaAutomatica(nomeAlimento: string): CategoriaAlimento {
  const nome = nomeAlimento.toUpperCase().trim();

  // 1. Busca exata
  if (MAPEAMENTO_CATEGORIA_AUTOMATICO[nome]) {
    return MAPEAMENTO_CATEGORIA_AUTOMATICO[nome];
  }

  // 2. Busca por inclusão de palavras-chave
  for (const [palavra, categoria] of Object.entries(MAPEAMENTO_CATEGORIA_AUTOMATICO)) {
    if (nome.includes(palavra)) {
      return categoria;
    }
  }

  // 3. Padrões específicos para melhor categorização
  const padroes: Record<string, CategoriaAlimento> = {
    // Proteínas
    'CARNE|FRANGO|PEIXE|OVO|LINGUIÇA|MÚSCULO': CategoriaAlimento.PROTEINAS,
    
    // Laticínios  
    'LEITE|QUEIJO|IOGURTE|MANTEIGA|MARGARINA': CategoriaAlimento.LATICINIOS,
    
    // Hortifrútis
    'TOMATE|BATATA|CEBOLA|ALHO|CENOURA|COUVE|ALFACE|BANANA|MAÇÃ|LARANJA|LIMÃO': CategoriaAlimento.HORTIFRUTI,
    
    // Grãos e cereais
    'MILHO|AVEIA|QUINOA|LENTILHA|GRÃO|FARINHA': CategoriaAlimento.GRAOS_CEREAIS,
    
    // Bebidas
    'SUCO|ÁGUA|REFRIGERANTE|BEBIDA': CategoriaAlimento.BEBIDAS,
    
    // Panificação
    'PÃO|BOLO|BISCOITO|MASSA': CategoriaAlimento.PANIFICACAO,
    
    // Doces e sobremesas
    'DOCE|AÇÚCAR|MEL|SOBREMESA': CategoriaAlimento.DOCES_SOBREMESAS,
    
    // Condimentos
    'TEMPERO|SAL|PIMENTA|VINAGRE|ÓLEO|AZEITE': CategoriaAlimento.CONDIMENTOS,
    
    // Conservas
    'ENLATADO|CONSERVA|SARDINHA': CategoriaAlimento.CONSERVAS,
    
    // Congelados
    'CONGELADO|GELADO': CategoriaAlimento.CONGELADOS
  };

  for (const [pattern, categoria] of Object.entries(padroes)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(nome)) {
      return categoria;
    }
  }

  return CategoriaAlimento.OUTROS;
}

/**
 * Verificar se um alimento precisa de categorização manual
 */
export function precisaCategoriaManual(nomeAlimento: string): {
  precisaManual: boolean;
  categoria: CategoriaAlimento;
  confianca: 'alta' | 'media' | 'baixa';
  sugestoes: CategoriaAlimento[];
} {
  const categoria = aplicarCategoriaAutomatica(nomeAlimento);
  const nome = nomeAlimento.toUpperCase().trim();
  
  // Verificar confiança na categorização
  let confianca: 'alta' | 'media' | 'baixa' = 'baixa';
  
  if (MAPEAMENTO_CATEGORIA_AUTOMATICO[nome]) {
    confianca = 'alta';
  } else {
    // Verificar se contém palavras-chave conhecidas
    const contemPalavraChave = Object.keys(MAPEAMENTO_CATEGORIA_AUTOMATICO)
      .some(palavra => nome.includes(palavra));
    
    if (contemPalavraChave) {
      confianca = 'media';
    }
  }
  
  // Gerar sugestões alternativas
  const sugestoes: CategoriaAlimento[] = [];
  
  if (categoria === CategoriaAlimento.OUTROS) {
    // Se foi categorizado como "Outros", sugere categorias mais prováveis
    sugestoes.push(
      CategoriaAlimento.ABASTECIMENTO,
      CategoriaAlimento.HORTIFRUTI,
      CategoriaAlimento.PROTEINAS
    );
  }
  
  const precisaManual = confianca === 'baixa' || categoria === CategoriaAlimento.OUTROS;
  
  return {
    precisaManual,
    categoria,
    confianca,
    sugestoes
  };
}

/**
 * Executar migração completa com relatório detalhado
 */
export async function executarMigracaoCompleta() {
  const alimentosPath = path.resolve(process.cwd(), 'app/api/alimentos.json');
  
  console.log('🚀 Iniciando migração completa de categorias...\n');
  
  try {
    // Ler dados atuais
    const conteudo = await fs.readFile(alimentosPath, 'utf-8');
    const alimentos = JSON.parse(conteudo);
    
    console.log(`📊 Total de alimentos: ${alimentos.length}\n`);
    
    // Categorizar cada alimento
    const alimentosMigrados: AlimentoComCategoria[] = [];
    const relatorio = {
      total: alimentos.length,
      jaCategorizado: 0,
      categorizadoAutomatico: 0,
      categoriadoManual: 0,
      distribuicao: {} as Record<CategoriaAlimento, number>,
      manualReview: [] as Array<{
        nome: string;
        categoriaAtual: CategoriaAlimento;
        sugestoes: CategoriaAlimento[];
        confianca: string;
      }>
    };
    
    for (let i = 0; i < alimentos.length; i++) {
      const alimento = alimentos[i];
      const progresso = `[${i + 1}/${alimentos.length}]`;
      
      console.log(`${progresso} Processando: ${alimento.nome}`);
      
      let categoria: CategoriaAlimento;
      
      // Verificar se já tem categoria válida
      if (alimento.categoria && Object.values(CategoriaAlimento).includes(alimento.categoria)) {
        categoria = alimento.categoria;
        relatorio.jaCategorizado++;
        console.log(`   ✅ Já categorizado: ${categoria}`);
      } else {
        // Aplicar categorização automática
        const analise = precisaCategoriaManual(alimento.nome);
        categoria = analise.categoria;
        
        if (analise.precisaManual) {
          relatorio.categoriadoManual++;
          relatorio.manualReview.push({
            nome: alimento.nome,
            categoriaAtual: categoria,
            sugestoes: analise.sugestoes,
            confianca: analise.confianca
          });
          console.log(`   ⚠️  Categoria automática (${analise.confianca} confiança): ${categoria}`);
        } else {
          relatorio.categorizadoAutomatico++;
          console.log(`   🔄 Categorizado automaticamente: ${categoria}`);
        }
      }
      
      // Atualizar distribuição
      relatorio.distribuicao[categoria] = (relatorio.distribuicao[categoria] || 0) + 1;
      
      // Criar alimento migrado
      alimentosMigrados.push({
        ...alimento,
        categoria,
        unidade_medida: alimento.unidade_medida || 'g',
        restricoesAlimentares: alimento.restricoesAlimentares || []
      });
    }
    
    // Criar backup
    const backupPath = `${alimentosPath}.backup.${new Date().toISOString().split('T')[0]}`;
    await fs.copyFile(alimentosPath, backupPath);
    console.log(`\n💾 Backup criado: ${backupPath}`);
    
    // Salvar dados migrados
    await fs.writeFile(alimentosPath, JSON.stringify(alimentosMigrados, null, 2), 'utf-8');
    
    // Gerar relatório final
    console.log('\n📈 RELATÓRIO FINAL DA MIGRAÇÃO');
    console.log('================================');
    console.log(`✅ Total processado: ${relatorio.total} alimentos`);
    console.log(`📋 Já categorizados: ${relatorio.jaCategorizado}`);
    console.log(`🤖 Categorizados automaticamente: ${relatorio.categorizadoAutomatico}`);
    console.log(`⚠️  Requerem revisão manual: ${relatorio.categoriadoManual}`);
    
    console.log('\n📊 DISTRIBUIÇÃO POR CATEGORIA:');
    Object.entries(relatorio.distribuicao)
      .sort(([,a], [,b]) => b - a)
      .forEach(([categoria, count]) => {
        const percentual = ((count / relatorio.total) * 100).toFixed(1);
        console.log(`   ${categoria}: ${count} (${percentual}%)`);
      });
    
    if (relatorio.manualReview.length > 0) {
      console.log('\n⚠️  ALIMENTOS PARA REVISÃO MANUAL:');
      relatorio.manualReview.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.nome}`);
        console.log(`      Categoria atual: ${item.categoriaAtual} (${item.confianca} confiança)`);
        if (item.sugestoes.length > 0) {
          console.log(`      Sugestões: ${item.sugestoes.join(', ')}`);
        }
      });
      
      console.log('\n💡 Dica: Revise manualmente os alimentos acima para melhor precisão.');
    }
    
    console.log('\n✅ Migração concluída com sucesso!');
    
    return relatorio;
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  }
}

/**
 * Adicionar mapeamentos personalizados
 */
export function adicionarMapeamentoPersonalizado(
  mapeamentos: Record<string, CategoriaAlimento>
): Record<string, CategoriaAlimento> {
  return {
    ...MAPEAMENTO_CATEGORIA_AUTOMATICO,
    ...mapeamentos
  };
}

/**
 * Validar categoria de um alimento
 */
export function validarCategoriaAlimento(categoria: string): categoria is CategoriaAlimento {
  return Object.values(CategoriaAlimento).includes(categoria as CategoriaAlimento);
}

/**
 * Obter estatísticas do arquivo atual
 */
export async function obterEstatisticasAtuais() {
  const alimentosPath = path.resolve(process.cwd(), 'app/api/alimentos.json');
  
  try {
    const conteudo = await fs.readFile(alimentosPath, 'utf-8');
    const alimentos = JSON.parse(conteudo);
    
    const stats = {
      total: alimentos.length,
      comCategoria: 0,
      semCategoria: 0,
      distribuicao: {} as Record<string, number>,
      categoriesUsadas: new Set<string>()
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    alimentos.forEach((alimento: any) => {
      if (alimento.categoria && validarCategoriaAlimento(alimento.categoria)) {
        stats.comCategoria++;
        stats.distribuicao[alimento.categoria] = (stats.distribuicao[alimento.categoria] || 0) + 1;
        stats.categoriesUsadas.add(alimento.categoria);
      } else {
        stats.semCategoria++;
      }
    });
    
    return {
      ...stats,
      percentualCategorizado: (stats.comCategoria / stats.total) * 100,
      categoriesUsadas: Array.from(stats.categoriesUsadas)
    };
    
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw error;
  }
}