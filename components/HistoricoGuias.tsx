'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { 
  ArrowLeft, 
  Filter, 
  Download, 
  FileText, 
  Clock, 
  CheckCircle, 
  Package,
  Search,
  ChevronUp,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { GuiaAbastecimento, Instituicao } from '@/types';

type OrdenacaoTipo = 'dataGeracao' | 'instituicao' | 'status' | 'periodo';
type DirecaoOrdenacao = 'asc' | 'desc';

export default function HistoricoGuias() {
  const router = useRouter();
  const [guias, setGuias] = useState<GuiaAbastecimento[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [guiasFiltradas, setGuiasFiltradas] = useState<GuiaAbastecimento[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [statusSelecionado, setStatusSelecionado] = useState<string>('');
  const [instituicaoSelecionada, setInstituicaoSelecionada] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Ordenação
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>('dataGeracao');
  const [direcao, setDirecao] = useState<DirecaoOrdenacao>('desc');

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;

  useEffect(() => {
    carregarDados();
  }, []);

  const aplicarFiltros = useCallback(() => {
    let resultado = [...guias];

    // Filtro por busca (nome da instituição)
    if (busca.trim()) {
      resultado = resultado.filter(guia =>
        guia.instituicaoNome?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Filtro por status
    if (statusSelecionado) {
      resultado = resultado.filter(guia => guia.status === statusSelecionado);
    }

    // Filtro por instituição
    if (instituicaoSelecionada) {
      resultado = resultado.filter(guia => guia.instituicaoId === instituicaoSelecionada);
    }

    // Filtro por período
    if (dataInicio) {
      resultado = resultado.filter(guia => 
        new Date(guia.dataGeracao) >= new Date(dataInicio)
      );
    }

    if (dataFim) {
      resultado = resultado.filter(guia => 
        new Date(guia.dataGeracao) <= new Date(dataFim)
      );
    }

    // Ordenação
    resultado.sort((a, b) => {
      let valorA: string | Date | number;
      let valorB: string | Date | number;

      switch (ordenacao) {
        case 'dataGeracao':
          valorA = new Date(a.dataGeracao);
          valorB = new Date(b.dataGeracao);
          break;
        case 'instituicao':
          valorA = a.instituicaoNome || '';
          valorB = b.instituicaoNome || '';
          break;
        case 'status':
          valorA = a.status;
          valorB = b.status;
          break;
        case 'periodo':
          valorA = new Date(a.dataInicio);
          valorB = new Date(b.dataInicio);
          break;
        default:
          return 0;
      }

      if (valorA < valorB) return direcao === 'asc' ? -1 : 1;
      if (valorA > valorB) return direcao === 'asc' ? 1 : -1;
      return 0;
    });

    setGuiasFiltradas(resultado);
    setPaginaAtual(1);
  }, [guias, busca, statusSelecionado, instituicaoSelecionada, dataInicio, dataFim, ordenacao, direcao]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

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

  const alternarOrdenacao = (novaOrdenacao: OrdenacaoTipo) => {
    if (ordenacao === novaOrdenacao) {
      setDirecao(direcao === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenacao(novaOrdenacao);
      setDirecao('asc');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return <Clock className="w-4 h-4" />;
      case 'Finalizado':
        return <CheckCircle className="w-4 h-4" />;
      case 'Distribuído':
        return <Package className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return 'bg-yellow-100 text-yellow-800';
      case 'Finalizado':
        return 'bg-blue-100 text-blue-800';
      case 'Distribuído':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportarHistorico = () => {
    let conteudo = 'HISTÓRICO DE GUIAS DE ABASTECIMENTO\n';
    conteudo += '====================================\n\n';
    conteudo += `Total de guias: ${guiasFiltradas.length}\n`;
    conteudo += `Exportado em: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    if (statusSelecionado) conteudo += `Filtro por status: ${statusSelecionado}\n`;
    if (instituicaoSelecionada) {
      const inst = instituicoes.find(i => i.id === instituicaoSelecionada);
      conteudo += `Filtro por instituição: ${inst?.nome || 'N/A'}\n`;
    }
    if (dataInicio) conteudo += `Data inicial: ${new Date(dataInicio).toLocaleDateString('pt-BR')}\n`;
    if (dataFim) conteudo += `Data final: ${new Date(dataFim).toLocaleDateString('pt-BR')}\n`;

    conteudo += '\n';

    guiasFiltradas.forEach((guia, index) => {
      conteudo += `${index + 1}. ${guia.instituicaoNome || 'Instituição não encontrada'}\n`;
      conteudo += `   ID: ${guia.id}\n`;
      conteudo += `   Status: ${guia.status}\n`;
      conteudo += `   Período: ${new Date(guia.dataInicio).toLocaleDateString('pt-BR')} a ${new Date(guia.dataFim).toLocaleDateString('pt-BR')}\n`;
      conteudo += `   Gerado em: ${new Date(guia.dataGeracao).toLocaleDateString('pt-BR')}\n`;
      conteudo += `   Por: ${guia.usuarioGeracao}\n`;
      conteudo += `   Versão: ${guia.versao}\n`;
      conteudo += `   Dias planejados: ${guia.cardapiosDiarios.length}\n`;
      conteudo += `   Alimentos: ${guia.calculosDistribuicao.length}\n`;
      if (guia.observacoes) {
        conteudo += `   Observações: ${guia.observacoes}\n`;
      }
      conteudo += '\n';
    });

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-guias-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatarPeriodo = (inicio: string | Date, fim: string | Date) => {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    return `${dataInicio.toLocaleDateString('pt-BR')} - ${dataFim.toLocaleDateString('pt-BR')}`;
  };

  const limparFiltros = () => {
    setBusca('');
    setStatusSelecionado('');
    setInstituicaoSelecionada('');
    setDataInicio('');
    setDataFim('');
  };

  // Paginação
  const totalPaginas = Math.ceil(guiasFiltradas.length / ITENS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const guiasPaginadas = guiasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <main className="page-container">
          <div className="flex justify-center items-center h-64">
            <p className="text-center text-gray-500">Carregando histórico...</p>
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
            <h1 className="text-3xl font-bold text-[#4C6E5D]">Histórico de Guias</h1>
            <p className="text-gray-600 mt-1">Visualização cronológica de todas as guias geradas</p>
          </div>
          <button
            onClick={exportarHistorico}
            className="px-4 py-2 bg-[#4C6E5D] text-white rounded-md hover:bg-[#6B7F66] transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#4C6E5D]" />
              <h2 className="text-lg font-semibold text-[#4C6E5D]">Filtros</h2>
            </div>
            <button
              onClick={limparFiltros}
              className="text-sm text-gray-600 hover:text-[#4C6E5D] transition"
            >
              Limpar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar instituição
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome da instituição..."
                  className="w-full pl-10 pr-4 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusSelecionado}
                onChange={(e) => setStatusSelecionado(e.target.value)}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data inicial
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
                Data final
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
              />
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Mostrando <span className="font-semibold">{guiasPaginadas.length}</span> de{' '}
              <span className="font-semibold">{guiasFiltradas.length}</span> guias
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                Rascunho: {guiasFiltradas.filter(g => g.status === 'Rascunho').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                Finalizado: {guiasFiltradas.filter(g => g.status === 'Finalizado').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                Distribuído: {guiasFiltradas.filter(g => g.status === 'Distribuído').length}
              </span>
            </div>
          </div>
        </div>

        {/* Tabela de Guias */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {guiasFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma guia encontrada com os filtros selecionados</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho da tabela */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm font-medium text-gray-600">
                  <button
                    onClick={() => alternarOrdenacao('dataGeracao')}
                    className="flex items-center gap-1 hover:text-[#4C6E5D] transition"
                  >
                    Data de Geração
                    {ordenacao === 'dataGeracao' && (
                      direcao === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => alternarOrdenacao('instituicao')}
                    className="flex items-center gap-1 hover:text-[#4C6E5D] transition"
                  >
                    Instituição
                    {ordenacao === 'instituicao' && (
                      direcao === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => alternarOrdenacao('periodo')}
                    className="flex items-center gap-1 hover:text-[#4C6E5D] transition"
                  >
                    Período
                    {ordenacao === 'periodo' && (
                      direcao === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => alternarOrdenacao('status')}
                    className="flex items-center gap-1 hover:text-[#4C6E5D] transition"
                  >
                    Status
                    {ordenacao === 'status' && (
                      direcao === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <span>Usuário</span>
                  <span>Ações</span>
                </div>
              </div>

              {/* Corpo da tabela */}
              <div className="divide-y divide-gray-200">
                {guiasPaginadas.map((guia) => (
                  <div
                    key={guia.id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/guia-abastecimento/${guia.id}`)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(guia.dataGeracao).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(guia.dataGeracao).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-sm">{guia.instituicaoNome}</p>
                        <p className="text-xs text-gray-600">v{guia.versao}</p>
                      </div>

                      <div>
                        <p className="text-sm">{formatarPeriodo(guia.dataInicio, guia.dataFim)}</p>
                        <p className="text-xs text-gray-600">{guia.cardapiosDiarios.length} dias</p>
                      </div>

                      <div>
                        <span className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 w-fit ${getStatusColor(guia.status)}`}>
                          {getStatusIcon(guia.status)}
                          {guia.status}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm">{guia.usuarioGeracao}</p>
                      </div>

                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/guia-abastecimento/${guia.id}`);
                          }}
                          className="text-[#4C6E5D] hover:text-[#6B7F66] text-sm font-medium transition"
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Página {paginaAtual} de {totalPaginas}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                      disabled={paginaAtual === 1}
                      className={`px-3 py-1 rounded ${
                        paginaAtual === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className={`px-3 py-1 rounded ${
                        paginaAtual === totalPaginas
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}