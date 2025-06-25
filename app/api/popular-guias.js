const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Função para calcular distribuição
function calcularDistribuicao(cardapio, totalAlunos) {
  const distribuicao = {};
  
  cardapio.refeicoes.forEach(refeicao => {
    refeicao.alimentos.forEach(alimento => {
      if (!distribuicao[alimento.alimentoId]) {
        distribuicao[alimento.alimentoId] = {
          alimentoId: alimento.alimentoId,
          alimentoNome: alimento.nome,
          quantidadeTotal: 0,
          unidadeMedida: 'kg',
          detalhamentoRefeicoes: []
        };
      }
      
      // Simula cálculo baseado no número de alunos
      const quantidadePorAluno = (alimento.quantidade || 1) / 100; // kg por aluno
      const quantidadeTotal = quantidadePorAluno * totalAlunos;
      
      distribuicao[alimento.alimentoId].quantidadeTotal += quantidadeTotal;
      distribuicao[alimento.alimentoId].detalhamentoRefeicoes.push({
        refeicaoId: refeicao.id,
        refeicaoNome: refeicao.nome,
        quantidade: quantidadeTotal
      });
    });
  });
  
  return Object.values(distribuicao);
}

// Função para criar uma guia
function criarGuia(instituicao, cardapios, dataInicio, dataFim, status = 'Rascunho') {
  const dias = [];
  const dataAtual = new Date(dataInicio);
  const dataFinal = new Date(dataFim);
  
  // Gera cardápios para cada dia
  while (dataAtual <= dataFinal) {
    // Pula fins de semana
    if (dataAtual.getDay() !== 0 && dataAtual.getDay() !== 6) {
      const cardapioAleatorio = cardapios[Math.floor(Math.random() * cardapios.length)];
      dias.push({
        data: new Date(dataAtual),
        cardapioId: cardapioAleatorio.id,
        cardapioNome: cardapioAleatorio.nome
      });
    }
    dataAtual.setDate(dataAtual.getDate() + 1);
  }
  
  // Calcula distribuição total
  const distribuicaoTotal = {};
  dias.forEach(dia => {
    const cardapio = cardapios.find(c => c.id === dia.cardapioId);
    if (cardapio) {
      const distribuicaoDia = calcularDistribuicao(cardapio, instituicao.totalAlunos);
      distribuicaoDia.forEach(item => {
        if (!distribuicaoTotal[item.alimentoId]) {
          distribuicaoTotal[item.alimentoId] = { ...item, quantidadeTotal: 0 };
        }
        distribuicaoTotal[item.alimentoId].quantidadeTotal += item.quantidadeTotal;
      });
    }
  });
  
  return {
    id: uuidv4(),
    instituicaoId: instituicao.id,
    instituicaoNome: instituicao.nome,
    dataInicio: dataInicio,
    dataFim: dataFim,
    cardapiosDiarios: dias,
    calculosDistribuicao: Object.values(distribuicaoTotal),
    observacoes: `Guia gerada automaticamente para ${instituicao.nome}`,
    versao: 1,
    dataGeracao: new Date(),
    usuarioGeracao: 'Sistema (Mock)',
    status
  };
}

// Função principal
async function popularGuias() {
  try {
    // Lê instituições e cardápios
    const instituicoesPath = path.join(process.cwd(), 'app/api/instituicoes.json');
    const cardapiosPath = path.join(process.cwd(), 'app/api/cardapios.json');
    
    const instituicoes = JSON.parse(fs.readFileSync(instituicoesPath, 'utf-8'));
    const cardapios = JSON.parse(fs.readFileSync(cardapiosPath, 'utf-8'));
    
    console.log(`✅ ${instituicoes.length} instituições carregadas`);
    console.log(`✅ ${cardapios.length} cardápios carregados`);
    
    const guias = [];
    const hoje = new Date();
    
    // Para cada instituição, cria guias para diferentes períodos
    instituicoes.forEach(instituicao => {
      // Guia do mês atual (Finalizada)
      const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMesAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      
      guias.push(criarGuia(
        instituicao,
        cardapios,
        inicioMesAtual,
        fimMesAtual,
        'Finalizado'
      ));
      
      // Guia do mês anterior (Distribuída)
      const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      
      guias.push(criarGuia(
        instituicao,
        cardapios,
        inicioMesAnterior,
        fimMesAnterior,
        'Distribuído'
      ));
      
      // Guia da semana atual (Rascunho)
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1); // Segunda-feira
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 4); // Sexta-feira
      
      guias.push(criarGuia(
        instituicao,
        cardapios,
        inicioSemana,
        fimSemana,
        'Rascunho'
      ));
    });
    
    // Guias especiais para teste de relatórios (últimos 7 dias)
    const guiasUltimos7Dias = [];
    for (let i = 0; i < 5; i++) {
      const dataGuia = new Date();
      dataGuia.setDate(dataGuia.getDate() - i);
      
      const instituicaoAleatoria = instituicoes[Math.floor(Math.random() * instituicoes.length)];
      
      guiasUltimos7Dias.push(criarGuia(
        instituicaoAleatoria,
        cardapios,
        dataGuia,
        dataGuia,
        'Distribuído'
      ));
    }
    
    guias.push(...guiasUltimos7Dias);
    
    // Salva as guias
    const guiasPath = path.join(process.cwd(), 'app/api/guias-abastecimento.json');
    fs.writeFileSync(guiasPath, JSON.stringify(guias, null, 2));
    
    console.log(`✅ ${guias.length} guias criadas com sucesso!`);
    
    // Mostra resumo
    const resumo = {
      rascunho: guias.filter(g => g.status === 'Rascunho').length,
      finalizado: guias.filter(g => g.status === 'Finalizado').length,
      distribuido: guias.filter(g => g.status === 'Distribuído').length
    };
    
    console.log('\n📊 Resumo das guias:');
    console.log(`  - Rascunho: ${resumo.rascunho}`);
    console.log(`  - Finalizado: ${resumo.finalizado}`);
    console.log(`  - Distribuído: ${resumo.distribuido}`);
    
  } catch (error) {
    console.error('❌ Erro ao popular guias:', error);
  }
}

// Executa o script
popularGuias();