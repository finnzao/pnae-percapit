'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, Filter, Download, TrendingUp, Package } from 'lucide-react';
import { GuiaAbastecimento, CalculoDistribuicao, Etapa, Instituicao } from '@/types';

interface DistribuicaoPorEtapa {
  etapa: Etapa;
  quantidade: number;
}

interface DistribuicaoDiaria {
  data: string;
  guias: GuiaAbastecimento[];
  alimentos: CalculoDistribuicao[];
}

export default function RelatorioDistribuicaoPage() {
  const router = useRouter();
  const [guias, setGuias] = useState<GuiaAbastecimento[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [carregando, setCarregando] = useState(true);

  //filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [etapaSelecionada, setEtapaSelecionada] = useState<Etapa | ''>('');
  const [instituicaoSelecionada, setInstituicaoSelecionada] = useState('');

  //dados
  const [distribuicaoTotal, setDistribuicaoTotal] = useState<CalculoDistribuicao[]>([]);
  const [distribuicaoPorEtapa, setDistribuicaoPorEtapa] = useState<DistribuicaoPorEtapa[]>([]);

  useEffect(() => {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);

    setDataFim(hoje.toISOString().split('T')[0]);
    setDataInicio(seteDiasAtras.toISOString().split('T')[0]);

    carregarDados();
  }, []);


  const carregarDados = async () => {
    try {
      const [resGuias, resInstituicoes] = await Promise.all([
        fetch('/api/guia-abastecimento'),
        fetch('/api/salvar-instituicao')
      ]);

      const dataGuias = await resGuias.json();
      const dataInstituicoes = await resInstituicoes.json();

      if (dataGuias.ok) setGuias(dataGuias.data);
      if (dataInstituicoes.ok) setInstituicoes(dataInstituicoes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  const processarDadosPorPeriodo = useCallback(() => {
    if (!dataInicio || !dataFim) return;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);

    const distribuicoesDiarias: DistribuicaoDiaria[] = [];
    const alimentosAgregados: Record<string, CalculoDistribuicao> = {};
    const etapasAgregadas: Record<Etapa, number> = {
      creche: 0,
      pre: 0,
      fundamental: 0,
      medio: 0
    };

    // Gera todos os dias no período
    const dataAtual = new Date(inicio);
    while (dataAtual <= fim) {
      const dataString = dataAtual.toISOString().split('T')[0];

      // Encontra guias ativas neste dia específico
      const guiasAtivas = guias.filter(guia => {
        if (guia.status !== 'Distribuído') return false;

        const inicioGuia = new Date(guia.dataInicio);
        const fimGuia = new Date(guia.dataFim);

        inicioGuia.setHours(0, 0, 0, 0);
        fimGuia.setHours(23, 59, 59, 999);

        // Verifica se a data atual está dentro do período da guia
        return dataAtual >= inicioGuia && dataAtual <= fimGuia;
      });

      // Filtra por instituição se selecionada
      const guiasFiltradas = instituicaoSelecionada
        ? guiasAtivas.filter(g => g.instituicaoId === instituicaoSelecionada)
        : guiasAtivas;

      // Processa distribuição para este dia
      const alimentosDoDia: CalculoDistribuicao[] = [];

      guiasFiltradas.forEach(guia => {
        const instituicao = instituicoes.find(i => i.id === guia.instituicaoId);
        let etapaInstituicao: Etapa = 'fundamental';

        if (instituicao) {
          if (instituicao.tipo === 'Creche') etapaInstituicao = 'creche';
          else if (instituicao.tipo === 'Centro de Educação Infantil') etapaInstituicao = 'pre';
        }

        // Filtra por etapa se selecionada
        if (etapaSelecionada && etapaInstituicao !== etapaSelecionada) return;

        // Verifica se tem cardápio para este dia específico
        const cardapioDoDia = guia.cardapiosDiarios.find(cd => {
          const dataCardapio = new Date(cd.data);
          dataCardapio.setHours(0, 0, 0, 0);
          return dataCardapio.getTime() === dataAtual.getTime();
        });

        if (cardapioDoDia) {
          // Processa distribuição proporcional para este dia
          const diasTotais = guia.cardapiosDiarios.length;

          guia.calculosDistribuicao.forEach(calculo => {
            const quantidadeDiaria = calculo.quantidadeTotal / diasTotais;

            // Agrega no total
            if (!alimentosAgregados[calculo.alimentoId]) {
              alimentosAgregados[calculo.alimentoId] = {
                ...calculo,
                quantidadeTotal: 0,
                detalhamentoRefeicoes: []
              };
            }

            alimentosAgregados[calculo.alimentoId].quantidadeTotal += quantidadeDiaria;
            etapasAgregadas[etapaInstituicao] += quantidadeDiaria;

            // Adiciona ao dia
            const alimentoExistente = alimentosDoDia.find(a => a.alimentoId === calculo.alimentoId);
            if (alimentoExistente) {
              alimentoExistente.quantidadeTotal += quantidadeDiaria;
            } else {
              alimentosDoDia.push({
                ...calculo,
                quantidadeTotal: quantidadeDiaria
              });
            }
          });
        }
      });

      if (alimentosDoDia.length > 0) {
        distribuicoesDiarias.push({
          data: dataString,
          guias: guiasFiltradas,
          alimentos: alimentosDoDia
        });
      }

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    setDistribuicaoTotal(Object.values(alimentosAgregados));

    const etapasArray: DistribuicaoPorEtapa[] = Object.entries(etapasAgregadas)
      .map(([etapa, quantidade]) => ({
        etapa: etapa as Etapa,
        quantidade
      }))
      .filter(e => e.quantidade > 0);

    setDistribuicaoPorEtapa(etapasArray);
  }, [dataInicio, dataFim, etapaSelecionada, instituicaoSelecionada, guias, instituicoes]);
  useEffect(() => {
    processarDadosPorPeriodo();
  }, [processarDadosPorPeriodo]);

  const exportarRelatorio = () => {
    let conteudo = 'RELATÓRIO DE DISTRIBUIÇÃO DE ALIMENTOS\n';
    conteudo += '=====================================\n\n';
    conteudo += `Período EXATO: ${dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início'} a ${dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Fim'}\n`;

    if (instituicaoSelecionada) {
      const inst = instituicoes.find(i => i.id === instituicaoSelecionada);
      conteudo += `Instituição: ${inst?.nome || 'Todas'}\n`;
    }

    if (etapaSelecionada) {
      conteudo += `Etapa: ${etapaSelecionada}\n`;
    }

    conteudo += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

    conteudo += 'RESUMO POR ETAPA\n';
    conteudo += '----------------\n';
    distribuicaoPorEtapa.forEach(etapa => {
      conteudo += `${etapa.etapa}: ${etapa.quantidade.toFixed(2)} kg\n`;
    });

    conteudo += '\nALIMENTOS DISTRIBUÍDOS NO PERÍODO\n';
    conteudo += '--------------------------------\n';
    distribuicaoTotal
      .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal)
      .forEach(alimento => {
        conteudo += `${alimento.alimentoNome}: ${alimento.quantidadeTotal.toFixed(2)} ${alimento.unidadeMedida}\n`;
      });

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-distribuicao-periodo-${dataInicio}-${dataFim}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalGeral = distribuicaoTotal.reduce((acc, item) => acc + item.quantidadeTotal, 0);

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <main className="page-container">
          <div className="flex justify-center items-center h-64">
            <p className="text-center text-gray-500">Carregando relatório...</p>
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
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#4C6E5D]">Relatório de Distribuição</h1>
            <p className="text-gray-600 mt-1">Análise por período exato selecionado</p>
          </div>
          <button
            onClick={exportarRelatorio}
            className="px-4 py-2 bg-[#4C6E5D] text-white rounded-md hover:bg-[#6B7F66] transition flex items-center gap-2"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
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
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etapa
              </label>
              <select
                value={etapaSelecionada}
                onChange={(e) => setEtapaSelecionada(e.target.value as Etapa | '')}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
              >
                <option value="">Todas</option>
                <option value="creche">Creche</option>
                <option value="pre">Pré-escola</option>
                <option value="fundamental">Ensino Fundamental</option>
                <option value="medio">Ensino Médio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instituição
              </label>
              <select
                value={instituicaoSelecionada}
                onChange={(e) => setInstituicaoSelecionada(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
              >
                <option value="">Todas</option>
                {instituicoes.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {dataInicio && dataFim && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Período selecionado:</strong> {new Date(dataInicio).toLocaleDateString('pt-BR')} até {new Date(dataFim).toLocaleDateString('pt-BR')}
                ({Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1} dias)
              </p>
            </div>
          )}
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-[#4C6E5D]" />
              <span className="text-sm text-gray-600">Total Distribuído</span>
            </div>
            <p className="text-2xl font-bold text-[#4C6E5D]">{totalGeral.toFixed(2)} kg</p>
            <p className="text-xs text-gray-500 mt-1">No período selecionado</p>
          </div>

          {distribuicaoPorEtapa.map((etapa, index) => (
            <div key={`${etapa.etapa}-${index}`} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-[#6B7F66]" />
                <span className="text-sm text-gray-600 capitalize">{etapa.etapa}</span>
              </div>
              <p className="text-2xl font-bold text-[#6B7F66]">{etapa.quantidade.toFixed(2)} kg</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalGeral > 0 ? ((etapa.quantidade / totalGeral) * 100).toFixed(1) : '0'}% do total
              </p>
            </div>
          ))}
        </div>

        {/* Tabela de Alimentos */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#4C6E5D]">Alimentos Distribuídos no Período</h2>
            <p className="text-sm text-gray-600 mt-1">
              Baseado nas datas exatas do período selecionado
            </p>
          </div>

          {distribuicaoTotal.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma distribuição encontrada no período selecionado</p>
              <p className="text-sm text-gray-400 mt-1">
                Verifique se existem guias ativas nas datas especificadas
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alimento</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% do Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Média Diária</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {distribuicaoTotal
                    .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal)
                    .map((alimento, index) => {
                      const percentual = (alimento.quantidadeTotal / totalGeral) * 100;
                      const diasPeriodo = dataInicio && dataFim ?
                        Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
                      const mediaDiaria = alimento.quantidadeTotal / diasPeriodo;

                      return (
                        <tr key={`${alimento.alimentoId}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {alimento.alimentoNome}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {alimento.quantidadeTotal.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                            {alimento.unidadeMedida}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                            <div className="flex items-center justify-end gap-2">
                              <span>{percentual.toFixed(1)}%</span>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-[#4C6E5D] h-2 rounded-full"
                                  style={{ width: `${percentual}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                            {mediaDiaria.toFixed(2)} {alimento.unidadeMedida}/dia
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}