'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
  Utensils,
  Calculator,
  Building2,
  PlusSquare,
  FileText,
  BarChart,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  CheckCircle
} from 'lucide-react';
import { GuiaAbastecimento } from '@/types';

interface DiaCalendario {
  dia: number;
  mesAtual: boolean;
  guias: GuiaAbastecimento[];
}

export default function HomePage() {
  const router = useRouter();
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diasCalendario, setDiasCalendario] = useState<DiaCalendario[]>([]);
  const [guias, setGuias] = useState<GuiaAbastecimento[]>([]);
  const [carregandoGuias, setCarregandoGuias] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);

  useEffect(() => {
    carregarGuias();
  }, []);

  useEffect(() => {
    gerarCalendario();
  }, [mesAtual, guias]);

  const carregarGuias = async () => {
    try {
      const response = await fetch('/api/guia-abastecimento');
      const data = await response.json();
      
      if (data.ok) {
        setGuias(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar guias:', error);
    } finally {
      setCarregandoGuias(false);
    }
  };

  const gerarCalendario = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const primeiroDiaSemana = primeiroDia.getDay();
    
    const dias: DiaCalendario[] = [];
    
    // Dias do mês anterior
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      const data = new Date(ano, mes, -i);
      dias.push({
        dia: data.getDate(),
        mesAtual: false,
        guias: []
      });
    }
    
    // Dias do mês atual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const dataAtual = new Date(ano, mes, dia);
      const guiasDoDia = guias.filter(guia => {
        const inicio = new Date(guia.dataInicio);
        const fim = new Date(guia.dataFim);
        return dataAtual >= inicio && dataAtual <= fim;
      });
      
      dias.push({
        dia,
        mesAtual: true,
        guias: guiasDoDia
      });
    }
    
    // Completar com dias do próximo mês
    const diasRestantes = 42 - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      dias.push({
        dia,
        mesAtual: false,
        guias: []
      });
    }
    
    setDiasCalendario(dias);
  };

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

  const getNomeMes = () => {
    return mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
        return null;
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

  const guiasDoMes = guias.filter(guia => {
    const inicio = new Date(guia.dataInicio);
    const fim = new Date(guia.dataFim);
    const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
    const ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
    
    return (inicio <= ultimoDiaMes && fim >= primeiroDiaMes);
  });

  const mainActions = [
    {
      title: 'Cadastrar Alimento',
      description: 'Adicione novos alimentos ao sistema',
      icon: <PlusSquare className="h-6 w-6" />,
      onClick: () => router.push('/cadastrarAlimento'),
      color: '#4C6E5D',
      primary: true
    },
    {
      title: 'Criar Cardápio',
      description: 'Monte cardápios completos',
      icon: <Utensils className="h-6 w-6" />,
      onClick: () => router.push('/cardapio'),
      color: '#6B7F66',
      primary: true
    },
    {
      title: 'Nova Guia',
      description: 'Gere guias de abastecimento',
      icon: <FileText className="h-6 w-6" />,
      onClick: () => router.push('/guia-abastecimento/criar'),
      color: '#4C6E5D',
      primary: true
    }
  ];

  const secondaryActions = [
    {
      title: 'Calculadora',
      icon: <Calculator className="h-5 w-5" />,
      onClick: () => router.push('/calcular')
    },
    {
      title: 'Instituições',
      icon: <Building2 className="h-5 w-5" />,
      onClick: () => router.push('/instituicoes')
    },
    {
      title: 'Ver Cardápios',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => router.push('/cardapios')
    },
    {
      title: 'Ver Guias',
      icon: <Package className="h-5 w-5" />,
      onClick: () => router.push('/guia-abastecimento')
    },
    {
      title: 'Relatórios',
      icon: <BarChart className="h-5 w-5" />,
      onClick: () => router.push('/relatorios')
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />

      <main className="container-custom py-6 px-4 md:px-6">
        {/* Dashboard com Calendário */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#4C6E5D] mb-6">Dashboard</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendário */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#4C6E5D] capitalize">
                  {getNomeMes()}
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
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                  <div key={dia} className="text-center text-sm font-medium text-gray-600 py-2">
                    {dia}
                  </div>
                ))}
                
                {diasCalendario.map((dia, index) => (
                  <div
                    key={index}
                    onClick={() => dia.mesAtual && setDiaSelecionado(dia.dia)}
                    className={`
                      min-h-[80px] p-2 border rounded-lg transition-all cursor-pointer
                      ${dia.mesAtual ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                      ${diaSelecionado === dia.dia && dia.mesAtual ? 'ring-2 ring-[#4C6E5D]' : ''}
                      ${dia.guias.length > 0 ? 'border-[#4C6E5D]' : 'border-gray-200'}
                    `}
                  >
                    <div className="font-medium text-sm mb-1">{dia.dia}</div>
                    {dia.guias.length > 0 && (
                      <div className="space-y-1">
                        {dia.guias.slice(0, 2).map((guia, i) => (
                          <div
                            key={i}
                            className={`h-1.5 rounded-full ${getStatusColor(guia.status)}`}
                            title={`${guia.instituicaoNome} - ${guia.status}`}
                          />
                        ))}
                        {dia.guias.length > 2 && (
                          <div className="text-xs text-gray-500">+{dia.guias.length - 2}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Legenda */}
              <div className="mt-6 flex gap-4 text-sm">
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

            {/* Resumo do Mês */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#4C6E5D] mb-4">
                Resumo do Mês
              </h3>
              
              {carregandoGuias ? (
                <p className="text-gray-500">Carregando...</p>
              ) : guiasDoMes.length === 0 ? (
                <p className="text-gray-500">Nenhuma guia neste mês</p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-3xl font-bold text-[#4C6E5D]">{guiasDoMes.length}</p>
                    <p className="text-sm text-gray-600">Guias no mês</p>
                  </div>
                  
                  <div className="space-y-2">
                    {guiasDoMes.slice(0, 3).map(guia => (
                      <div
                        key={guia.id}
                        onClick={() => router.push(`/guia-abastecimento/${guia.id}`)}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{guia.instituicaoNome}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(guia.dataInicio).toLocaleDateString('pt-BR')} - 
                              {new Date(guia.dataFim).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                            guia.status === 'Rascunho' ? 'bg-yellow-100 text-yellow-800' :
                            guia.status === 'Finalizado' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {getStatusIcon(guia.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {guiasDoMes.length > 3 && (
                    <button
                      onClick={() => router.push('/guia-abastecimento')}
                      className="w-full text-center text-sm text-[#4C6E5D] hover:text-[#6B7F66] transition"
                    >
                      Ver todas ({guiasDoMes.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ações Principais */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#4C6E5D] mb-4">Ações Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mainActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="flex flex-col items-center justify-center bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 text-center h-48 border-2 border-transparent hover:border-[#C8D5B9]"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${action.color}20` }}
                >
                  <div style={{ color: action.color }}>
                    {action.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Ações Secundárias */}
        <div>
          <h2 className="text-xl font-semibold text-[#4C6E5D] mb-4">Mais Opções</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {secondaryActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all justify-center md:justify-start"
              >
                <div className="text-[#4C6E5D]">
                  {action.icon}
                </div>
                <span className="font-medium text-sm hidden md:inline">{action.title}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}