'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import {
  ArrowLeft,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  Building2,
  Clock,
  CheckCircle,
  Eye,
  FileText
} from 'lucide-react';
import { GuiaAbastecimento, Instituicao } from '@/types';

interface DiaCalendario {
  dia: number;
  mesAtual: boolean;
  data: Date;
  guias: GuiaAbastecimento[];
  quantidadeDistribuida: number;
  temDistribuicao: boolean;
}

interface EstatisticasMes {
  totalDistribuido: number;
  diasComDistribuicao: number;
  guiasAtivas: number;
  instituicoesAtendidas: number;
}

export default function CalendarioDistribuicao() {
  const router = useRouter();

  // Estados principais
  const [guias, setGuias] = useState<GuiaAbastecimento[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estado do calendário
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diasCalendario, setDiasCalendario] = useState<DiaCalendario[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [estatisticasMes, setEstatisticasMes] = useState<EstatisticasMes>({
    totalDistribuido: 0,
    diasComDistribuicao: 0,
    guiasAtivas: 0,
    instituicoesAtendidas: 0
  });

  // Filtros
  const [statusFiltro, setStatusFiltro] = useState<string>('');
  const [instituicaoFiltro, setInstituicaoFiltro] = useState('');




  useEffect(() => {
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

  const processarCalendario = useCallback(() => {
    const inicioMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
    const fimMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);

    // Ajusta para mostrar semana completa (domingo a sábado)
    const inicioCalendario = new Date(inicioMes);
    inicioCalendario.setDate(inicioCalendario.getDate() - inicioCalendario.getDay());

    const fimCalendario = new Date(fimMes);
    fimCalendario.setDate(fimCalendario.getDate() + (6 - fimCalendario.getDay()));

    const dias: DiaCalendario[] = [];
    const dataAtual = new Date(inicioCalendario);

    // Estatísticas do mês
    let totalDistribuidoMes = 0;
    const diasComDistribuicaoMes = new Set<string>();
    const guiasAtivasMes = new Set<string>();
    const instituicoesAtendidasMes = new Set<string>();

    while (dataAtual <= fimCalendario) {
      const diaData = new Date(dataAtual);
      const mesAtualBool = diaData.getMonth() === mesAtual.getMonth();

      // Filtra guias ativas neste dia
      const guiasAtivas = guias.filter(guia => {
        // Aplica filtros
        if (statusFiltro && guia.status !== statusFiltro) return false;
        if (instituicaoFiltro && guia.instituicaoId !== instituicaoFiltro) return false;

        // Verifica se a guia está ativa neste dia
        const inicioGuia = new Date(guia.dataInicio);
        const fimGuia = new Date(guia.dataFim);

        inicioGuia.setHours(0, 0, 0, 0);
        fimGuia.setHours(23, 59, 59, 999);
        diaData.setHours(0, 0, 0, 0);

        if (diaData < inicioGuia || diaData > fimGuia) return false;

        // Verifica se tem cardápio para este dia específico
        return guia.cardapiosDiarios.some(cd => {
          const dataCardapio = new Date(cd.data);
          dataCardapio.setHours(0, 0, 0, 0);
          return dataCardapio.getTime() === diaData.getTime();
        });
      });





      // Calcula quantidade distribuída no dia
      let quantidadeDistribuida = 0;
      guiasAtivas.forEach(guia => {
        const diasTotaisGuia = guia.cardapiosDiarios.length;
        if (diasTotaisGuia > 0) {
          guia.calculosDistribuicao.forEach(calc => {
            quantidadeDistribuida += calc.quantidadeTotal / diasTotaisGuia;
          });
        }

        // Para estatísticas do mês
        if (mesAtualBool) {
          guiasAtivasMes.add(guia.id);
          instituicoesAtendidasMes.add(guia.instituicaoId);
        }
      });

      const temDistribuicao = guiasAtivas.length > 0;

      // Para estatísticas do mês
      if (mesAtualBool && temDistribuicao) {
        totalDistribuidoMes += quantidadeDistribuida;
        diasComDistribuicaoMes.add(diaData.toISOString().split('T')[0]);
      }

      dias.push({
        dia: diaData.getDate(),
        mesAtual: mesAtualBool,
        data: new Date(diaData),
        guias: guiasAtivas,
        quantidadeDistribuida,
        temDistribuicao
      });

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    setDiasCalendario(dias);
    setEstatisticasMes({
      totalDistribuido: totalDistribuidoMes,
      diasComDistribuicao: diasComDistribuicaoMes.size,
      guiasAtivas: guiasAtivasMes.size,
      instituicoesAtendidas: instituicoesAtendidasMes.size
    });
  }, [mesAtual, guias, statusFiltro, instituicaoFiltro]);

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novoMes = new Date(mesAtual);
    if (direcao === 'anterior') {
      novoMes.setMonth(novoMes.getMonth() - 1);
    } else {
      novoMes.setMonth(novoMes.getMonth() + 1);
    }
    setMesAtual(novoMes);
    setDiaSelecionado(null);
  };

  const selecionarDia = (dia: number, mesAtualBool: boolean) => {
    if (mesAtualBool) {
      setDiaSelecionado(dia);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return 'bg-yellow-400';
      case 'Finalizado':
        return 'bg-blue-400';
      case 'Distribuído':
        return 'bg-green-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return <Clock className="w-3 h-3" />;
      case 'Finalizado':
        return <CheckCircle className="w-3 h-3" />;
      case 'Distribuído':
        return <Package className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const exportarCalendario = () => {
    let conteudo = 'CALENDÁRIO DE DISTRIBUIÇÃO\n';
    conteudo += '==========================\n\n';
    conteudo += `Mês: ${mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}\n`;
    conteudo += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

    if (statusFiltro) conteudo += `Filtro por status: ${statusFiltro}\n`;
    if (instituicaoFiltro) {
      const inst = instituicoes.find(i => i.id === instituicaoFiltro);
      conteudo += `Filtro por instituição: ${inst?.nome || 'N/A'}\n`;
    }

    conteudo += `\nESTATÍSTICAS DO MÊS\n`;
    conteudo += `-------------------\n`;
    conteudo += `Total distribuído: ${estatisticasMes.totalDistribuido.toFixed(2)} kg\n`;
    conteudo += `Dias com distribuição: ${estatisticasMes.diasComDistribuicao}\n`;
    conteudo += `Guias ativas: ${estatisticasMes.guiasAtivas}\n`;
    conteudo += `Instituições atendidas: ${estatisticasMes.instituicoesAtendidas}\n\n`;

    conteudo += `DISTRIBUIÇÕES POR DIA\n`;
    conteudo += `--------------------\n`;

    diasCalendario
      .filter(dia => dia.mesAtual && dia.temDistribuicao)
      .forEach(dia => {
        conteudo += `\n${dia.dia}/${mesAtual.getMonth() + 1}/${mesAtual.getFullYear()}:\n`;
        conteudo += `  Quantidade distribuída: ${dia.quantidadeDistribuida.toFixed(2)} kg\n`;
        conteudo += `  Guias ativas: ${dia.guias.length}\n`;

        dia.guias.forEach((guia, index) => {
          conteudo += `    ${index + 1}. ${guia.instituicaoNome} (${guia.status})\n`;
        });
      });

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario-distribuicao-${mesAtual.getFullYear()}-${(mesAtual.getMonth() + 1).toString().padStart(2, '0')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  useEffect(() => {
    if (guias.length > 0) {
      processarCalendario();
    }
  }, [mesAtual, guias, statusFiltro, instituicaoFiltro, processarCalendario]);

  const diaDetalhado = diaSelecionado ?
    diasCalendario.find(d => d.dia === diaSelecionado && d.mesAtual) : null;

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <main className="page-container">
          <div className="flex justify-center items-center h-64">
            <p className="text-center text-gray-500">Carregando calendário...</p>
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
            <h1 className="text-3xl font-bold text-[#4C6E5D]">Calendário de Distribuição</h1>
            <p className="text-gray-600 mt-1">Visualização mensal das distribuições realizadas</p>
          </div>
          <button
            onClick={exportarCalendario}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
              >
                <option value="">Todos</option>
                <option value="Rascunho">Rascunho</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Distribuído">Distribuído</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instituição
              </label>
              <select
                value={instituicaoFiltro}
                onChange={(e) => setInstituicaoFiltro(e.target.value)}
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

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-[#4C6E5D]" />
              <span className="text-sm text-gray-600">Total Distribuído</span>
            </div>
            <p className="text-2xl font-bold text-[#4C6E5D]">{estatisticasMes.totalDistribuido.toFixed(2)} kg</p>
            <p className="text-xs text-gray-500 mt-1">No mês atual</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-gray-600">Dias Ativos</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{estatisticasMes.diasComDistribuicao}</p>
            <p className="text-xs text-gray-500 mt-1">Com distribuição</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-green-600" />
              <span className="text-sm text-gray-600">Guias Ativas</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{estatisticasMes.guiasAtivas}</p>
            <p className="text-xs text-gray-500 mt-1">No período</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 text-purple-600" />
              <span className="text-sm text-gray-600">Instituições</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{estatisticasMes.instituicoesAtendidas}</p>
            <p className="text-xs text-gray-500 mt-1">Atendidas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            {/* Cabeçalho do Calendário */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#4C6E5D] capitalize">
                {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => navegarMes('anterior')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navegarMes('proximo')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid do Calendário */}
            <div className="grid grid-cols-7 gap-1">
              {/* Cabeçalho dos dias da semana */}
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
                <div key={index} className="text-center text-sm font-medium text-gray-600 py-2">
                  {dia}
                </div>
              ))}

              {/* Dias do calendário */}
              {diasCalendario.map((dia, index) => (
                <div
                  key={index}
                  onClick={() => selecionarDia(dia.dia, dia.mesAtual)}
                  className={`
                    min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all
                    ${dia.mesAtual ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                    ${diaSelecionado === dia.dia && dia.mesAtual ? 'ring-2 ring-[#4C6E5D]' : ''}
                    ${dia.temDistribuicao ? 'border-[#4C6E5D]' : 'border-gray-200'}
                  `}
                >
                  <div className="font-medium text-sm mb-1">{dia.dia}</div>

                  {dia.temDistribuicao && (
                    <div className="space-y-1">
                      <div className="text-xs text-[#4C6E5D] font-medium">
                        {dia.quantidadeDistribuida.toFixed(1)}kg
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dia.guias.slice(0, 2).map((guia, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full ${getStatusColor(guia.status)}`}
                            title={`${guia.instituicaoNome} - ${guia.status}`}
                          />
                        ))}
                      </div>
                      {dia.guias.length > 2 && (
                        <div className="text-xs text-gray-500">+{dia.guias.length - 2}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Legenda */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>Rascunho</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400 rounded"></div>
                <span>Finalizado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded"></div>
                <span>Distribuído</span>
              </div>
            </div>
          </div>

          {/* Detalhes do Dia Selecionado */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#4C6E5D] mb-4">
              {diaSelecionado ? (
                <>Detalhes do Dia {diaSelecionado}</>
              ) : (
                <>Selecione um Dia</>
              )}
            </h3>

            {diaDetalhado ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Data</p>
                  <p className="font-medium">
                    {diaDetalhado.data.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </p>
                </div>

                {diaDetalhado.temDistribuicao ? (
                  <>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">Quantidade Distribuída</p>
                      <p className="text-2xl font-bold text-green-800">
                        {diaDetalhado.quantidadeDistribuida.toFixed(2)} kg
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Guias Ativas ({diaDetalhado.guias.length})
                      </h4>
                      <div className="space-y-2">
                        {diaDetalhado.guias.map((guia) => (
                          <div
                            key={guia.id}
                            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/guia-abastecimento/${guia.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{guia.instituicaoNome}</p>
                                <p className="text-xs text-gray-600">v{guia.versao}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${guia.status === 'Rascunho' ? 'bg-yellow-100 text-yellow-800' :
                                  guia.status === 'Finalizado' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                  {getStatusIcon(guia.status)}
                                  {guia.status}
                                </span>
                                <Eye className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhuma distribuição neste dia</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Clique em um dia do calendário para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}