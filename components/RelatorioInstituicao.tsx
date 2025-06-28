'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LoadingOverlay, { SectionLoading } from '@/components/LoadingOverlay';
import { useLoading } from '@/hooks/useLoading';
import { useDebounce } from '@/hooks/useDebounce';
import { ArrowLeft, Filter, Download, Building2, TrendingUp, Users, Package, AlertCircle, Calendar } from 'lucide-react';
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

interface CarregamentoResult {
  guias: GuiaAbastecimento[];
  instituicoes: Instituicao[];
}

export default function RelatorioInstituicao() {
  const router = useRouter();
  const [guias, setGuias] = useState<GuiaAbastecimento[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);

  // Estados de loading separados com tipos específicos
  const initialLoading = useLoading<CarregamentoResult>({ initialLoading: true });
  const filterLoading = useLoading<ConsumoInstituicao[]>();

  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [ordenacao, setOrdenacao] = useState<'nome' | 'consumo' | 'perCapita'>('consumo');

  // Debounce dos filtros para evitar muitas requisições
  const debouncedDataInicio = useDebounce(dataInicio, 500);
  const debouncedDataFim = useDebounce(dataFim, 500);
  const debouncedOrdenacao = useDebounce(ordenacao, 300);

  // Dados processados
  const [consumoPorInstituicao, setConsumoPorInstituicao] = useState<ConsumoInstituicao[]>([]);

  // Função para carregar dados iniciais (sem dependências que mudam)
  const carregarDados = useCallback(async () => {
    return initialLoading.execute(async () => {
      const [resGuias, resInstituicoes] = await Promise.all([
        fetch('/api/guia-abastecimento'),
        fetch('/api/salvar-instituicao')
      ]);

      const dataGuias = await resGuias.json();
      const dataInstituicoes = await resInstituicoes.json();

      const guiasData = dataGuias.ok ? dataGuias.data : [];
      const instituicoesData = dataInstituicoes.ok ? dataInstituicoes.data : [];

      setGuias(guiasData);
      setInstituicoes(instituicoesData);

      return { guias: guiasData, instituicoes: instituicoesData };
    });
  }, []); // Sem dependências - só executa uma vez

  // Função para processar dados por período exato (memoizada para evitar recriação)
  const processarDadosPorPeriodo = useMemo(() => {
    return async (
      guiasData: GuiaAbastecimento[], 
      instituicoesData: Instituicao[], 
      inicio: string, 
      fim: string, 
      ordem: 'nome' | 'consumo' | 'perCapita'
    ) => {
      if (guiasData.length === 0 || instituicoesData.length === 0 || !inicio || !fim) {
        setConsumoPorInstituicao([]);
        return [];
      }

      return filterLoading.execute(async () => {
        // Simula processamento (remover em produção se não necessário)
        await new Promise(resolve => setTimeout(resolve, 200));

        const dataInicioDate = new Date(inicio);
        const dataFimDate = new Date(fim);
        
        // Ajusta para início e fim do dia
        dataInicioDate.setHours(0, 0, 0, 0);
        dataFimDate.setHours(23, 59, 59, 999);

        // Agrupa dados por instituição
        const consumoPorInst: Record<string, ConsumoInstituicao> = {};

        // Filtra guias que estão distribuídas
        const guiasDistribuidas = guiasData.filter(guia => guia.status === 'Distribuído');

        // Processa cada dia no período
        const dataAtual = new Date(dataInicioDate);
        while (dataAtual <= dataFimDate) {
          // Encontra guias ativas neste dia específico
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
            }

            const consumo = consumoPorInst[guia.instituicaoId];

            // Verifica se tem cardápio para este dia específico
            const cardapioDoDia = guia.cardapiosDiarios.find(cd => {
              const dataCardapio = new Date(cd.data);
              dataCardapio.setHours(0, 0, 0, 0);
              return dataCardapio.getTime() === dataAtual.getTime();
            });

            if (cardapioDoDia) {
              // Conta o dia como um dia com distribuição
              const jaContouDia = new Set<string>();
              const chaveData = `${guia.instituicaoId}-${dataAtual.toISOString().split('T')[0]}`;
              
              if (!jaContouDia.has(chaveData)) {
                consumo.diasComDistribuicao++;
                jaContouDia.add(chaveData);
              }

              // Calcula quantidade proporcional para este dia
              const diasTotaisGuia = guia.cardapiosDiarios.length;
              
              guia.calculosDistribuicao.forEach(calc => {
                const quantidadeDiaria = calc.quantidadeTotal / diasTotaisGuia;
                consumo.quantidadeTotalDistribuida += quantidadeDiaria;

                // Agrega alimentos mais consumidos
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

        // Calcula consumo per capita e ordena alimentos
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

        setConsumoPorInstituicao(resultado);
        return resultado;
      }, false);
    };
  }, [filterLoading]);

  // Efeito para carregar dados iniciais (apenas uma vez)
  useEffect(() => {
    const hoje = new Date();
    const umMesAtras = new Date(hoje);
    umMesAtras.setMonth(hoje.getMonth() - 1);

    setDataFim(hoje.toISOString().split('T')[0]);
    setDataInicio(umMesAtras.toISOString().split('T')[0]);

    carregarDados();
  }, []); // Sem dependências - executa apenas uma vez

  // Efeito para processar dados quando filtros mudarem (com debounce)
  useEffect(() => {
    // Só processa se já temos dados carregados
    if (guias.length > 0 && instituicoes.length > 0) {
      processarDadosPorPeriodo(guias, instituicoes, debouncedDataInicio, debouncedDataFim, debouncedOrdenacao);
    }
  }, [guias, instituicoes, debouncedDataInicio, debouncedDataFim, debouncedOrdenacao, processarDadosPorPeriodo]);

  const exportarRelatorio = useCallback(() => {
    let conteudo = 'RELATÓRIO DE CONSUMO POR INSTITUIÇÃO\n';
    conteudo += '===================================\n\n';
    conteudo += `Período EXATO: ${dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início'} a ${dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Fim'}\n`;
    conteudo += `Ordenação: ${ordenacao === 'nome' ? 'Nome' : ordenacao === 'consumo' ? 'Consumo Total' : 'Consumo Per Capita'}\n`;
    conteudo += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

    const diasPeriodo = dataInicio && dataFim ? 
      Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;
    
    conteudo += `Total de dias no período: ${diasPeriodo}\n\n`;

    consumoPorInstituicao.forEach((consumo, index) => {
      conteudo += `${index + 1}. ${consumo.instituicaoNome}\n`;
      conteudo += `   Total de alunos: ${consumo.totalAlunos}\n`;
      conteudo += `   Quantidade distribuída no período: ${consumo.quantidadeTotalDistribuida.toFixed(2)} kg\n`;
      conteudo += `   Consumo per capita no período: ${consumo.consumoPorAluno.toFixed(2)} kg/aluno\n`;
      conteudo += `   Dias com distribuição: ${consumo.diasComDistribuicao} de ${diasPeriodo} dias (${((consumo.diasComDistribuicao / diasPeriodo) * 100).toFixed(1)}%)\n`;
      conteudo += `   Média diária: ${(consumo.quantidadeTotalDistribuida / Math.max(consumo.diasComDistribuicao, 1)).toFixed(2)} kg/dia\n`;
      conteudo += `   Top alimentos: ${consumo.alimentosMaisConsumidos.map(a => `${a.nome} (${a.quantidade.toFixed(1)}kg)`).join(', ')}\n\n`;
    });

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-instituicoes-periodo-${dataInicio}-${dataFim}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [consumoPorInstituicao, dataInicio, dataFim, ordenacao]);

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

  // Loading inicial - tela completa
  if (initialLoading.isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <LoadingOverlay 
          isLoading={true} 
          message="Carregando dados do relatório..." 
          overlay={true}
          size="lg"
        />
      </div>
    );
  }

  // Erro no carregamento inicial
  if (initialLoading.hasError) {
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
            <p className="mb-4">{initialLoading.error}</p>
            <button
              onClick={carregarDados}
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
            <p className="text-gray-600 mt-1">Análise por período exato selecionado</p>
          </div>
          <button
            onClick={exportarRelatorio}
            disabled={filterLoading.isLoading}
            className={`px-4 py-2 rounded-md transition flex items-center gap-2 ${
              filterLoading.isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#4C6E5D] text-white hover:bg-[#6B7F66]'
            }`}
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[#4C6E5D]" />
            <h2 className="text-lg font-semibold text-[#4C6E5D]">Filtros</h2>
            {filterLoading.isLoading && (
              <SectionLoading 
                isLoading={true} 
                message="Aplicando filtros..." 
                size="sm"
                className="ml-4 py-0"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                disabled={filterLoading.isLoading}
                className={`w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] ${
                  filterLoading.isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                disabled={filterLoading.isLoading}
                className={`w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] ${
                  filterLoading.isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
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
                disabled={filterLoading.isLoading}
                className={`w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] ${
                  filterLoading.isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="consumo">Consumo Total</option>
                <option value="perCapita">Consumo Per Capita</option>
                <option value="nome">Nome da Instituição</option>
              </select>
            </div>
          </div>

          {/* Informações do período */}
          {dataInicio && dataFim && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar className="w-4 h-4" />
                <p className="text-sm">
                  <strong>Período selecionado:</strong> {new Date(dataInicio).toLocaleDateString('pt-BR')} até {new Date(dataFim).toLocaleDateString('pt-BR')} 
                  ({estatisticas.diasPeriodo} dias)
                </p>
              </div>
            </div>
          )}

          {/* Indicador de debounce ativo */}
          {(dataInicio !== debouncedDataInicio || dataFim !== debouncedDataFim || ordenacao !== debouncedOrdenacao) && (
            <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              Aguardando para aplicar filtros...
            </div>
          )}
        </div>

        {/* Erro nos filtros */}
        {filterLoading.hasError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Erro ao processar filtros</p>
              <p className="text-sm">{filterLoading.error}</p>
            </div>
            <button
              onClick={() => filterLoading.clearError()}
              className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Cards de Resumo */}
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

        {/* Lista de Instituições */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#4C6E5D]">Ranking de Consumo no Período</h2>
            <p className="text-sm text-gray-600 mt-1">
              Baseado nas datas exatas do período selecionado
            </p>
          </div>

          {/* Loading durante processamento dos filtros */}
          {filterLoading.isLoading && (
            <div className="p-8">
              <SectionLoading 
                isLoading={true} 
                message="Processando dados..." 
                size="md"
              />
            </div>
          )}

          {/* Conteúdo quando não está carregando */}
          {!filterLoading.isLoading && consumoPorInstituicao.length === 0 && (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma distribuição encontrada no período selecionado</p>
              <p className="text-sm text-gray-400 mt-1">
                Verifique se existem guias ativas nas datas especificadas
              </p>
            </div>
          )}

          {!filterLoading.isLoading && consumoPorInstituicao.length > 0 && (
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

                  {/* Barra de progresso visual */}
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