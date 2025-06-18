import { ChevronLeft, ChevronRight, Clock, CheckCircle, Package } from 'lucide-react';
import { GuiaAbastecimento } from '@/types';

interface DiaCalendario {
  dia: number;
  mesAtual: boolean;
  guias: GuiaAbastecimento[];
}

interface DashboardCalendarProps {
  mesAtual: Date;
  diasCalendario: DiaCalendario[];
  diaSelecionado: number | null;
  onNavegar: (direcao: 'anterior' | 'proximo') => void;
  onDiaClick: (dia: number) => void;
  onGuiaClick: (guiaId: string) => void;
}

export default function DashboardCalendar({
  mesAtual,
  diasCalendario,
  diaSelecionado,
  onNavegar,
  onDiaClick,
  onGuiaClick
}: DashboardCalendarProps) {
  const getNomeMes = () => {
    return mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#4C6E5D] capitalize">
          {getNomeMes()}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => onNavegar('anterior')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavegar('proximo')}
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
            onClick={() => dia.mesAtual && onDiaClick(dia.dia)}
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
                    className={`h-1.5 rounded-full ${getStatusColor(guia.status)} cursor-pointer`}
                    title={`${guia.instituicaoNome} - ${guia.status}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onGuiaClick(guia.id);
                    }}
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
  );
}