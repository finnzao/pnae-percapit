'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, Filter, Download, TrendingUp, Package } from 'lucide-react';
import { GuiaAbastecimento, CalculoDistribuicao, Etapa, Instituicao } from '@/types';

interface DistribuicaoPorEtapa {
  etapa: Etapa;
  quantidade: number;
}

export default function RelatorioDistribuicaoPage() {
  const router = useRouter();
  const [guias, setGuias] = useState<GuiaAbastecimento[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [etapaSelecionada, setEtapaSelecionada] = useState<Etapa | ''>('');
  const [instituicaoSelecionada, setInstituicaoSelecionada] = useState('');

  // Dados processados
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

  useEffect(() => {
    processarDados();
  }, [guias, dataInicio, dataFim, etapaSelecionada, instituicaoSelecionada]);

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

  const processarDados = () => {
    function normalizarData(data: Date) {
      const nova = new Date(data);
      nova.setHours(0, 0, 0, 0);
      return nova;
    }

    const inicio = dataInicio ? normalizarData(new Date(dataInicio)) : null;
    const fim = dataFim ? normalizarData(new Date(dataFim)) : null;

    const guiasFiltradas = guias.filter(guia => {
      if (guia.status !== 'Distribuído') return false;
      const dataGeracao = new Date(guia.dataGeracao);
      if (inicio && dataGeracao < inicio) return false;
      if (fim && dataGeracao > fim) return false;
      if (instituicaoSelecionada && guia.instituicaoId !== instituicaoSelecionada) return false;
      return true;
    });

    const alimentosAgregados: Record<string, CalculoDistribuicao> = {};
    const etapasAgregadas: Record<Etapa, number> = {
      creche: 0,
      pre: 0,
      fundamental: 0,
      medio: 0
    };

    guiasFiltradas.forEach(guia => {
      const instituicao = instituicoes.find(i => i.id === guia.instituicaoId);
      let etapaInstituicao: Etapa = 'fundamental';
      if (instituicao) {
        if (instituicao.tipo === 'Creche') etapaInstituicao = 'creche';
        else if (instituicao.tipo === 'Centro de Educação Infantil') etapaInstituicao = 'pre';
      }

      guia.calculosDistribuicao.forEach(calculo => {
        if (etapaSelecionada && etapaInstituicao !== etapaSelecionada) return;

        if (!alimentosAgregados[calculo.alimentoId]) {
          alimentosAgregados[calculo.alimentoId] = {
            ...calculo,
            quantidadeTotal: 0,
            detalhamentoRefeicoes: []
          };
        }

        alimentosAgregados[calculo.alimentoId].quantidadeTotal += calculo.quantidadeTotal;
        etapasAgregadas[etapaInstituicao] += calculo.quantidadeTotal;
      });
    });

    setDistribuicaoTotal(Object.values(alimentosAgregados));

    const etapasArray: DistribuicaoPorEtapa[] = Object.entries(etapasAgregadas)
      .map(([etapa, quantidade]) => ({
        etapa: etapa as Etapa,
        quantidade
      }))
      .filter(e => e.quantidade > 0);

    setDistribuicaoPorEtapa(etapasArray);
  };

  const exportarRelatorio = () => {
    let conteudo = 'RELATÓRIO DE DISTRIBUIÇÃO DE ALIMENTOS\n';
    conteudo += '=====================================\n\n';
    conteudo += `Período: ${dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início'} a ${dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Fim'}\n`;

    if (instituicaoSelecionada) {
      const inst = instituicoes.find(i => i.id === instituicaoSelecionada);
      conteudo += `Instituição: ${inst?.nome || 'Todas'}\n`;
    }

    if (etapaSelecionada) {
      conteudo += `Etapa: ${etapaSelecionada}\n`;
    }

    conteudo += '\nRESUMO POR ETAPA\n';
    conteudo += '----------------\n';
    distribuicaoPorEtapa.forEach(etapa => {
      conteudo += `${etapa.etapa}: ${etapa.quantidade.toFixed(2)} kg\n`;
    });

    conteudo += '\nALIMENTOS DISTRIBUÍDOS\n';
    conteudo += '---------------------\n';
    distribuicaoTotal
      .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal)
      .forEach(alimento => {
        conteudo += `${alimento.alimentoNome}: ${alimento.quantidadeTotal.toFixed(2)} ${alimento.unidadeMedida}\n`;
      });

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-distribuicao-${new Date().toISOString().split('T')[0]}.txt`;
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
            <p className="text-gray-600 mt-1">Análise detalhada dos alimentos distribuídos</p>
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
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-[#4C6E5D]" />
              <span className="text-sm text-gray-600">Total Distribuído</span>
            </div>
            <p className="text-2xl font-bold text-[#4C6E5D]">{totalGeral.toFixed(2)} kg</p>
          </div>

          {distribuicaoPorEtapa.map((etapa, index) => (
            <div key={`${etapa.etapa}-${index}`} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-[#6B7F66]" />
                <span className="text-sm text-gray-600 capitalize">{etapa.etapa}</span>
              </div>
              <p className="text-2xl font-bold text-[#6B7F66]">{etapa.quantidade.toFixed(2)} kg</p>
            </div>
          ))}
        </div>

        {/* Tabela de Alimentos */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#4C6E5D]">Alimentos Distribuídos</h2>
          </div>

          {distribuicaoTotal.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma distribuição encontrada com os filtros selecionados</p>
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {distribuicaoTotal
                    .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal)
                    .map((alimento, index) => {
                      const percentual = (alimento.quantidadeTotal / totalGeral) * 100;
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
