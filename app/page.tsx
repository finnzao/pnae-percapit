'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import DashboardCalendar from '@/components/DashboardCalendar';
import ResumoMensal from '@/components/ResumoMensal';
import RelatorioSemanal from '@/components/RelatorioSemanal';
import DashboardActions from '@/components/DashboardActions';
import { GuiaAbastecimento, CalculoDistribuicao } from '@/types';
import {
  calcularDistribuicaoSemanal,
  gerarCalendarioMes,
  filtrarGuiasDoMes
} from '@/utils/dashboardUtils';

interface DiaCalendario {
  dia: number;
  mesAtual: boolean;
  guias: GuiaAbastecimento[];
}

export default function HomePage() {
  const router = useRouter();

  // Estados principais
  const [mesAtual, setMesAtual] = useState(new Date());
  const [guias, setGuias] = useState<GuiaAbastecimento[]>([]);
  const [carregandoGuias, setCarregandoGuias] = useState(true);

  // Estados derivados
  const [diasCalendario, setDiasCalendario] = useState<DiaCalendario[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [distribuicaoSemanal, setDistribuicaoSemanal] = useState<CalculoDistribuicao[]>([]);
  const [guiasDoMes, setGuiasDoMes] = useState<GuiaAbastecimento[]>([]);

  useEffect(() => {
    carregarGuias();
  }, []);


  const carregarGuias = async () => {
    try {
      const response = await fetch('/api/guia-abastecimento');
      const data = await response.json();
      console.log(data)

      if (data.ok) {
        setGuias(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar guias:', error);
    } finally {
      setCarregandoGuias(false);
    }
  };

  const atualizarDadosDeriados = useCallback(() => {
    // Gera calendário do mês
    const calendario = gerarCalendarioMes(mesAtual, guias);
    setDiasCalendario(calendario);

    // Filtra guias do mês atual
    const guiasMes = filtrarGuiasDoMes(guias, mesAtual);
    setGuiasDoMes(guiasMes);

    // Calcula distribuição semanal
    const distribuicao = calcularDistribuicaoSemanal(guias);
    setDistribuicaoSemanal(distribuicao);
  }, [mesAtual, guias]);

  // Atualização dos dados derivados quando mês ou guias mudam
  useEffect(() => {
    if (guias.length > 0) {
      atualizarDadosDeriados();
    }
  }, [mesAtual, guias, atualizarDadosDeriados]);
  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    setMesAtual(prev => {
      const novaData = new Date(prev);
      if (direcao === 'anterior') {
        novaData.setMonth(novaData.getMonth() - 1);
      } else {
        novaData.setMonth(novaData.getMonth() + 1);
      }
      return novaData;
    });
    setDiaSelecionado(null);
  };

  const handleDiaClick = (dia: number) => {
    setDiaSelecionado(dia);
  };

  const handleGuiaClick = (guiaId: string) => {
    router.push(`/guia-abastecimento/${guiaId}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />

      <main className="container-custom py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Principal */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-[#4C6E5D] mb-4 sm:mb-6">
            Dashboard
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Calendário */}
            <DashboardCalendar
              mesAtual={mesAtual}
              diasCalendario={diasCalendario}
              diaSelecionado={diaSelecionado}
              onNavegar={navegarMes}
              onDiaClick={handleDiaClick}
              onGuiaClick={handleGuiaClick}
            />

            {/* Resumo do Mês */}
            <ResumoMensal
              guias={guiasDoMes}
              carregando={carregandoGuias}
            />
          </div>
        </div>

        {/* Relatório Semanal */}
        <RelatorioSemanal
          distribuicaoSemanal={distribuicaoSemanal}
          guias={guias}
          carregando={carregandoGuias}
        />

        {/* Ações do Dashboard */}
        <DashboardActions />
      </main>
    </div>
  );
}