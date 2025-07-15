import { promises as fs } from 'fs';
import path from 'path';
import { CategoriaAlimento, MAPEAMENTO_CATEGORIA_AUTOMATICO } from '../types/types';

interface AlimentoRaw {
  id?: string;
  _createdAt?: string;
  nome: string;
  fc: number | string;
  fcc: number | string;
  categoria?: CategoriaAlimento | string;
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
}

/**
 * Determina automaticamente a categoria de um alimento baseado no nome
 */
function determinarCategoriaAutomatica(nomeAlimento: string): CategoriaAlimento {
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

  // Busca por padrões específicos adicionais
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

  if (nomeNormalizado.includes('TEMPERO') ||
      nomeNormalizado.includes('SAL') ||
      nomeNormalizado.includes('PIMENTA')) {
    return CategoriaAlimento.CONDIMENTOS;
  }

  // Categoria padrão
  return CategoriaAlimento.OUTROS;
}

/**
 * Função principal de migração
 */
async function migrarAlimentosCategoria() {
  const alimentosPath = path.resolve(process.cwd(), 'app/api/alimentos.json');
  
  try {
    console.log('🔄 Iniciando migração de categorias...');
    
    // Ler arquivo atual
    const conteudoAtual = await fs.readFile(alimentosPath, 'utf-8');
    const alimentos: AlimentoRaw[] = JSON.parse(conteudoAtual);
    
    console.log(`📊 Total de alimentos encontrados: ${alimentos.length}`);
    
    let alimentosAtualizados = 0;
    let alimentosJaCategorizado = 0;
    
    // Processar cada alimento
    const alimentosMigrados = alimentos.map((alimento, index) => {
      console.log(`\n📝 Processando [${index + 1}/${alimentos.length}]: ${alimento.nome}`);
      
      // Verificar se já tem categoria válida
      if (alimento.categoria && Object.values(CategoriaAlimento).includes(alimento.categoria as CategoriaAlimento)) {
        console.log(`   ✅ Já categorizado como: ${alimento.categoria}`);
        alimentosJaCategorizado++;
        return alimento;
      }
      
      // Determinar categoria automaticamente
      const categoriaAutomatica = determinarCategoriaAutomatica(alimento.nome);
      console.log(`   🔍 Categoria determinada: ${categoriaAutomatica}`);
      
      alimentosAtualizados++;
      
      return {
        ...alimento,
        categoria: categoriaAutomatica,
        // Garantir que unidade_medida exista
        unidade_medida: alimento.unidade_medida || 'g',
        // Garantir que restricoesAlimentares exista
        restricoesAlimentares: alimento.restricoesAlimentares || []
      };
    });
    
    // Criar backup do arquivo original
    const backupPath = `${alimentosPath}.backup.${Date.now()}`;
    await fs.copyFile(alimentosPath, backupPath);
    console.log(`\n💾 Backup criado em: ${backupPath}`);
    
    // Salvar arquivo atualizado
    await fs.writeFile(alimentosPath, JSON.stringify(alimentosMigrados, null, 2), 'utf-8');
    
    console.log('\n✅ Migração concluída com sucesso!');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Total de alimentos: ${alimentos.length}`);
    console.log(`   - Já categorizados: ${alimentosJaCategorizado}`);
    console.log(`   - Atualizados: ${alimentosAtualizados}`);
    
    // Mostrar distribuição por categoria
    console.log('\n📈 Distribuição por categoria:');
    const distribuicao = alimentosMigrados.reduce((acc, alimento) => {
      const categoria = alimento.categoria || CategoriaAlimento.OUTROS;
      acc[categoria] = (acc[categoria] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(distribuicao)
      .sort(([,a], [,b]) => b - a)
      .forEach(([categoria, count]) => {
        console.log(`   ${categoria}: ${count} alimentos`);
      });
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  }
}

/**
 * Função para verificar a situação atual sem modificar o arquivo
 */
async function verificarCategorias() {
  const alimentosPath = path.resolve(process.cwd(), 'app/api/alimentos.json');
  
  try {
    const conteudoAtual = await fs.readFile(alimentosPath, 'utf-8');
    const alimentos: AlimentoRaw[] = JSON.parse(conteudoAtual);
    
    console.log('🔍 Verificando situação atual das categorias...\n');
    
    let comCategoria = 0;
    let semCategoria = 0;
    const distribuicao: Record<string, number> = {};
    const semCategoriaList: string[] = [];
    
    alimentos.forEach((alimento) => {
      if (alimento.categoria && Object.values(CategoriaAlimento).includes(alimento.categoria as CategoriaAlimento)) {
        comCategoria++;
        distribuicao[alimento.categoria] = (distribuicao[alimento.categoria] || 0) + 1;
      } else {
        semCategoria++;
        semCategoriaList.push(alimento.nome);
      }
    });
    
    console.log(`📊 Estatísticas atuais:`);
    console.log(`   - Total: ${alimentos.length} alimentos`);
    console.log(`   - Com categoria: ${comCategoria}`);
    console.log(`   - Sem categoria: ${semCategoria}`);
    
    if (Object.keys(distribuicao).length > 0) {
      console.log('\n📈 Distribuição atual por categoria:');
      Object.entries(distribuicao)
        .sort(([,a], [,b]) => b - a)
        .forEach(([categoria, count]) => {
          console.log(`   ${categoria}: ${count} alimentos`);
        });
    }
    
    if (semCategoriaList.length > 0) {
      console.log('\n❌ Alimentos sem categoria:');
      semCategoriaList.forEach((nome, index) => {
        const categoriasugerida = determinarCategoriaAutomatica(nome);
        console.log(`   ${index + 1}. ${nome} → (sugere: ${categoriasugerida})`);
      });
    }
    
    return { comCategoria, semCategoria, total: alimentos.length };
    
  } catch (error) {
    console.error('❌ Erro ao verificar categorias:', error);
    throw error;
  }
}

// Exportar funções para uso externo
export { migrarAlimentosCategoria, verificarCategorias, determinarCategoriaAutomatica };

// Se executado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const comando = args[0];
  
  if (comando === 'verificar') {
    verificarCategorias()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (comando === 'migrar') {
    migrarAlimentosCategoria()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('📋 Comandos disponíveis:');
    console.log('   npm run migrate-categorias verificar  - Verifica situação atual');
    console.log('   npm run migrate-categorias migrar     - Executa a migração');
    console.log('\n💡 Recomendação: Execute "verificar" primeiro para ver o que será alterado');
  }
}