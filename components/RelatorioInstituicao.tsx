'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LoadingOverlay, { SectionLoading } from '@/components/LoadingOverlay';
import { useLoading } from '@/hooks/useLoading';
import { useDebounce } from '@/hooks/useDebounce';
import { ArrowLeft, Filter, Download, Building2, TrendingUp, Users, Package, AlertCircle } from 'lucide-react';
import { GuiaAbastecimento, Instituicao } from '@/types';

interface ConsumoInstituicao {
  instituicaoId: string;
  instituicaoNome: string;
  totalAlunos: number;
  quantidadeTotalDistribuida: number;
  consumoPorAluno: number;
  numeroGuias: number;
  ultimaDistribuicao: Date | null;
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

  // Função para processar dados (memoizada para evitar recriação)
  const processarDados = useMemo(() => {
    return async (
      guiasData: GuiaAbastecimento[], 
      instituicoesData: Instituicao[], 
      inicio: string, 
      fim: string, 
      ordem: 'nome' | 'consumo' | 'perCapita'
    ) => {
      if (guiasData.length === 0 || instituicoesData.length === 0) {
        setConsumoPorInstituicao([]);
        return [];
      }

      return filterLoading.execute(async () => {
        // Simula processamento (remover em produção se não necessário)
        await new Promise(resolve => setTimeout(resolve, 200));

        const dataInicioDate = inicio ? new Date(inicio) : null;
        const dataFimDate = fim ? new Date(fim) : null;

        // Agrupa dados por instituição
        const consumoPorInst: Record<string, ConsumoInstituicao> = {};

        // Filtra guias pelo período
        const guiasFiltradas = guiasData.filter(guia => {
          if (guia.status !== 'Distribuído') return false;
          const dataGeracao = new Date(guia.dataGeracao);
          if (dataInicioDate && dataGeracao < dataInicioDate) return false;
          if (dataFimDate && dataGeracao > dataFimDate) return false;
          return true;
        });

        guiasFiltradas.forEach(guia => {
          const instituicao = instituicoesData.find(i => i.id === guia.instituicaoId);
          if (!instituicao) return;

          if (!consumoPorInst[guia.instituicaoId]) {
            consumoPorInst[guia.instituicaoId] = {
              instituicaoId: guia.instituicaoId,
              instituicaoNome: instituicao.nome,
              totalAlunos: instituicao.totalAlunos,
              quantidadeTotalDistribuida: 0,
              consumoPorAluno: 0,
              numeroGuias: 0,
              ultimaDistribuicao: null,
              alimentosMaisConsumidos: []
            };
          }

          const consumo = consumoPorInst[guia.instituicaoId];
          consumo.numeroGuias++;

          // Calcula total distribuído
          const totalGuia = guia.calculosDistribuicao.reduce(
            (acc, calc) => acc + calc.quantidadeTotal, 0
          );
          consumo.quantidadeTotalDistribuida += totalGuia;

          // Atualiza última distribuição
          const dataGeracao = new Date(guia.dataGeracao);
          if (!consumo.ultimaDistribuicao || dataGeracao > consumo.ultimaDistribuicao) {
            consumo.ultimaDistribuicao = dataGeracao;
          }

          // Agrega alimentos mais consumidos
          const alimentosMap: Record<string, number> = {};
          guia.calculosDistribuicao.forEach(calc => {
            if (!alimentosMap[calc.alimentoNome]) {
              alimentosMap[calc.alimentoNome] = 0;
            }
            alimentosMap[calc.alimentoNome] += calc.quantidadeTotal;
          });

          // Atualiza lista de alimentos mais consumidos
          Object.entries(alimentosMap).forEach(([nome, quantidade]) => {
            const alimentoExistente = consumo.alimentosMaisConsumidos.find(a => a.nome === nome);
            if (alimentoExistente) {
              alimentoExistente.quantidade += quantidade;
            } else {
              consumo.alimentosMaisConsumidos.push({ nome, quantidade });
            }
          });
        });

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
      processarDados(guias, instituicoes, debouncedDataInicio, debouncedDataFim, debouncedOrdenacao);
    }
  }, [guias, instituicoes, debouncedDataInicio, debouncedDataFim, debouncedOrdenacao, processarDados]);

  const exportarRelatorio = useCallback(() => {
    let conteudo = 'RELATÓRIO DE CONSUMO POR INSTITUIÇÃO\n';
    conteudo += '===================================\n\n';
    conteudo += `Período: ${dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início'} a ${dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Fim'}\n`;
    conteudo += `Ordenação: ${ordenacao === 'nome' ? 'Nome' : ordenacao === 'consumo' ? 'Consumo Total' : 'Consumo Per Capita'}\n\n`;

    consumoPorInstituicao.forEach((consumo, index) => {
      conteudo += `${index + 1}. ${consumo.instituicaoNome}\n`;
      conteudo += `   Total de alunos: ${consumo.totalAlunos}\n`;
      conteudo += `   Quantidade distribuída: ${consumo.quantidadeTotalDistribuida.toFixed(2)} kg\n`;
      conteudo += `   Consumo per capita: ${consumo.consumoPorAluno.toFixed(2)} kg/aluno\n`;
      conteudo += `   Número de guias: ${consumo.numeroGuias}\n`;
      if (consumo.ultimaDistribuicao) {
        conteudo += `   Última distribuição: ${consumo.ultimaDistribuicao.toLocaleDateString('pt-BR')}\n`;
      }
      conteudo += `   Top alimentos: ${consumo.alimentosMaisConsumidos.map(a => `${a.nome} (${a.quantidade.toFixed(1)}kg)`).join(', ')}\n\n`;
    });

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-instituicoes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [consumoPorInstituicao, dataInicio, dataFim, ordenacao]);

  const totalGeral = useMemo(() => {
    return consumoPorInstituicao.reduce((acc, item) => acc + item.quantidadeTotalDistribuida, 0);
  }, [consumoPorInstituicao]);

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
            <p className="text-gray-600 mt-1">Análise comparativa do consumo entre instituições</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <p className="text-2xl font-bold text-[#6B7F66]">{totalGeral.toFixed(2)} kg</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-gray-600">Total Alunos</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {consumoPorInstituicao.reduce((acc, item) => acc + item.totalAlunos, 0)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <span className="text-sm text-gray-600">Média Per Capita</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {consumoPorInstituicao.length > 0 ?
                (consumoPorInstituicao.reduce((acc, item) => acc + item.consumoPorAluno, 0) / consumoPorInstituicao.length).toFixed(2)
                : '0.00'
              } kg
            </p>
          </div>
        </div>

        {/* Lista de Instituições */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#4C6E5D]">Ranking de Consumo</h2>
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
              <p className="text-gray-500">Nenhuma distribuição encontrada com os filtros selecionados</p>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Guias distribuídas:</span>
                      <span className="ml-2">{consumo.numeroGuias}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Última distribuição:</span>
                      <span className="ml-2">
                        {consumo.ultimaDistribuicao ?
                          consumo.ultimaDistribuicao.toLocaleDateString('pt-BR')
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">% do total:</span>
                      <span className="ml-2">
                        {totalGeral > 0 ? ((consumo.quantidadeTotalDistribuida / totalGeral) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  </div>

                  {consumo.alimentosMaisConsumidos.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-gray-700 mb-2">Top alimentos consumidos:</p>
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
                          width: `${totalGeral > 0 ? (consumo.quantidadeTotalDistribuida / totalGeral) * 100 : 0}%`
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