'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, Plus, Edit2, Trash2, Search, Package, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Alimento, Etapa } from '@/types';
//import { usePreventDoubleClick } from '@/hooks/usePreventDoubleClick';
import { normalizarTexto } from '@/app/api/utils/alimentosUtils';

export default function AlimentosPage() {
  const router = useRouter();
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [alimentosFiltrados, setAlimentosFiltrados] = useState<Alimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [erro, setErro] = useState<string | null>(null);

  const ITEMS_POR_PAGINA = 10;
  const PAGINAS_VISIVEIS = 10;

  useEffect(() => {
    carregarAlimentos();
  }, []);

  const carregarAlimentos = async () => {
    try {
      const response = await fetch('/api/salvar-alimento');
      const data = await response.json();
      
      if (data.ok) {
        setAlimentos(data.data);
        setAlimentosFiltrados(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar alimentos:', error);
      setErro('Erro ao carregar alimentos');
    } finally {
      setCarregando(false);
    }
  };

  const executarBusca = () => {
    if (!busca.trim()) {
      setAlimentosFiltrados(alimentos);
      setPaginaAtual(1);
      return;
    }

    const buscaNormalizada = normalizarTexto(busca);
    
    const filtrados = alimentos.filter(alimento => {
      const nomeNormalizado = normalizarTexto(alimento.nome);
      // Debug - remover depois
      if (alimento.nome.toLowerCase().includes('víscera')) {
        console.log('Debug busca:', {
          nome: alimento.nome,
          nomeNormalizado,
          busca,
          buscaNormalizada,
          includes: nomeNormalizado.includes(buscaNormalizada)
        });
      }
      return nomeNormalizado.includes(buscaNormalizada);
    });
    
    setAlimentosFiltrados(filtrados);
    setPaginaAtual(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executarBusca();
    }
  };

  const totalPaginas = Math.ceil(alimentosFiltrados.length / ITEMS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITEMS_POR_PAGINA;
  const fim = inicio + ITEMS_POR_PAGINA;
  const alimentosPaginados = alimentosFiltrados.slice(inicio, fim);

  const excluirAlimento = async (nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o alimento "${nome}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/alimentos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
      });

      if (response.ok) {
        await carregarAlimentos();
      } else {
        const data = await response.json();
        setErro(data.error || 'Erro ao excluir alimento');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      setErro('Erro ao excluir alimento');
    }
  };

  const renderPerCapita = (alimento: Alimento, etapa: Etapa) => {
    const valor = alimento.perCapita[etapa];
    if (valor.status === 'disponivel') {
      return `${valor.valor}g`;
    }
    return 'N/A';
  };

  const calcularPaginasVisiveis = () => {
    const metadePaginas = Math.floor(PAGINAS_VISIVEIS / 2);
    let inicio = Math.max(1, paginaAtual - metadePaginas);
    const fim = Math.min(totalPaginas, inicio + PAGINAS_VISIVEIS - 1);

    if (fim - inicio + 1 < PAGINAS_VISIVEIS) {
      inicio = Math.max(1, fim - PAGINAS_VISIVEIS + 1);
    }

    const paginas = [];
    for (let i = inicio; i <= fim; i++) {
      paginas.push(i);
    }
    return paginas;
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <main className="page-container">
          <div className="flex justify-center items-center h-64">
            <p className="text-center text-gray-500">Carregando alimentos...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />
      
      <main className="page-container px-4 sm:px-6 lg:px-8">
        {/* Navegação */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar ao início</span>
          <span className="sm:hidden">Voltar</span>
        </button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#4C6E5D]">Alimentos</h1>
          <button
            onClick={() => router.push('/alimentos/cadastrarAlimento')}
            className="px-4 py-2 bg-[#4C6E5D] text-white rounded-md hover:bg-[#6B7F66] transition flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Alimento</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>

        {/* Barra de Busca */}
        <div className="mb-6">
          <div className="flex gap-2 max-w-full md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Buscar alimento..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
              />
            </div>
            <button
              onClick={executarBusca}
              className="px-4 py-2 bg-[#4C6E5D] text-white rounded-lg hover:bg-[#6B7F66] transition"
            >
              <Search className="w-5 h-5 sm:hidden" />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {erro}
          </div>
        )}

        {/* Tabela de Alimentos - Responsiva */}
        {alimentosPaginados.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-6">
              {busca ? 'Nenhum alimento encontrado com essa busca.' : 'Nenhum alimento cadastrado ainda.'}
            </p>
            {!busca && (
              <button
                onClick={() => router.push('/alimentos/cadastrar')}
                className="px-6 py-2 bg-[#4C6E5D] text-white rounded-md hover:bg-[#6B7F66] transition"
              >
                Cadastrar Primeiro Alimento
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Versão Mobile/Tablet - Cards */}
            <div className="block lg:hidden space-y-4">
              {alimentosPaginados.map((alimento, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-900">{alimento.nome}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/alimentos/editar/${encodeURIComponent(alimento.id)}`)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => excluirAlimento(alimento.nome)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">FC:</span>
                      <span className="ml-2 font-medium">{alimento.fc}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">FCC:</span>
                      <span className="ml-2 font-medium">{alimento.fcc}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Per Capita:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Creche: {renderPerCapita(alimento, 'creche')}</div>
                      <div>Pré: {renderPerCapita(alimento, 'pre')}</div>
                      <div>Fund.: {renderPerCapita(alimento, 'fundamental')}</div>
                      <div>Médio: {renderPerCapita(alimento, 'medio')}</div>
                    </div>
                  </div>
                  
                  {(alimento.limitada_menor3 || alimento.limitada_todas) && (
                    <div className="mt-3 flex gap-2">
                      {alimento.limitada_menor3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          -3 anos
                        </span>
                      )}
                      {alimento.limitada_todas && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Limitado
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Versão Desktop - Tabela */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        FC
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        FCC
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creche
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pré
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fund.
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Médio
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restrições
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {alimentosPaginados.map((alimento, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{alimento.nome}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {alimento.fc}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {alimento.fcc}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {renderPerCapita(alimento, 'creche')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {renderPerCapita(alimento, 'pre')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {renderPerCapita(alimento, 'fundamental')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {renderPerCapita(alimento, 'medio')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center gap-1">
                            {alimento.limitada_menor3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                -3
                              </span>
                            )}
                            {alimento.limitada_todas && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Lim
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => router.push(`/alimentos/editar/${encodeURIComponent(alimento.id)}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => excluirAlimento(alimento.nome)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginação Melhorada */}
            {totalPaginas > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setPaginaAtual(1)}
                    disabled={paginaAtual === 1}
                    className={`p-2 rounded ${
                      paginaAtual === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Primeira página"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronLeft className="w-4 h-4 -ml-3" />
                  </button>
                  
                  <button
                    onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className={`p-2 rounded ${
                      paginaAtual === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Primeira página sempre visível */}
                  {calcularPaginasVisiveis()[0] > 1 && (
                    <>
                      <button
                        onClick={() => setPaginaAtual(1)}
                        className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                      >
                        1
                      </button>
                      {calcularPaginasVisiveis()[0] > 2 && (
                        <span className="px-2 text-gray-500">
                          <MoreHorizontal className="w-4 h-4" />
                        </span>
                      )}
                    </>
                  )}

                  {/* Páginas visíveis */}
                  {calcularPaginasVisiveis().map(pagina => (
                    <button
                      key={pagina}
                      onClick={() => setPaginaAtual(pagina)}
                      className={`px-3 py-1 rounded ${
                        pagina === paginaAtual
                          ? 'bg-[#4C6E5D] text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pagina}
                    </button>
                  ))}

                  {/* Última página sempre visível */}
                  {calcularPaginasVisiveis()[calcularPaginasVisiveis().length - 1] < totalPaginas && (
                    <>
                      {calcularPaginasVisiveis()[calcularPaginasVisiveis().length - 1] < totalPaginas - 1 && (
                        <span className="px-2 text-gray-500">
                          <MoreHorizontal className="w-4 h-4" />
                        </span>
                      )}
                      <button
                        onClick={() => setPaginaAtual(totalPaginas)}
                        className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                      >
                        {totalPaginas}
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className={`p-2 rounded ${
                      paginaAtual === totalPaginas
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Próxima página"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setPaginaAtual(totalPaginas)}
                    disabled={paginaAtual === totalPaginas}
                    className={`p-2 rounded ${
                      paginaAtual === totalPaginas
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Última página"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <ChevronRight className="w-4 h-4 -ml-3" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}