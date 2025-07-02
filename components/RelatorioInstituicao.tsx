'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LoadingOverlay, { SectionLoading } from '@/components/LoadingOverlay';
import { ArrowLeft, Filter, Download, Building2, TrendingUp, Users, Package, AlertCircle, Calendar, Search } from 'lucide-react';
import { GuiaAbastecimento, Instituicao } from '@/types';

interface ConsumoInstituicao {
  instituicaoId: string;
  instituicaoNome: string;
  totalAlunos: number;
  quantidadeTotalDistribuida: number;
  consumoPorAluno: number;
  diasComDistribuicao: number;
  alimentosMaisConsumidos: {
    nome: string;
    quantidade: number;
  }[];
}

export default function RelatorioInstituicao() {
  const router = useRouter();
  const [guias, setGuias] = useState<GuiaAbastecimento[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);

  // Estados de loading
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingPesquisa, setLoadingPesquisa] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [ordenacao, setOrdenacao] = useState<'nome' | 'consumo' | 'perCapita'>('consumo');

  // Dados processados
  const [consumoPorInstituicao, setConsumoPorInstituicao] = useState<ConsumoInstituicao[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  // ✅ Função para carregar dados iniciais (executa só uma vez)
  const carregarDadosIniciais = useCallback(async () => {
    setLoadingInicial(true);
    setErro(null);
    
    try {
      console.log('🔄 Carregando dados iniciais...');
      
      const [resGuias, resInstituicoes] = await Promise.all([
        fetch('/api/guia-abastecimento'),
        fetch('/api/salvar-instituicao')
      ]);

      const dataGuias = await resGuias.json();
      const dataInstituicoes = await resInstituicoes.json();

      if (!dataGuias.ok) throw new Error('Erro ao carregar guias');
      if (!dataInstituicoes.ok) throw new Error('Erro ao carregar instituições');

      const guiasData = dataGuias.data || [];
      const instituicoesData = dataInstituicoes.data || [];

      console.log('✅ Dados carregados:', { guias: guiasData.length, instituicoes: instituicoesData.length });

      setGuias(guiasData);
      setInstituicoes(instituicoesData);

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setErro(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoadingInicial(false);
    }
  }, []);

  // ✅ Função de processamento (síncrona e pura)
  const processarDadosPorPeriodo = useCallback((
    guiasData: GuiaAbastecimento[], 
    instituicoesData: Instituicao[], 
    inicio: string, 
    fim: string, 
    ordem: 'nome' | 'consumo' | 'perCapita'
  ): ConsumoInstituicao[] => {
    console.log('🔄 Processando dados por período...', { inicio, fim, ordem });

    // Validação
    if (guiasData.length === 0 || instituicoesData.length === 0 || !inicio || !fim) {
      console.log('⚠️ Dados insuficientes para processamento');
      return [];
    }

    const dataInicioDate = new Date(inicio);
    const dataFimDate = new Date(fim);
    
    dataInicioDate.setHours(0, 0, 0, 0);
    dataFimDate.setHours(23, 59, 59, 999);

    const consumoPorInst: Record<string, ConsumoInstituicao> = {};
    const guiasDistribuidas = guiasData.filter(guia => guia.status === 'Distribuído');
    const diasContados = new Map<string, Set<string>>();

    console.log('📊 Guias distribuídas encontradas:', guiasDistribuidas.length);

    // Processa cada dia no período
    const dataAtual = new Date(dataInicioDate);
    while (dataAtual <= dataFimDate) {
      const guiasAtivasDia = guiasDistribuidas.filter(guia => {
        const inicioGuia = new Date(guia.dataInicio);
        const fimGuia = new Date(guia.dataFim);
        
        inicioGuia.setHours(0, 0, 0, 0);
        fimGuia.setHours(23, 59, 59, 999);
        
        return dataAtual >= inicioGuia && dataAtual <= fimGuia;
      });

      guiasAtivasDia.forEach(guia => {
        const instituicao = instituicoesData.find(i => i.id === guia.instituicaoId);
        if (!instituicao) return;

        if (!consumoPorInst[guia.instituicaoId]) {
          consumoPorInst[guia.instituicaoId] = {
            instituicaoId: guia.instituicaoId,
            instituicaoNome: instituicao.nome,
            totalAlunos: instituicao.totalAlunos,
            quantidadeTotalDistribuida: 0,
            consumoPorAluno: 0,
            diasComDistribuicao: 0,
            alimentosMaisConsumidos: []
          };
          diasContados.set(guia.instituicaoId, new Set());
        }

        const consumo = consumoPorInst[guia.instituicaoId];
        const diasInstituicao = diasContados.get(guia.instituicaoId)!;

        const cardapioDoDia = guia.cardapiosDiarios.find(cd => {
          const dataCardapio = new Date(cd.data);
          dataCardapio.setHours(0, 0, 0, 0);
          return dataCardapio.getTime() === dataAtual.getTime();
        });

        if (cardapioDoDia) {
          const chaveData = dataAtual.toISOString().split('T')[0];
          if (!diasInstituicao.has(chaveData)) {
            diasInstituicao.add(chaveData);
            consumo.diasComDistribuicao++;
          }

          const diasTotaisGuia = guia.cardapiosDiarios.length;
          
          guia.calculosDistribuicao.forEach(calc => {
            const quantidadeDiaria = calc.quantidadeTotal / diasTotaisGuia;
            consumo.quantidadeTotalDistribuida += quantidadeDiaria;

            const alimentoExistente = consumo.alimentosMaisConsumidos.find(a => a.nome === calc.alimentoNome);
            if (alimentoExistente) {
              alimentoExistente.quantidade += quantidadeDiaria;
            } else {
              consumo.alimentosMaisConsumidos.push({ 
                nome: calc.alimentoNome, 
                quantidade: quantidadeDiaria 
              });
            }
          });
        }
      });

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    // Finaliza cálculos
    Object.values(consumoPorInst).forEach(consumo => {
      consumo.consumoPorAluno = consumo.quantidadeTotalDistribuida / consumo.totalAlunos;
      consumo.alimentosMaisConsumidos.sort((a, b) => b.quantidade - a.quantidade);
      consumo.alimentosMaisConsumidos = consumo.alimentosMaisConsumidos.slice(0, 3);
    });

    // Ordena resultado
    const resultado = Object.values(consumoPorInst);
    switch (ordem) {
      case 'nome':
        resultado.sort((a, b) => a.instituicaoNome.localeCompare(b.instituicaoNome));
        break;
      case 'consumo':
        resultado.sort((a, b) => b.quantidadeTotalDistribuida - a.quantidadeTotalDistribuida);
        break;
      case 'perCapita':
        resultado.sort((a, b) => b.consumoPorAluno - a.consumoPorAluno);
        break;
    }

    console.log('✅ Processamento concluído:', resultado.length, 'instituições');
    return resultado;
  }, []);

  // ✅ Função para executar pesquisa (disparada pelo botão)
  const executarPesquisa = useCallback(async () => {
    if (!dataInicio || !dataFim) {
      setErro('Por favor, selecione o período inicial e final');
      return;
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      setErro('Data inicial deve ser anterior à data final');
      return;
    }

    setLoadingPesquisa(true);
    setErro(null);

    try {
      console.log('🔍 Executando pesquisa...', { dataInicio, dataFim, ordenacao });

      // Simula delay de processamento para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 500));

      const resultado = processarDadosPorPeriodo(guias, instituicoes, dataInicio, dataFim, ordenacao);
      
      setConsumoPorInstituicao(resultado);
      setDadosCarregados(true);

    } catch (error) {
      console.error('❌ Erro durante pesquisa:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao processar dados');
    } finally {
      setLoadingPesquisa(false);
    }
  }, [guias, instituicoes, dataInicio, dataFim, ordenacao, processarDadosPorPeriodo]);

  // ✅ Função para limpar pesquisa
  const limparPesquisa = useCallback(() => {
    setConsumoPorInstituicao([]);
    setDadosCarregados(false);
    setErro(null);
  }, []);

  // ✅ useEffect apenas para carregamento inicial
  useEffect(() => {
    // Define datas padrão (último mês)
    const hoje = new Date();
    const umMesAtras = new Date(hoje);
    umMesAtras.setMonth(hoje.getMonth() - 1);

    setDataFim(hoje.toISOString().split('T')[0]);
    setDataInicio(umMesAtras.toISOString().split('T')[0]);

    // Carrega dados iniciais
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  // Função de exportação
  const exportarRelatorio = useCallback(() => {
    if (consumoPorInstituicao.length === 0) {
      setErro('Nenhum dado para exportar. Execute uma pesquisa primeiro.');
      return;
    }

    let conteudo = 'RELATÓRIO DE CONSUMO POR INSTITUIÇÃO\n';
    conteudo += '===================================\n\n';
    conteudo += `Período: ${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}\n`;
    conteudo += `Ordenação: ${ordenacao === 'nome' ? 'Nome' : ordenacao === 'consumo' ? 'Consumo Total' : 'Consumo Per Capita'}\n`;
    conteudo += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

    const diasPeriodo = Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    conteudo += `Total de dias no período: ${diasPeriodo}\n\n`;

    consumoPorInstituicao.forEach((consumo, index) => {
      conteudo += `${index + 1}. ${consumo.instituicaoNome}\n`;
      conteudo += `   Total de alunos: ${consumo.totalAlunos}\n`;
      conteudo += `   Quantidade distribuída: ${consumo.quantidadeTotalDistribuida.toFixed(2)} kg\n`;
      conteudo += `   Consumo per capita: ${consumo.consumoPorAluno.toFixed(2)} kg/aluno\n`;
      conteudo += `   Dias com distribuição: ${consumo.diasComDistribuicao} de ${diasPeriodo} dias\n`;
      conteudo += `   Top alimentos: ${consumo.alimentosMaisConsumidos.map(a => `${a.nome} (${a.quantidade.toFixed(1)}kg)`).join(', ')}\n\n`;
    });

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-instituicoes-${dataInicio}-${dataFim}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [consumoPorInstituicao, dataInicio, dataFim, ordenacao]);

  //  Estatísticas calculadas
  const estatisticas = useMemo(() => {
    const totalDistribuido = consumoPorInstituicao.reduce((acc, item) => acc + item.quantidadeTotalDistribuida, 0);
    const totalAlunos = consumoPorInstituicao.reduce((acc, item) => acc + item.totalAlunos, 0);
    const mediaDiasDistribuicao = consumoPorInstituicao.length > 0 ? 
      consumoPorInstituicao.reduce((acc, item) => acc + item.diasComDistribuicao, 0) / consumoPorInstituicao.length : 0;
    
    const diasPeriodo = dataInicio && dataFim ? 
      Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;

    return {
      totalDistribuido,
      totalAlunos,
      mediaDiasDistribuicao,
      diasPeriodo,
      mediaPerCapita: totalAlunos > 0 ? totalDistribuido / totalAlunos : 0
    };
  }, [consumoPorInstituicao, dataInicio, dataFim]);

  // Validação de formulário
  const formularioValido = dataInicio && dataFim && new Date(dataInicio) <= new Date(dataFim);

  // Loading inicial - tela completa
  if (loadingInicial) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <LoadingOverlay 
          isLoading={true} 
          message="Carregando dados do sistema..." 
          overlay={true}
          size="lg"
        />
      </div>
    );
  }

  // Erro no carregamento inicial
  if (erro && !loadingPesquisa && !dadosCarregados) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <main className="page-container">
          <button
            onClick={() => router.push('/relatorios')}
            className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos relatórios</span>
          </button>
          
          <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-lg text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">Erro ao carregar dados</h2>
            <p className="mb-4">{erro}</p>
            <button
              onClick={carregarDadosIniciais}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Tentar Novamente
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />

      <main className="page-container">
        <button
          onClick={() => router.push('/relatorios')}
          className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos relatórios</span>
        </button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#4C6E5D]">Consumo por Instituição</h1>
            <p className="text-gray-600 mt-1">Análise por período selecionado</p>
          </div>
          <button
            onClick={exportarRelatorio}
            disabled={consumoPorInstituicao.length === 0 || loadingPesquisa}
            className={`px-4 py-2 rounded-md transition flex items-center gap-2 ${
              consumoPorInstituicao.length === 0 || loadingPesquisa
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#4C6E5D] text-white hover:bg-[#6B7F66]'
            }`}
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Seção de Filtros e Pesquisa */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[#4C6E5D]" />
            <h2 className="text-lg font-semibold text-[#4C6E5D]">Filtros de Pesquisa</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial *
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                disabled={loadingPesquisa}
                className={`w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] ${
                  loadingPesquisa ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final *
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                disabled={loadingPesquisa}
                className={`w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] ${
                  loadingPesquisa ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as 'nome' | 'consumo' | 'perCapita')}
                disabled={loadingPesquisa}
                className={`w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] ${
                  loadingPesquisa ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="consumo">Consumo Total</option>
                <option value="perCapita">Consumo Per Capita</option>
                <option value="nome">Nome da Instituição</option>
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={executarPesquisa}
              disabled={!formularioValido || loadingPesquisa}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                !formularioValido || loadingPesquisa
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#4C6E5D] text-white hover:bg-[#6B7F66]'
              }`}
            >
              {loadingPesquisa ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Pesquisando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Executar Pesquisa
                </>
              )}
            </button>

            {dadosCarregados && (
              <button
                onClick={limparPesquisa}
                disabled={loadingPesquisa}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Limpar Resultados
              </button>
            )}
          </div>

          {/* Informações do período */}
          {dataInicio && dataFim && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar className="w-4 h-4" />
                <p className="text-sm">
                  <strong>Período:</strong> {new Date(dataInicio).toLocaleDateString('pt-BR')} até {new Date(dataFim).toLocaleDateString('pt-BR')} 
                  ({estatisticas.diasPeriodo} dias)
                </p>
              </div>
            </div>
          )}

          {/* Mensagens de Erro */}
          {erro && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{erro}</span>
              <button
                onClick={() => setErro(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Cards de Resumo - Só mostra se tem dados */}
        {dadosCarregados && consumoPorInstituicao.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-8 h-8 text-[#4C6E5D]" />
                <span className="text-sm text-gray-600">Instituições</span>
              </div>
              <p className="text-2xl font-bold text-[#4C6E5D]">{consumoPorInstituicao.length}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-[#6B7F66]" />
                <span className="text-sm text-gray-600">Total Distribuído</span>
              </div>
              <p className="text-2xl font-bold text-[#6B7F66]">{estatisticas.totalDistribuido.toFixed(2)} kg</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-600">Total Alunos</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{estatisticas.totalAlunos}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-600">Média Per Capita</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{estatisticas.mediaPerCapita.toFixed(2)} kg</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-600">Dias Médios</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{estatisticas.mediaDiasDistribuicao.toFixed(1)}</p>
              <p className="text-xs text-gray-500">com distribuição</p>
            </div>
          </div>
        )}

        {/* Resultados da Pesquisa */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#4C6E5D]">Resultados da Pesquisa</h2>
            <p className="text-sm text-gray-600 mt-1">
              {dadosCarregados 
                ? `Baseado no período de ${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`
                : 'Execute uma pesquisa para ver os resultados'
              }
            </p>
          </div>

          {/* Loading da pesquisa */}
          {loadingPesquisa && (
            <div className="p-8">
              <SectionLoading 
                isLoading={true} 
                message="Processando dados da pesquisa..." 
                size="md"
              />
            </div>
          )}

          {/* Estado inicial - sem pesquisa */}
          {!dadosCarregados && !loadingPesquisa && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">Nenhuma pesquisa realizada</p>
              <p className="text-sm text-gray-400">
                Configure os filtros e clique em &quot; Executar Pesquisa &quot; para ver os resultados
              </p>
            </div>
          )}

          {/* Sem resultados */}
          {dadosCarregados && !loadingPesquisa && consumoPorInstituicao.length === 0 && (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">Nenhuma distribuição encontrada</p>
              <p className="text-sm text-gray-400">
                Verifique se existem guias ativas no período especificado
              </p>
            </div>
          )}

          {/* Resultados */}
          {dadosCarregados && !loadingPesquisa && consumoPorInstituicao.length > 0 && (
            <div className="divide-y divide-gray-200">
              {consumoPorInstituicao.map((consumo, index) => (
                <div key={consumo.instituicaoId} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#4C6E5D] text-white rounded-full flex items-center justify-center text-lg font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{consumo.instituicaoNome}</h3>
                        <p className="text-sm text-gray-600">{consumo.totalAlunos} alunos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#4C6E5D]">
                        {consumo.quantidadeTotalDistribuida.toFixed(2)} kg
                      </p>
                      <p className="text-sm text-gray-600">
                        {consumo.consumoPorAluno.toFixed(2)} kg/aluno
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Dias com distribuição:</span>
                      <span className="ml-2">{consumo.diasComDistribuicao} de {estatisticas.diasPeriodo}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">% do período:</span>
                      <span className="ml-2">
                        {estatisticas.diasPeriodo > 0 ? ((consumo.diasComDistribuicao / estatisticas.diasPeriodo) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Média diária:</span>
                      <span className="ml-2">
                        {(consumo.quantidadeTotalDistribuida / Math.max(consumo.diasComDistribuicao, 1)).toFixed(2)} kg/dia
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">% do total:</span>
                      <span className="ml-2">
                        {estatisticas.totalDistribuido > 0 ? ((consumo.quantidadeTotalDistribuida / estatisticas.totalDistribuido) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  </div>

                  {consumo.alimentosMaisConsumidos.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-gray-700 mb-2">Top alimentos no período:</p>
                      <div className="flex flex-wrap gap-2">
                        {consumo.alimentosMaisConsumidos.map((alimento, i) => (
                          <span
                            key={`${consumo.instituicaoId}-${alimento.nome}-${i}`}
                            className="px-3 py-1 bg-[#C8D5B9] text-[#4C6E5D] rounded-full text-sm"
                          >
                            {alimento.nome}: {alimento.quantidade.toFixed(1)}kg
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#4C6E5D] h-2 rounded-full"
                        style={{
                          width: `${estatisticas.totalDistribuido > 0 ? (consumo.quantidadeTotalDistribuida / estatisticas.totalDistribuido) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}