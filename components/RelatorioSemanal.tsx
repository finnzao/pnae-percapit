import { useRouter } from 'next/navigation';
import { TrendingUp, Package, Calendar, ArrowRight } from 'lucide-react';
import { GuiaAbastecimento, CalculoDistribuicao } from '@/types';

interface RelatorioSemanalProps {
  distribuicaoSemanal: CalculoDistribuicao[];
  guias: GuiaAbastecimento[];
  carregando: boolean;
}

export default function RelatorioSemanal({ distribuicaoSemanal, guias, carregando }: RelatorioSemanalProps) {
  const router = useRouter();

  // Calcula totais
  const totalDistribuido = distribuicaoSemanal.reduce((acc, item) => acc + item.quantidadeTotal, 0);

  // Conta guias distribuídas nos últimos 7 dias
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(hoje.getDate() - 7);

  const guiasDistribuidasSemana = guias.filter(guia => {
    if (guia.status !== 'Distribuído') return false;
    const dataGeracao = new Date(guia.dataGeracao);
    return dataGeracao >= seteDiasAtras && dataGeracao <= hoje;
  }).length;

  // Top 5 alimentos mais distribuídos - CORRIGIDO
  const top5Alimentos = distribuicaoSemanal
    .filter((item) => item.alimentoId && item.alimentoNome) // Garantir que tem ID e nome
    .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal) // Ordenar por quantidade (maior primeiro)
    .slice(0, 5); // Pegar os top 5

  console.log('Debug RelatorioSemanal:', {
    distribuicaoSemanal,
    totalItens: distribuicaoSemanal.length,
    top5Alimentos,
    totalDistribuido
  });

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#4C6E5D] mb-1">
              Relatório Semanal de Distribuição
            </h2>
            <p className="text-sm text-gray-600">Últimos 7 dias</p>
          </div>
          <button
            onClick={() => router.push('/relatorios/distribuicao')}
            className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] transition-colors text-sm sm:text-base"
          >
            <span>Ver relatório completo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {carregando ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando dados...</p>
          </div>
        ) : distribuicaoSemanal.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma distribuição nos últimos 7 dias</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Cards de resumo - Responsivos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-xs sm:text-sm text-green-600">Total distribuído</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-800">
                  {totalDistribuido.toFixed(2)} kg
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-xs sm:text-sm text-blue-600">Guias distribuídas</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-800">
                  {guiasDistribuidasSemana}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <span className="text-xs sm:text-sm text-purple-600">Tipos de alimentos</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-800">
                  {distribuicaoSemanal.length}
                </p>
              </div>
            </div>

            {/* Top 5 alimentos - Responsivo */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Top {Math.min(5, top5Alimentos.length)} Alimentos Distribuídos
              </h3>

              {top5Alimentos.length === 0 ? (
                <div className="text-center py-4">
                  <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Nenhum alimento encontrado</p>
                </div>
              ) : (
                <>
                  {/* Versão Mobile - Lista simplificada */}
                  <div className="block sm:hidden space-y-2">
                    {top5Alimentos.map((alimento, index) => (
                      <div key={`${alimento.alimentoId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-[#4C6E5D] text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium">{alimento.alimentoNome || 'Nome não disponível'}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {alimento.quantidadeTotal.toFixed(1)} {alimento.unidadeMedida || 'kg'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Versão Tablet/Desktop - Com barra de progresso */}
                  <div className="hidden sm:block space-y-3">
                    {top5Alimentos.map((alimento, index) => (
                      <div key={`${alimento.alimentoId}-${index}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#4C6E5D] text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-sm">{alimento.alimentoNome || 'Nome não disponível'}</p>
                            <p className="text-sm text-gray-600">
                              {alimento.quantidadeTotal.toFixed(2)} {alimento.unidadeMedida || 'kg'}
                            </p>
                          </div>
                          <div className="mt-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#4C6E5D] h-2 rounded-full transition-all"
                              style={{
                                width: totalDistribuido > 0 ? `${(alimento.quantidadeTotal / totalDistribuido) * 100}%` : '0%'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {distribuicaoSemanal.length > 5 && (
                    <p className="text-sm text-gray-500 mt-4 text-center">
                      +{distribuicaoSemanal.length - 5} outros alimentos
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Ação para ver relatório completo - Responsivo */}
        {distribuicaoSemanal.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/relatorios/distribuicao')}
              className="w-full py-3 bg-[#4C6E5D] text-white rounded-lg hover:bg-[#6B7F66] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Ver Relatório Detalhado com Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}