import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GuiaAbastecimento } from '@/types';
import { formatarMesBr, getStatusColor } from '@/utils/dashboardUtils';

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

// const StatusIcon = ({ status }: { status: string }) => {
//   switch (status) {
//     case 'Rascunho':
//       return <Clock className="w-3 h-3" />;
//     case 'Finalizado':
//       return <CheckCircle className="w-3 h-3" />;
//     case 'Distribuído':
//       return <Package className="w-3 h-3" />;
//     default:
//       return null;
//   }
// };

export default function DashboardCalendar({
  mesAtual,
  diasCalendario,
  diaSelecionado,
  onNavegar,
  onDiaClick,
  onGuiaClick
}: DashboardCalendarProps) {
  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const diasSemanaCompleto = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 sm:p-6">
      {/* Cabeçalho do Calendário */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[#4C6E5D] capitalize">
          {formatarMesBr(mesAtual)}
        </h2>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => onNavegar('anterior')}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => onNavegar('proximo')}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Grid do Calendário */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {/* Cabeçalho dos dias da semana */}
        {diasSemana.map((dia, index) => (
          <div key={index} className="text-center text-xs sm:text-sm font-medium text-gray-600 py-1 sm:py-2">
            <span className="hidden sm:inline">{diasSemanaCompleto[index]}</span>
            <span className="sm:hidden">{dia}</span>
          </div>
        ))}
        
        {/* Dias do calendário */}
        {diasCalendario.map((dia, index) => (
          <CalendarDay
            key={index}
            dia={dia}
            isSelected={diaSelecionado === dia.dia && dia.mesAtual}
            onDiaClick={onDiaClick}
            onGuiaClick={onGuiaClick}
          />
        ))}
      </div>

      {/* Legenda */}
      <CalendarLegend />
    </div>
  );
}

interface CalendarDayProps {
  dia: DiaCalendario;
  isSelected: boolean;
  onDiaClick: (dia: number) => void;
  onGuiaClick: (guiaId: string) => void;
}

function CalendarDay({ dia, isSelected, onDiaClick, onGuiaClick }: CalendarDayProps) {
  const baseClasses = "min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 border rounded-md sm:rounded-lg transition-all cursor-pointer";
  const stateClasses = dia.mesAtual 
    ? "bg-white hover:bg-gray-50" 
    : "bg-gray-50 text-gray-400";
  const selectedClasses = isSelected ? "ring-2 ring-[#4C6E5D]" : "";
  const guiasClasses = dia.guias.length > 0 ? "border-[#4C6E5D]" : "border-gray-200";

  return (
    <div
      onClick={() => dia.mesAtual && onDiaClick(dia.dia)}
      className={`${baseClasses} ${stateClasses} ${selectedClasses} ${guiasClasses}`}
    >
      <div className="font-medium text-xs sm:text-sm mb-1">{dia.dia}</div>
      
      {dia.guias.length > 0 && (
        <GuiasIndicators 
          guias={dia.guias} 
          onGuiaClick={onGuiaClick}
        />
      )}
    </div>
  );
}

interface GuiasIndicatorsProps {
  guias: GuiaAbastecimento[];
  onGuiaClick: (guiaId: string) => void;
}

function GuiasIndicators({ guias, onGuiaClick }: GuiasIndicatorsProps) {
  return (
    <div className="space-y-0.5 sm:space-y-1">
      {guias.slice(0, 2).map((guia, i) => (
        <div
          key={i}
          className={`h-1 sm:h-1.5 rounded-full cursor-pointer ${getStatusColor(guia.status)}`}
          title={`${guia.instituicaoNome} - ${guia.status}`}
          onClick={(e) => {
            e.stopPropagation();
            onGuiaClick(guia.id);
          }}
        />
      ))}
      {guias.length > 2 && (
        <div className="text-xs text-gray-500">+{guias.length - 2}</div>
      )}
    </div>
  );
}

function CalendarLegend() {
  const legendItems = [
    { color: 'bg-yellow-400', label: 'Rascunho' },
    { color: 'bg-blue-400', label: 'Finalizado' },
    { color: 'bg-green-400', label: 'Distribuído' }
  ];

  return (
    <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
      {legendItems.map((item, index) => (
        <div key={index} className="flex items-center gap-1 sm:gap-2">
          <div className={`w-3 h-3 sm:w-4 sm:h-4 ${item.color} rounded`}></div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}