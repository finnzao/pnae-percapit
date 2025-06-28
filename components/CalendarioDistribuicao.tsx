"use client"
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

  // Calcula totais baseado no período exato dos últimos 7 dias
  const totalDistribuido = distribuicaoSemanal.reduce((acc, item) => acc + item.quantidadeTotal, 0);

  // Conta dias com distribuição nos últimos 7 dias (método exato)
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(hoje.getDate() - 7);

  hoje.setHours(23, 59, 59, 999);
  seteDiasAtras.setHours(0, 0, 0, 0);

  // Calcula dias únicos com distribuição no período
  const diasComDistribuicao = new Set<string>();
  const dataAtual = new Date(seteDiasAtras);

  while (dataAtual <= hoje) {
    const dataString = dataAtual.toISOString().split('T')[0];

    // Verifica se há guias ativas neste dia específico
    const temDistribuicaoNoDia = guias.some(guia => {
      if (guia.status !== 'Distribuído') return false;

      const inicioGuia = new Date(guia.dataInicio);
      const fimGuia = new Date(guia.dataFim);
      inicioGuia.setHours(0, 0, 0, 0);
      fimGuia.setHours(23, 59, 59, 999);

      // Verifica se a data atual está no período da guia
      if (dataAtual < inicioGuia || dataAtual > fimGuia) return false;

      // Verifica se tem cardápio para este dia específico
      return guia.cardapiosDiarios.some(cd => {
        const dataCardapio = new Date(cd.data);
        dataCardapio.setHours(0, 0, 0, 0);
        const dataCheck = new Date(dataAtual);
        dataCheck.setHours(0, 0, 0, 0);
        return dataCardapio.getTime() === dataCheck.getTime();
      });
    });

    if (temDistribuicaoNoDia) {
      diasComDistribuicao.add(dataString);
    }

    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  // Conta guias únicas que tiveram distribuição no período
  const guiasUnicasDistribuidas = new Set<string>();
  guias.forEach(guia => {
    if (guia.status !== 'Distribuído') return;

    const inicioGuia = new Date(guia.dataInicio);
    const fimGuia = new Date(guia.dataFim);
    inicioGuia.setHours(0, 0, 0, 0);
    fimGuia.setHours(23, 59, 59, 999);

    // Verifica se a guia teve algum dia ativo no período
    if (inicioGuia <= hoje && fimGuia >= seteDiasAtras) {
      guiasUnicasDistribuidas.add(guia.id);
    }
  });

  // Top 5 alimentos mais distribuídos (únicos por ID)
  const top5Alimentos = [...distribuicaoSemanal]
    .filter((a) => !!a.alimentoId)
    .reduce((acc, curr) => {
      if (!acc.find((a) => a.alimentoId === curr.alimentoId)) {
        acc.push(curr);
      }
      return acc;
    }, [] as CalculoDistribuicao[])
    .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal)
    .slice(0, 5);

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#4C6E5D] mb-1">
              Relatório Semanal de Distribuição
            </h2>
            <p className="text-sm text-gray-600">
              Últimos 7 dias - Período exato: {seteDiasAtras.toLocaleDateString('pt-BR')} a {hoje.toLocaleDateString('pt-BR')}
            </p>
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
            <p className="text-sm text-gray-400 mt-1">
              Baseado em datas exatas de cardápios ativos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Cards de resumo - Responsivos */}
            <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-1 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-xs sm:text-sm text-green-600">Total distribuído</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-800">
                  {totalDistribuido.toFixed(2)} kg
                </p>
                <p className="text-xs text-green-600 mt-1">No período selecionado</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-xs sm:text-sm text-blue-600">Guias ativas</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-800">
                  {guiasUnicasDistribuidas.size}
                </p>
                <p className="text-xs text-blue-600 mt-1">Com distribuição efetiva</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <span className="text-xs sm:text-sm text-purple-600">Tipos de alimentos</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-800">
                  {distribuicaoSemanal.length}
                </p>
                <p className="text-xs text-purple-600 mt-1">Únicos distribuídos</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <span className="text-xs sm:text-sm text-amber-600">Dias ativos</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-amber-800">
                  {diasComDistribuicao.size}
                </p>
                <p className="text-xs text-amber-600 mt-1">De 7 possíveis</p>
              </div>
            </div>

            {/* Top 5 alimentos - Responsivo */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Top 5 Alimentos Distribuídos no Período
              </h3>

              {/* Versão Mobile - Lista simplificada */}
              <div className="block sm:hidden space-y-2">
                {top5Alimentos.map((alimento, index) => (
                  <div key={`${alimento.alimentoId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-[#4C6E5D] text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium">{alimento.alimentoNome}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {alimento.quantidadeTotal.toFixed(1)} {alimento.unidadeMedida}
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
                        <p className="font-medium text-sm">{alimento.alimentoNome}</p>
                        <p className="text-sm text-gray-600">
                          {alimento.quantidadeTotal.toFixed(2)} {alimento.unidadeMedida}
                        </p>
                      </div>
                      <div className="mt-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#4C6E5D] h-2 rounded-full transition-all"
                          style={{
                            width: `${totalDistribuido > 0 ? (alimento.quantidadeTotal / totalDistribuido) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                        <span>{((alimento.quantidadeTotal / totalDistribuido) * 100).toFixed(1)}% do total</span>
                        <span>{(alimento.quantidadeTotal / Math.max(diasComDistribuicao.size, 1)).toFixed(1)} {alimento.unidadeMedida}/dia</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {distribuicaoSemanal.length > 5 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  +{distribuicaoSemanal.length - 5} outros alimentos distribuídos no período
                </p>
              )}
            </div>
          </div>
        )}

        {/* Informação adicional sobre o método de cálculo */}
        {distribuicaoSemanal.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Método de Cálculo:</strong> Os valores são calculados baseados nos dias exatos em que houve distribuição efetiva,
              considerando apenas os cardápios programados para cada data específica no período selecionado.
            </p>
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
              Ver Relatório Detalhado com Filtros Personalizados
            </button>
          </div>
        )}
      </div>
    </div>
  );
}